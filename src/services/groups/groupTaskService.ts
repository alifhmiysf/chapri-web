
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/config";
import {
  syncPublicTask,
  deletePublicTask,
} from "./publicProjectService";

// ==========================================
// TYPES
// ==========================================

export type GroupTaskStatus =
  | "todo"
  | "in_progress"
  | "completed";

export type GroupTaskPriority =
  | "low"
  | "medium"
  | "high";

export interface GroupTask {
  id: string;
  title: string;
  description: string;
  status: GroupTaskStatus;
  priority: GroupTaskPriority;
  createdBy: string;
  assignedTo: string | null;
  deadline: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CreateGroupTaskInput {
  title: string;
  description: string;
  priority: GroupTaskPriority;
  assignedTo?: string | null;
  deadline?: Date | null;
}

// ==========================================
// PUBLIC TASK SYNC
// ==========================================

const syncTaskToPublicPage = async (
  groupId: string,
  taskId: string
): Promise<void> => {
  try {
    const taskRef = doc(
      db,
      "groups",
      groupId,
      "tasks",
      taskId
    );

    const snapshot = await getDoc(taskRef);

    if (!snapshot.exists()) {
      return;
    }

    const task = {
      id: snapshot.id,
      ...snapshot.data(),
    } as GroupTask;

    await syncPublicTask(groupId, taskId, task);
  } catch (error) {
    console.error(
      "Failed to synchronize task to public page:",
      error
    );
  }
};

const removeTaskFromPublicPage = async (
  groupId: string,
  taskId: string
): Promise<void> => {
  try {
    await deletePublicTask(groupId, taskId);
  } catch (error) {
    console.error(
      "Failed to remove task from public page:",
      error
    );
  }
};

// ==========================================
// GET MEMBER ROLE
// ==========================================

const getMemberRole = async (
  groupId: string,
  userId: string
): Promise<"owner" | "admin" | "member" | null> => {
  const memberRef = doc(
    db,
    "groups",
    groupId,
    "members",
    userId
  );

  const memberSnapshot = await getDoc(memberRef);

  if (!memberSnapshot.exists()) {
    throw new Error("You are not a member of this group.");
  }

  const role = memberSnapshot.data().role;

  if (!["owner", "admin", "member"].includes(role)) {
    throw new Error("Invalid member role.");
  }

  return role;
};

// ==========================================
// CREATE GROUP TASK
// ==========================================

export const createGroupTask = async (
  groupId: string,
  userId: string,
  input: CreateGroupTaskInput
): Promise<string> => {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Task title is required.");
  }

  if (title.length > 150) {
    throw new Error("Task title cannot exceed 150 characters.");
  }

  if (!["low", "medium", "high"].includes(input.priority)) {
    throw new Error("Invalid task priority.");
  }

  await getMemberRole(groupId, userId);

  if (input.assignedTo) {
    await getMemberRole(groupId, input.assignedTo);
  }

  const tasksRef = collection(
    db,
    "groups",
    groupId,
    "tasks"
  );

  const taskRef = await addDoc(tasksRef, {
    title,
    description: input.description.trim(),
    status: "todo",
    priority: input.priority,
    createdBy: userId,
    assignedTo: input.assignedTo || null,
    deadline: input.deadline
      ? Timestamp.fromDate(input.deadline)
      : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Synchronize the newly created task to the public page.
  await syncTaskToPublicPage(groupId, taskRef.id);

  return taskRef.id;
};

// ==========================================
// GET GROUP TASKS
// ==========================================

export const getGroupTasks = async (
  groupId: string,
  userId: string
): Promise<GroupTask[]> => {
  await getMemberRole(groupId, userId);

  const tasksRef = collection(
    db,
    "groups",
    groupId,
    "tasks"
  );

  const snapshot = await getDocs(tasksRef);

  const tasks = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as GroupTask[];

  return tasks.sort((a, b) => {
    const timeA = a.createdAt?.toMillis() ?? 0;
    const timeB = b.createdAt?.toMillis() ?? 0;

    return timeB - timeA;
  });
};

// ==========================================
// UPDATE TASK DETAILS (OWNER / ADMIN)
// ==========================================

export const updateGroupTaskDetails = async (
  groupId: string,
  taskId: string,
  userId: string,
  input: {
    title: string;
    description: string;
    priority: GroupTaskPriority;
    assignedTo?: string | null;
    deadline?: Date | null;
  }
): Promise<void> => {
  const role = await getMemberRole(groupId, userId);

  if (role !== "owner" && role !== "admin") {
    throw new Error(
      "Only the owner or admin can edit task details."
    );
  }

  const title = input.title.trim();

  if (!title) {
    throw new Error("Task title is required.");
  }

  if (title.length > 150) {
    throw new Error("Task title cannot exceed 150 characters.");
  }

  if (!["low", "medium", "high"].includes(input.priority)) {
    throw new Error("Invalid task priority.");
  }

  if (input.assignedTo) {
    await getMemberRole(groupId, input.assignedTo);
  }

  const taskRef = doc(
    db,
    "groups",
    groupId,
    "tasks",
    taskId
  );

  await updateDoc(taskRef, {
    title,
    description: input.description.trim(),
    priority: input.priority,
    assignedTo: input.assignedTo || null,
    deadline: input.deadline
      ? Timestamp.fromDate(input.deadline)
      : null,
    updatedAt: serverTimestamp(),
  });

  // Synchronize updated task details.
  await syncTaskToPublicPage(groupId, taskId);
};

// ==========================================
// UPDATE TASK STATUS (ALL MEMBERS)
// ==========================================

export const updateGroupTaskStatus = async (
  groupId: string,
  taskId: string,
  userId: string,
  status: GroupTaskStatus
): Promise<void> => {
  await getMemberRole(groupId, userId);

  if (!["todo", "in_progress", "completed"].includes(status)) {
    throw new Error("Invalid task status.");
  }

  const taskRef = doc(
    db,
    "groups",
    groupId,
    "tasks",
    taskId
  );

  await updateDoc(taskRef, {
    status,
    updatedAt: serverTimestamp(),
  });

  // Synchronize task status and public progress.
  await syncTaskToPublicPage(groupId, taskId);
};

// ==========================================
// DELETE TASK (OWNER / ADMIN)
// ==========================================

export const deleteGroupTask = async (
  groupId: string,
  taskId: string,
  userId: string
): Promise<void> => {
  const role = await getMemberRole(groupId, userId);

  if (role !== "owner" && role !== "admin") {
    throw new Error(
      "Only the owner or admin can delete tasks."
    );
  }

  const taskRef = doc(
    db,
    "groups",
    groupId,
    "tasks",
    taskId
  );

  await deleteDoc(taskRef);

  // Remove the deleted task from the public page.
  await removeTaskFromPublicPage(groupId, taskId);
};
