
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../services/firebase/config";

import {
  listenToPrivateMessages,
  sendPrivateMessage,
  type Chat,
  type ChatMessage,
} from "../../services/chat/chatService";

import SharedTaskCard from "../../components/chat/SharedTaskCard";

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
}

const formatMessageTime = (timestamp: ChatMessage["createdAt"]) => {
  if (!timestamp) return "";

  return timestamp.toDate().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ChatRoom = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [chat, setChat] = useState<Chat | null>(null);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // LOAD CHAT AND USER PROFILE

  useEffect(() => {
    if (!chatId || !user) {
      setLoading(false);
      setError("Chat ID or user is missing.");
      return;
    }

    let cancelled = false;

    const loadChat = async () => {
      try {
        setLoading(true);
        setError("");

        const chatSnapshot = await getDoc(doc(db, "chats", chatId));

        if (!chatSnapshot.exists()) {
          throw new Error("Conversation not found.");
        }

        const chatData = {
          id: chatSnapshot.id,
          ...chatSnapshot.data(),
        } as Chat;

        if (
          chatData.type !== "private" ||
          !chatData.participants.includes(user.uid)
        ) {
          throw new Error(
            "You are not allowed to access this conversation."
          );
        }

        const otherUserId = chatData.participants.find(
          (participant) => participant !== user.uid
        );

        if (!otherUserId) {
          throw new Error("Other participant not found.");
        }

        const userSnapshot = await getDoc(
          doc(db, "users", otherUserId)
        );

        if (!userSnapshot.exists()) {
          throw new Error("User profile not found.");
        }

        const profile = {
          uid: userSnapshot.id,
          ...userSnapshot.data(),
        } as UserProfile;

        if (!cancelled) {
          setChat(chatData);
          setOtherUser(profile);
        }
      } catch (err) {
        console.error("Load chat room error:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load conversation."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadChat();

    return () => {
      cancelled = true;
    };
  }, [chatId, user]);

  // LISTEN TO MESSAGES

  useEffect(() => {
    if (!chatId || !user || !chat) return;

    return listenToPrivateMessages(
      chatId,
      setMessages,
      (err) => {
        console.error("Listen messages error:", err);
        setError("Failed to load messages.");
      }
    );
  }, [chatId, user, chat]);

  // AUTO SCROLL

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // SEND MESSAGE

  const handleSendMessage = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!chatId || !user || !messageText.trim() || sending) {
      return;
    }

    const text = messageText.trim();

    try {
      setSending(true);

      await sendPrivateMessage(chatId, user.uid, text);

      setMessageText("");
    } catch (err) {
      console.error("Send message error:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to send message."
      );
    } finally {
      setSending(false);
    }
  };

  // OPEN SHARED TASK

  const handleOpenTask = (message: ChatMessage) => {
    if (!message.task) return;

    if (message.task.source === "personal") {
      navigate("/dashboard");
      return;
    }

    if (message.task.sourceGroupId) {
      navigate(`/groups/${message.task.sourceGroupId}`);
    }
  };

  // LOADING

  
  // LOADING

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-178px)] min-h-[420px] w-full min-w-0 animate-pulse flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER SKELETON */}
        <header className="flex flex-shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="h-9 w-9 flex-shrink-0 rounded-lg bg-slate-100" />

          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-50" />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-3 w-44 max-w-full rounded bg-slate-100" />
          </div>
        </header>

        {/* MESSAGE SKELETON */}
        <main className="flex min-h-0 flex-1 flex-col justify-end gap-5 overflow-hidden bg-slate-50/80 p-4 sm:p-5">
          {/* RECEIVED MESSAGE */}
          <div className="flex justify-start">
            <div className="w-[75%] max-w-[320px] space-y-2">
              <div className="h-3 w-20 rounded bg-slate-200" />
              <div className="space-y-2 rounded-2xl rounded-bl-sm border border-slate-200 bg-white p-4 shadow-sm">
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-3/4 rounded bg-slate-100" />
              </div>
            </div>
          </div>

          {/* OWN MESSAGE */}
          <div className="flex justify-end">
            <div className="w-[65%] max-w-[280px] space-y-2 rounded-2xl rounded-br-sm bg-blue-100 p-4">
              <div className="h-3 w-full rounded bg-blue-200" />
              <div className="h-3 w-2/3 rounded bg-blue-200" />
            </div>
          </div>

          {/* RECEIVED MESSAGE 2 */}
          <div className="flex justify-start">
            <div className="w-[70%] max-w-[300px] space-y-2">
              <div className="space-y-2 rounded-2xl rounded-bl-sm border border-slate-200 bg-white p-4 shadow-sm">
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-4/5 rounded bg-slate-100" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
              </div>
            </div>
          </div>

          {/* OWN MESSAGE 2 */}
          <div className="flex justify-end">
            <div className="w-[55%] max-w-[240px] rounded-2xl rounded-br-sm bg-blue-100 p-4">
              <div className="h-3 w-full rounded bg-blue-200" />
            </div>
          </div>
        </main>

        {/* INPUT SKELETON */}
        <div className="flex flex-shrink-0 items-end gap-3 border-t border-slate-200 bg-white p-3 sm:p-4">
          <div className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50" />
          <div className="h-11 w-11 flex-shrink-0 rounded-xl bg-blue-100" />
        </div>
      </div>
    );
  }


  // ERROR

  if (error || !chat || !otherUser || !user) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8">
        <div className="mb-3 text-red-500">
          <MessageCircle size={28} />
        </div>

        <p className="text-sm text-red-600">
          {error || "Conversation unavailable."}
        </p>

        <button
          onClick={() => navigate("/chats")}
          className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Back to Chats
        </button>
      </div>
    );
  }

  // CHAT ROOM

  return (
    <div className="flex h-[calc(100vh-178px)] min-h-[420px] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <header className="flex flex-shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
        <button
          onClick={() => navigate("/chats")}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Back to chats"
        >
          <ArrowLeft size={19} />
        </button>

        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-blue-600">
          {otherUser.photoURL ? (
            <img
              src={otherUser.photoURL}
              alt={otherUser.displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <MessageCircle size={19} />
          )}
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold text-slate-900">
            {otherUser.displayName || "Unknown User"}
          </h1>

          <p className="truncate text-xs text-slate-500">
            {otherUser.email}
          </p>
        </div>
      </header>

      {/* MESSAGE AREA */}

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-slate-50/80 p-4 sm:p-5">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
              <MessageCircle size={29} />
            </div>

            <h2 className="font-semibold text-slate-700">
              No messages yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Start the conversation with {otherUser.displayName}.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === user.uid;
            const isTaskMessage =
              message.type === "task" && !!message.task;

            return (
              <div
                key={message.id}
                className={`flex w-full ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[75%] ${
                    isOwnMessage
                      ? "rounded-br-sm bg-blue-600 text-white"
                      : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {isTaskMessage && message.task ? (
                    <SharedTaskCard
                      task={message.task}
                      onOpen={() => handleOpenTask(message)}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">
                      {message.text}
                    </p>
                  )}

                  <p
                    className={`mt-2 text-right text-[10px] ${
                      isOwnMessage
                        ? "text-blue-100"
                        : "text-slate-400"
                    }`}
                  >
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* MESSAGE INPUT */}

      <form
        onSubmit={handleSendMessage}
        className="flex flex-shrink-0 items-end gap-3 border-t border-slate-200 bg-white p-3 sm:p-4"
      >
        <textarea
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          placeholder="Type a message..."
          rows={1}
          maxLength={5000}
          disabled={sending}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          className="max-h-32 min-h-11 min-w-0 flex-1 resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        />

        <button
          type="submit"
          disabled={!messageText.trim() || sending}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;
