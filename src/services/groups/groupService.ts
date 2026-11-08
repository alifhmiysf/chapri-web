
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  updateDoc,
  serverTimestamp,
  runTransaction,
  type DocumentReference,
} from "firebase/firestore";

import { db } from "../firebase/config";

export type GroupRole = "owner" | "admin" | "member";

export interface Group {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  inviteCode: string;
  publicShareId?: string;
  publicEnabled?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GroupMember {
  uid: string;
  displayName: string;
  email: string;
  role: GroupRole;
  inviteCode?: string;
  joinedAt?: unknown;
}

// ==========================================
// GENERATE INVITATION CODE
// ==========================================

const generateInviteCode = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

// ==========================================
// BATCH DELETE HELPER
// ==========================================

const deleteDocumentsInChunks = async (
  documentRefs: DocumentReference[]
) => {
  const chunkSize = 450;

  for (let i = 0; i < documentRefs.length; i += chunkSize) {
    const batch = writeBatch(db);

    documentRefs.slice(i, i + chunkSize).forEach((ref) => {
      batch.delete(ref);
    });

    await batch.commit();
  }
};

// ==========================================
// CREATE GROUP
// ==========================================

export const createGroup = async (
  user: { uid: string; displayName: string | null; email: string | null },
  name: string,
  description: string
) => {
  if (!name.trim()) {
    throw new Error("Group name is required.");
  }

  const groupRef = doc(collection(db, "groups"));
  const inviteCode = generateInviteCode();

  const inviteRef = doc(db, "inviteCodes", inviteCode);
  const memberRef = doc(db, "groups", groupRef.id, "members", user.uid);

  const batch = writeBatch(db);

  batch.set(groupRef, {
    name: name.trim(),
    description: description.trim(),
    ownerId: user.uid,
    inviteCode,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(memberRef, {
    uid: user.uid,
    displayName: user.displayName ?? "User",
    email: user.email ?? "",
    role: "owner",
    joinedAt: serverTimestamp(),
  });

  batch.set(inviteRef, {
    groupId: groupRef.id,
    createdAt: serverTimestamp(),
  });

  await batch.commit();

  return groupRef.id;
};

// ==========================================
// GET MY GROUPS
// ==========================================

export const getMyGroups = async (userId: string): Promise<Group[]> => {
  const membersQuery = query(
    collectionGroup(db, "members"),
    where("uid", "==", userId)
  );

  const memberSnapshot = await getDocs(membersQuery);

  const groups = await Promise.all(
    memberSnapshot.docs.map(async (memberDoc) => {
      const parentGroup = memberDoc.ref.parent.parent;

      if (!parentGroup) return null;

      const groupSnapshot = await getDoc(parentGroup);

      if (!groupSnapshot.exists()) return null;

      return {
        id: groupSnapshot.id,
        ...groupSnapshot.data(),
      } as Group;
    })
  );

  return groups.filter((group): group is Group => group !== null);
};

// ==========================================
// GET GROUP
// ==========================================

export const getGroup = async (groupId: string): Promise<Group | null> => {
  const snapshot = await getDoc(doc(db, "groups", groupId));

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Group;
};

// ==========================================
// GET GROUP MEMBERS
// ==========================================

export const getGroupMembers = async (
  groupId: string
): Promise<GroupMember[]> => {
  const snapshot = await getDocs(
    collection(db, "groups", groupId, "members")
  );

  return snapshot.docs.map((item) => ({
    ...item.data(),
    uid: item.id,
  }) as GroupMember);
};

// ==========================================
// UPDATE GROUP INFORMATION
// ==========================================

export const updateGroup = async (
  groupId: string,
  name: string,
  description: string
) => {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error("Group name is required.");
  }

  if (normalizedName.length > 100) {
    throw new Error("Group name cannot exceed 100 characters.");
  }

  await updateDoc(doc(db, "groups", groupId), {
    name: normalizedName,
    description: description.trim(),
    updatedAt: serverTimestamp(),
  });
};

// ==========================================
// JOIN GROUP
// ==========================================

export const joinGroup = async (
  user: { uid: string; displayName: string | null; email: string | null },
  inviteCode: string
) => {
  const normalizedCode = inviteCode.trim().toLowerCase();

  if (!normalizedCode) {
    throw new Error("Invitation code is required.");
  }

  const inviteRef = doc(db, "inviteCodes", normalizedCode);

  await runTransaction(db, async (transaction) => {
    const inviteSnapshot = await transaction.get(inviteRef);

    if (!inviteSnapshot.exists()) {
      throw new Error("Invalid invitation code.");
    }

    const groupId = inviteSnapshot.data().groupId;

    if (!groupId || typeof groupId !== "string") {
      throw new Error("Invalid invitation data.");
    }

    const memberRef = doc(
      db,
      "groups",
      groupId,
      "members",
      user.uid
    );

    const memberSnapshot = await transaction.get(memberRef);

    if (memberSnapshot.exists()) {
      throw new Error("You are already a group member.");
    }

    transaction.set(memberRef, {
      uid: user.uid,
      displayName: user.displayName ?? "User",
      email: user.email ?? "",
      role: "member",
      inviteCode: normalizedCode,
      joinedAt: serverTimestamp(),
    });
  });

  return true;
};

// ==========================================
// CHANGE MEMBER ROLE
// ==========================================

export const changeMemberRole = async (
  groupId: string,
  actorId: string,
  targetId: string,
  newRole: "admin" | "member"
) => {
  if (actorId === targetId) {
    throw new Error("You cannot change your own role.");
  }

  await runTransaction(db, async (transaction) => {
    const actorRef = doc(db, "groups", groupId, "members", actorId);
    const targetRef = doc(db, "groups", groupId, "members", targetId);

    const actorSnapshot = await transaction.get(actorRef);
    const targetSnapshot = await transaction.get(targetRef);

    if (!actorSnapshot.exists() || actorSnapshot.data().role !== "owner") {
      throw new Error("Only the group owner can change member roles.");
    }

    if (!targetSnapshot.exists() || targetSnapshot.data().role === "owner") {
      throw new Error("Invalid target member.");
    }

    transaction.update(targetRef, {
      role: newRole,
    });
  });
};

// ==========================================
// REMOVE MEMBER
// ==========================================

export const removeMember = async (
  groupId: string,
  actorId: string,
  targetId: string
) => {
  if (actorId === targetId) {
    throw new Error("Use leaveGroup to leave the group.");
  }

  await runTransaction(db, async (transaction) => {
    const actorRef = doc(db, "groups", groupId, "members", actorId);
    const targetRef = doc(db, "groups", groupId, "members", targetId);

    const actorSnapshot = await transaction.get(actorRef);
    const targetSnapshot = await transaction.get(targetRef);

    if (!actorSnapshot.exists() || !targetSnapshot.exists()) {
      throw new Error("Member not found.");
    }

    const actorRole = actorSnapshot.data().role;
    const targetRole = targetSnapshot.data().role;

    if (!["owner", "admin"].includes(actorRole)) {
      throw new Error("You do not have permission to remove members.");
    }

    if (targetRole === "owner") {
      throw new Error("The group owner cannot be removed.");
    }

    if (actorRole === "admin" && targetRole !== "member") {
      throw new Error("Admins can only remove regular members.");
    }

    transaction.delete(targetRef);
  });
};

// ==========================================
// LEAVE GROUP
// ==========================================

export const leaveGroup = async (
  groupId: string,
  userId: string
) => {
  await runTransaction(db, async (transaction) => {
    const memberRef = doc(db, "groups", groupId, "members", userId);
    const memberSnapshot = await transaction.get(memberRef);

    if (!memberSnapshot.exists()) {
      throw new Error("You are not a member of this group.");
    }

    if (memberSnapshot.data().role === "owner") {
      throw new Error("The group owner cannot leave the group.");
    }

    transaction.delete(memberRef);
  });
};

// ==========================================
// DELETE GROUP (OWNER ONLY)
// ==========================================

export const deleteGroup = async (
  groupId: string,
  actorId: string
) => {
  const groupRef = doc(db, "groups", groupId);

  const ownerMemberRef = doc(
    db,
    "groups",
    groupId,
    "members",
    actorId
  );

  // Verify ownership.
  const [groupSnapshot, ownerSnapshot] = await Promise.all([
    getDoc(groupRef),
    getDoc(ownerMemberRef),
  ]);

  if (!groupSnapshot.exists()) {
    throw new Error("Group not found.");
  }

  const groupData = groupSnapshot.data();

  if (
    !ownerSnapshot.exists() ||
    ownerSnapshot.data().role !== "owner" ||
    groupData.ownerId !== actorId
  ) {
    throw new Error("Only the group owner can delete this group.");
  }

  // 1. Delete group tasks.
  const groupTasksSnapshot = await getDocs(
    collection(db, "groups", groupId, "tasks")
  );

  await deleteDocumentsInChunks(
    groupTasksSnapshot.docs.map((item) => item.ref)
  );

  // 2. Delete public project and its subcollections.
  // Use publicShareId from the group document instead of querying
  // the publicProjects collection. This also works when sharing is disabled.
  const publicShareId =
    typeof groupData.publicShareId === "string"
      ? groupData.publicShareId
      : null;

  if (publicShareId) {
    const projectRef = doc(db, "publicProjects", publicShareId);
    const projectSnapshot = await getDoc(projectRef);

    if (projectSnapshot.exists()) {
      const [projectTasks, projectMembers] = await Promise.all([
        getDocs(collection(projectRef, "tasks")),
        getDocs(collection(projectRef, "members")),
      ]);

      await deleteDocumentsInChunks([
        ...projectTasks.docs.map((item) => item.ref),
        ...projectMembers.docs.map((item) => item.ref),
      ]);

      await deleteDocumentsInChunks([projectRef]);
    }
  }

  // 3. Delete group chat messages.
  const groupChatId = `group_${groupId}`;
  const groupChatRef = doc(db, "chats", groupChatId);
  const groupChatSnapshot = await getDoc(groupChatRef);

  if (groupChatSnapshot.exists()) {
    const messagesSnapshot = await getDocs(
      collection(db, "chats", groupChatId, "messages")
    );

    await deleteDocumentsInChunks(
      messagesSnapshot.docs.map((item) => item.ref)
    );

    // 4. Delete group chat document.
    await deleteDocumentsInChunks([groupChatRef]);
  }

  // 5. Delete invitation code.
  const inviteCode = groupData.inviteCode;

  if (typeof inviteCode === "string" && inviteCode.length > 0) {
    const inviteRef = doc(db, "inviteCodes", inviteCode);
    const inviteSnapshot = await getDoc(inviteRef);

    if (inviteSnapshot.exists()) {
      await deleteDocumentsInChunks([inviteRef]);
    }
  }

  // 6. Delete non-owner members.
  const membersSnapshot = await getDocs(
    collection(db, "groups", groupId, "members")
  );

  const nonOwnerMembers = membersSnapshot.docs.filter(
    (item) => item.id !== actorId
  );

  await deleteDocumentsInChunks(
    nonOwnerMembers.map((item) => item.ref)
  );

  // 7. Delete group and owner membership together.
  // The Firestore rules must permit this final owner deletion.
  const finalBatch = writeBatch(db);

  finalBatch.delete(groupRef);
  finalBatch.delete(ownerMemberRef);

  await finalBatch.commit();
};
