
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  type Transaction,
} from "firebase/firestore";

import { db } from "../firebase/config";

// ==========================================
// TYPES
// ==========================================

export type SharedTaskSource = "personal" | "group";

export type SharedTaskStatus =
  | "todo"
  | "in_progress"
  | "completed";

export type SharedTaskPriority =
  | "low"
  | "medium"
  | "high";

export interface SharedTaskPayload {
  id: string;
  source: SharedTaskSource;
  sourceGroupId: string | null;
  title: string;
  description: string;
  status: SharedTaskStatus;
  priority: SharedTaskPriority;
  deadline: string | null;
}

// ==========================================
// VALIDATION HELPERS
// ==========================================

function validateId(
  value: unknown,
  fieldName: string
): asserts value is string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(`${fieldName} is missing or invalid.`);
  }
}

const validateTask = (task: SharedTaskPayload): void => {
  if (!task || typeof task !== "object") {
    throw new Error("Task data is missing.");
  }

  validateId(task.id, "Task ID");

  if (
    typeof task.title !== "string" ||
    task.title.trim().length === 0 ||
    task.title.length > 150
  ) {
    throw new Error("Task title is invalid.");
  }

  if (
    task.status !== "todo" &&
    task.status !== "in_progress" &&
    task.status !== "completed"
  ) {
    throw new Error("Invalid task status.");
  }

  if (
    task.priority !== "low" &&
    task.priority !== "medium" &&
    task.priority !== "high"
  ) {
    throw new Error("Invalid task priority.");
  }

  if (
    task.source !== "personal" &&
    task.source !== "group"
  ) {
    throw new Error("Invalid task source.");
  }

  if (task.source === "group") {
    validateId(task.sourceGroupId, "Source group ID");
  }

  if (typeof task.description !== "string") {
    throw new Error("Invalid task description.");
  }

  if (
    task.deadline !== null &&
    typeof task.deadline !== "string"
  ) {
    throw new Error("Invalid task deadline.");
  }
};

// ==========================================
// VALIDATE ORIGINAL TASK
// ==========================================

const validateTaskSource = async (
  transaction: Transaction,
  senderId: string,
  task: SharedTaskPayload
): Promise<void> => {
  validateId(senderId, "Sender ID");
  validateTask(task);

  // PERSONAL TASK
  if (task.source === "personal") {
    const taskRef = doc(db, "tasks", task.id);

    const taskSnapshot = await transaction.get(taskRef);

    if (!taskSnapshot.exists()) {
      throw new Error("Personal task not found.");
    }

    const originalTask = taskSnapshot.data();

    if (originalTask.userId !== senderId) {
      throw new Error(
        "You cannot share this personal task."
      );
    }

    return;
  }

  // GROUP TASK
  const groupId = task.sourceGroupId;

  validateId(groupId, "Source group ID");

  const taskRef = doc(
    db,
    "groups",
    groupId,
    "tasks",
    task.id
  );

  const memberRef = doc(
    db,
    "groups",
    groupId,
    "members",
    senderId
  );

  const [taskSnapshot, memberSnapshot] = await Promise.all([
    transaction.get(taskRef),
    transaction.get(memberRef),
  ]);

  if (!taskSnapshot.exists()) {
    throw new Error("Group task not found.");
  }

  if (!memberSnapshot.exists()) {
    throw new Error(
      "You are not a member of the source group."
    );
  }
};

// ==========================================
// CREATE TASK MESSAGE
// ==========================================

const createTaskMessage = (
  senderId: string,
  task: SharedTaskPayload
) => {
  return {
    senderId,
    type: "task",
    text: task.title,
    task: {
      id: task.id,
      source: task.source,
      sourceGroupId: task.sourceGroupId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
    },
    createdAt: serverTimestamp(),
  };
};

// ==========================================
// SHARE TASK TO PRIVATE CHAT
// ==========================================

export const shareTaskToPrivateChat = async (
  chatId: string,
  senderId: string,
  task: SharedTaskPayload
): Promise<void> => {
  validateId(chatId, "Chat ID");
  validateId(senderId, "Sender ID");
  validateTask(task);

  const chatRef = doc(db, "chats", chatId);

  const messageRef = doc(
    collection(db, "chats", chatId, "messages")
  );

  await runTransaction(db, async (transaction) => {
    // READ CHAT
    const chatSnapshot = await transaction.get(chatRef);

    if (!chatSnapshot.exists()) {
      throw new Error("Conversation not found.");
    }

    const chatData = chatSnapshot.data();

    if (
      chatData.type !== "private" ||
      !Array.isArray(chatData.participants) ||
      !chatData.participants.includes(senderId)
    ) {
      throw new Error(
        "You cannot share a task in this conversation."
      );
    }

    // VALIDATE ORIGINAL TASK
    await validateTaskSource(
      transaction,
      senderId,
      task
    );

    // WRITE MESSAGE
    transaction.set(
      messageRef,
      createTaskMessage(senderId, task)
    );

    // UPDATE CHAT METADATA
    transaction.update(chatRef, {
      lastMessage: `[Task] ${task.title}`.slice(0, 120),
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
};

// ==========================================
// SHARE TASK TO GROUP CHAT
// ==========================================

export const shareTaskToGroupChat = async (
  destinationGroupId: string,
  senderId: string,
  task: SharedTaskPayload
): Promise<void> => {
  validateId(destinationGroupId, "Destination group ID");
  validateId(senderId, "Sender ID");
  validateTask(task);

  if (task.source !== "group") {
    throw new Error(
      "Only group tasks can be shared to a group chat."
    );
  }

  if (task.sourceGroupId !== destinationGroupId) {
    throw new Error(
      "Task does not belong to this destination group."
    );
  }

  const chatId = `group_${destinationGroupId}`;

  const chatRef = doc(db, "chats", chatId);

  const memberRef = doc(
    db,
    "groups",
    destinationGroupId,
    "members",
    senderId
  );

  const messageRef = doc(
    collection(db, "chats", chatId, "messages")
  );

  await runTransaction(db, async (transaction) => {
    // READ MEMBERSHIP AND CHAT
    const [memberSnapshot, chatSnapshot] = await Promise.all([
      transaction.get(memberRef),
      transaction.get(chatRef),
    ]);

    if (!memberSnapshot.exists()) {
      throw new Error(
        "You are not a member of the destination group."
      );
    }

    if (!chatSnapshot.exists()) {
      throw new Error(
        "Group chat not found. Open the group chat first."
      );
    }

    const chatData = chatSnapshot.data();

    if (
      chatData.type !== "group" ||
      chatData.groupId !== destinationGroupId
    ) {
      throw new Error("Invalid group conversation.");
    }

    // VALIDATE ORIGINAL TASK
    await validateTaskSource(
      transaction,
      senderId,
      task
    );

    // WRITE MESSAGE
    transaction.set(
      messageRef,
      createTaskMessage(senderId, task)
    );

    // UPDATE CHAT METADATA
    transaction.update(chatRef, {
      lastMessage: `[Task] ${task.title}`.slice(0, 120),
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
};
