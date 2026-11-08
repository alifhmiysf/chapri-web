
import type { SharedTaskPayload } from "./taskShareService";

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "../firebase/config";

// ==========================================
// TYPES
// ==========================================

export interface GroupChatMessage {
  id: string;
  senderId: string;
  text: string;
  type?: "text" | "task";
  task?: SharedTaskPayload;
  createdAt?: Timestamp;
}

// ==========================================
// HELPERS
// ==========================================

const validateId = (
  value: unknown,
  fieldName: string
): asserts value is string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is missing or invalid.`);
  }
};

const getGroupChatId = (groupId: string): string => {
  validateId(groupId, "Group ID");
  return `group_${groupId}`;
};

// ==========================================
// GET OR CREATE GROUP CHAT
// ==========================================

export const getOrCreateGroupChat = async (
  groupId: string,
  userId: string
): Promise<string> => {
  validateId(groupId, "Group ID");
  validateId(userId, "User ID");

  const chatId = getGroupChatId(groupId);

  const memberRef = doc(
    db,
    "groups",
    groupId,
    "members",
    userId
  );

  const chatRef = doc(db, "chats", chatId);

  await runTransaction(db, async (transaction) => {
    // READ MEMBERSHIP AND CHAT
    const [memberSnapshot, chatSnapshot] = await Promise.all([
      transaction.get(memberRef),
      transaction.get(chatRef),
    ]);

    if (!memberSnapshot.exists()) {
      throw new Error("You are not a member of this group.");
    }

    if (!chatSnapshot.exists()) {
      // CREATE GROUP CHAT
      transaction.set(chatRef, {
        type: "group",
        groupId,
        participants: [],
        createdBy: userId,
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return;
    }

    const chatData = chatSnapshot.data();

    if (
      chatData.type !== "group" ||
      chatData.groupId !== groupId
    ) {
      throw new Error("Invalid group chat.");
    }
  });

  return chatId;
};

// ==========================================
// LISTEN TO GROUP MESSAGES
// ==========================================

export const listenToGroupMessages = (
  groupId: string,
  callback: (messages: GroupChatMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  validateId(groupId, "Group ID");

  const chatId = getGroupChatId(groupId);

  const messagesRef = collection(
    db,
    "chats",
    chatId,
    "messages"
  );

  const messagesQuery = query(
    messagesRef,
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as GroupChatMessage[];

      callback(messages);
    },
    (error) => {
      console.error("Listen group messages error:", error);
      onError?.(error);
    }
  );
};

// ==========================================
// SEND GROUP MESSAGE
// ==========================================

export const sendGroupMessage = async (
  groupId: string,
  senderId: string,
  messageText: string
): Promise<void> => {
  validateId(groupId, "Group ID");
  validateId(senderId, "Sender ID");

  const text = messageText.trim();

  if (!text) {
    throw new Error("Message cannot be empty.");
  }

  if (text.length > 5000) {
    throw new Error("Message cannot exceed 5000 characters.");
  }

  const chatId = getGroupChatId(groupId);

  const chatRef = doc(db, "chats", chatId);

  const memberRef = doc(
    db,
    "groups",
    groupId,
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
      throw new Error("You are not a member of this group.");
    }

    if (!chatSnapshot.exists()) {
      throw new Error("Group chat not found.");
    }

    const chatData = chatSnapshot.data();

    if (
      chatData.type !== "group" ||
      chatData.groupId !== groupId
    ) {
      throw new Error("Invalid group chat.");
    }

    // WRITE MESSAGE
    transaction.set(messageRef, {
      senderId,
      type: "text",
      text,
      createdAt: serverTimestamp(),
    });

    // UPDATE CHAT METADATA
    transaction.update(chatRef, {
      lastMessage: text.slice(0, 120),
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
};
