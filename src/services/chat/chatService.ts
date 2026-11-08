
import type { SharedTaskPayload } from "./taskShareService";

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "../firebase/config";

// ==========================================
// TYPES
// ==========================================

export interface Chat {
  id: string;
  type: "private" | "group";
  participants: string[];
  groupId: string | null;
  createdBy: string;
  lastMessage: string;
  lastMessageAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ChatMessage {
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

const emptyUnsubscribe: Unsubscribe = () => {};

const validateRequiredId = (value: string, fieldName: string) => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} is required.`);
  }
};

// ==========================================
// CREATE OR GET PRIVATE CHAT
// ==========================================

export const getOrCreatePrivateChat = async (
  currentUserId: string,
  targetUserId: string
): Promise<string> => {
  validateRequiredId(currentUserId, "Current user ID");
  validateRequiredId(targetUserId, "Target user ID");

  if (currentUserId === targetUserId) {
    throw new Error("You cannot create a chat with yourself.");
  }

  const participants = [currentUserId, targetUserId].sort();
  const chatId = participants.join("_");

  const chatRef = doc(db, "chats", chatId);

  await runTransaction(db, async (transaction) => {
    const chatSnapshot = await transaction.get(chatRef);

    if (!chatSnapshot.exists()) {
      transaction.set(chatRef, {
        type: "private",
        participants,
        groupId: null,
        createdBy: currentUserId,
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return;
    }

    const data = chatSnapshot.data();

    if (
      data.type !== "private" ||
      !Array.isArray(data.participants) ||
      participants.length !== data.participants.length ||
      participants.some(
        (participant) => !data.participants.includes(participant)
      )
    ) {
      throw new Error("Invalid private chat.");
    }
  });

  return chatId;
};

// ==========================================
// SEND PRIVATE MESSAGE
// ==========================================

export const sendPrivateMessage = async (
  chatId: string,
  senderId: string,
  messageText: string
): Promise<void> => {
  validateRequiredId(chatId, "Chat ID");
  validateRequiredId(senderId, "Sender ID");

  const text = messageText.trim();

  if (!text) {
    throw new Error("Message cannot be empty.");
  }

  if (text.length > 5000) {
    throw new Error("Message cannot exceed 5000 characters.");
  }

  const chatRef = doc(db, "chats", chatId);

  const messageRef = doc(
    collection(db, "chats", chatId, "messages")
  );

  await runTransaction(db, async (transaction) => {
    const chatSnapshot = await transaction.get(chatRef);

    if (!chatSnapshot.exists()) {
      throw new Error("Chat not found.");
    }

    const chatData = chatSnapshot.data();

    if (
        chatData.type !== "private" ||
        !Array.isArray(chatData.participants) ||
        !chatData.participants.includes(senderId)
    ) {
        throw new Error("You are not allowed to send messages here.");
    }

    transaction.set(messageRef, {
        senderId,
        text,
        createdAt: serverTimestamp(),
    });

    transaction.update(chatRef, {
        lastMessage: text.slice(0, 120),
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    });
};

// ==========================================
// REALTIME: LIST PRIVATE CHATS
// ==========================================

export const listenToPrivateChats = (
  userId: string,
  callback: (chats: Chat[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  // Prevent Firestore query with undefined or empty user ID.
  if (typeof userId !== "string" || userId.trim() === "") {
    const error = new Error(
      "Cannot listen to private chats: valid user ID is required."
    );

    console.error(error.message);
    onError?.(error);

    return emptyUnsubscribe;
  }

  const chatsRef = collection(db, "chats");

  const chatsQuery = query(
    chatsRef,
    where("participants", "array-contains", userId),
    where("type", "==", "private")
  );

  return onSnapshot(
    chatsQuery,
    (snapshot) => {
      const chats: Chat[] = snapshot.docs
        .map((item) => ({
          ...item.data(),
          id: item.id,
        }) as Chat)
        .sort((a, b) => {
          const dateA = a.lastMessageAt?.toMillis() ?? 0;
          const dateB = b.lastMessageAt?.toMillis() ?? 0;

          return dateB - dateA;
        });

      callback(chats);
    },
    (error) => {
      console.error("Listen private chats error:", error);
      onError?.(error);
    }
  );
};

// ==========================================
// REALTIME: LIST CHAT MESSAGES
// ==========================================

export const listenToPrivateMessages = (
  chatId: string,
  callback: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  if (typeof chatId !== "string" || chatId.trim() === "") {
    const error = new Error(
      "Cannot listen to messages: valid chat ID is required."
    );

    console.error(error.message);
    onError?.(error);

    return emptyUnsubscribe;
  }

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
      const messages: ChatMessage[] = snapshot.docs.map((item) => ({
        ...item.data(),
        id: item.id,
      })) as ChatMessage[];

      callback(messages);
    },
    (error) => {
      console.error("Listen private messages error:", error);
      onError?.(error);
    }
  );
};
