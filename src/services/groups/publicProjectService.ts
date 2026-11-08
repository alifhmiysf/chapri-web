
import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";
import type { GroupTask } from "./groupTaskService";

// ==========================================
// TYPES
// ==========================================

export interface PublicProjectTask {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  deadline: Timestamp | null;
  updatedAt?: Timestamp;
}

export interface PublicProjectMember {
  id: string;
  displayName: string;
  role: string;
}

export interface PublicProject {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  ownerGroupId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ==========================================
// FIRESTORE REFERENCES
// ==========================================

const getGroupReference = (groupId: string) =>
  doc(db, "groups", groupId);

const getPublicReference = (shareId: string) =>
  doc(db, "publicProjects", shareId);

// ==========================================
// VALIDATE PERMISSION
// ==========================================

const validateSharePermission = async (
  groupId: string,
  userId: string
) => {
  const groupSnapshot = await getDoc(
    getGroupReference(groupId)
  );

  if (!groupSnapshot.exists()) {
    throw new Error("Group not found.");
  }

  const groupData = groupSnapshot.data();

  // Group owner can manage public sharing.
  if (groupData.ownerId === userId) {
    return groupData;
  }

  // Check membership role for other users.
  const memberSnapshot = await getDoc(
    doc(db, "groups", groupId, "members", userId)
  );

  if (
    !memberSnapshot.exists() ||
    !["owner", "admin"].includes(memberSnapshot.data().role)
  ) {
    throw new Error(
      "You are not allowed to manage public sharing."
    );
  }

  return groupData;
};

// ==========================================
// ENABLE PUBLIC PROJECT
// ==========================================

export const enablePublicProject = async (
  groupId: string,
  userId: string
): Promise<string> => {
  // Validate current user's permission.
  const groupData = await validateSharePermission(
    groupId,
    userId
  );

  // Reuse existing share ID when available.
  const existingShareId = groupData.publicShareId as
    | string
    | undefined;

  // Generate a new share ID if this is the first activation.
  const shareId =
    existingShareId ||
    doc(collection(db, "publicProjects")).id;

  const publicRef = getPublicReference(shareId);

  /*
   * Only read the existing public document when the group
   * already has a share ID.
   *
   * This avoids reading a nonexistent document with a new ID.
   */
  const publicSnapshot = existingShareId
    ? await getDoc(publicRef)
    : null;

  // Retrieve group tasks and members.
  const [taskSnapshot, memberSnapshot] = await Promise.all([
    getDocs(
      collection(db, "groups", groupId, "tasks")
    ),
    getDocs(
      collection(db, "groups", groupId, "members")
    ),
  ]);

  // ------------------------------------------
  // BATCH 1: ACTIVATE PUBLIC PROJECT
  // ------------------------------------------

  const projectBatch = writeBatch(db);

  const projectData: Record<string, unknown> = {
    name: groupData.name || "Untitled Project",
    description: groupData.description || "",
    ownerGroupId: groupId,
    isPublic: true,
    updatedAt: serverTimestamp(),
  };

  if (publicSnapshot?.exists()) {
    projectData.createdAt =
      publicSnapshot.data().createdAt ||
      serverTimestamp();

    projectBatch.update(publicRef, projectData);
  } else {
    projectData.createdAt = serverTimestamp();

    projectBatch.set(publicRef, projectData);
  }

  // Save public sharing settings to the group document.
  projectBatch.update(
    getGroupReference(groupId),
    {
      publicShareId: shareId,
      publicEnabled: true,
      updatedAt: serverTimestamp(),
    }
  );

  await projectBatch.commit();

  // ------------------------------------------
  // BATCH 2: COPY TASKS AND MEMBERS
  // ------------------------------------------

  const contentBatch = writeBatch(db);

  // Copy tasks without exposing private task fields.
  taskSnapshot.docs.forEach((taskDoc) => {
    const task = taskDoc.data();

    contentBatch.set(
      doc(publicRef, "tasks", taskDoc.id),
      {
        title: task.title || "",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        deadline: task.deadline || null,
        updatedAt: serverTimestamp(),
      }
    );
  });

  // Copy only public member information.
  memberSnapshot.docs.forEach((memberDoc) => {
    const member = memberDoc.data();

    contentBatch.set(
      doc(publicRef, "members", memberDoc.id),
      {
        displayName:
          member.displayName || "Team Member",
        role: member.role || "member",
      }
    );
  });

  // Avoid committing an empty batch.
  if (taskSnapshot.size + memberSnapshot.size > 0) {
    await contentBatch.commit();
  }

  return shareId;
};

// ==========================================
// DISABLE PUBLIC PROJECT
// ==========================================

export const disablePublicProject = async (
  groupId: string,
  userId: string
): Promise<void> => {
  const groupData = await validateSharePermission(
    groupId,
    userId
  );

  const shareId = groupData.publicShareId as
    | string
    | undefined;

  const batch = writeBatch(db);

  // Disable sharing on the private group document.
  batch.update(
    getGroupReference(groupId),
    {
      publicEnabled: false,
      updatedAt: serverTimestamp(),
    }
  );

  // Disable public access without deleting the mirror.
  if (shareId) {
    batch.update(
      getPublicReference(shareId),
      {
        isPublic: false,
        updatedAt: serverTimestamp(),
      }
    );
  }

  await batch.commit();
};

// ==========================================
// GET PUBLIC SHARE SETTINGS
// ==========================================

export const getPublicShareSettings = async (
  groupId: string
): Promise<{
  shareId: string | null;
  enabled: boolean;
}> => {
  const snapshot = await getDoc(
    getGroupReference(groupId)
  );

  if (!snapshot.exists()) {
    return {
      shareId: null,
      enabled: false,
    };
  }

  const data = snapshot.data();

  return {
    shareId:
      (data.publicShareId as string) || null,
    enabled: data.publicEnabled === true,
  };
};

// ==========================================
// SYNC PUBLIC TASK CREATE / UPDATE
// ==========================================

export const syncPublicTask = async (
  groupId: string,
  taskId: string,
  task: GroupTask
): Promise<void> => {
  const groupSnapshot = await getDoc(
    getGroupReference(groupId)
  );

  if (!groupSnapshot.exists()) return;

  const groupData = groupSnapshot.data();

  // Do not synchronize tasks when sharing is disabled.
  if (
    groupData.publicEnabled !== true ||
    !groupData.publicShareId
  ) {
    return;
  }

  const shareId = groupData.publicShareId as string;

  const publicTaskReference = doc(
    db,
    "publicProjects",
    shareId,
    "tasks",
    taskId
  );

  const batch = writeBatch(db);

  // Update public task mirror.
  batch.set(publicTaskReference, {
    title: task.title,
    description: task.description || "",
    status: task.status,
    priority: task.priority,
    deadline: task.deadline || null,
    updatedAt: serverTimestamp(),
  });

  // Update public project timestamp.
  batch.update(
    getPublicReference(shareId),
    {
      updatedAt: serverTimestamp(),
    }
  );

  await batch.commit();
};

// ==========================================
// SYNC PUBLIC TASK DELETE
// ==========================================

export const deletePublicTask = async (
  groupId: string,
  taskId: string
): Promise<void> => {
  const groupSnapshot = await getDoc(
    getGroupReference(groupId)
  );

  if (!groupSnapshot.exists()) return;

  const groupData = groupSnapshot.data();

  // Do not synchronize when public sharing is disabled.
  if (
    groupData.publicEnabled !== true ||
    !groupData.publicShareId
  ) {
    return;
  }

  const shareId = groupData.publicShareId as string;

  const batch = writeBatch(db);

  // Remove the task from the public mirror.
  batch.delete(
    doc(
      db,
      "publicProjects",
      shareId,
      "tasks",
      taskId
    )
  );

  // Update public project timestamp.
  batch.update(
    getPublicReference(shareId),
    {
      updatedAt: serverTimestamp(),
    }
  );

  await batch.commit();
};
