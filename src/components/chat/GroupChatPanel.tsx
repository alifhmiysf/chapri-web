
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send, Loader2 } from "lucide-react";

import {
  getOrCreateGroupChat,
  listenToGroupMessages,
  sendGroupMessage,
  type GroupChatMessage,
} from "../../services/chat/groupChatService";

import type { GroupMember } from "../../services/groups/groupService";
import SharedTaskCard from "./SharedTaskCard";

interface GroupChatPanelProps {
  groupId: string;
  currentUserId: string;
  members: GroupMember[];
}

const GroupChatPanel = ({
  groupId,
  currentUserId,
  members,
}: GroupChatPanelProps) => {
  const navigate = useNavigate();

  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // INITIALIZE GROUP CHAT
  // ==========================================

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const initializeChat = async () => {
      if (!groupId || !currentUserId) {
        setError("Group ID or User ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        await getOrCreateGroupChat(groupId, currentUserId);

        if (!active) return;

        unsubscribe = listenToGroupMessages(
          groupId,
          (data) => {
            if (!active) return;

            setMessages(data);
            setLoading(false);
            setError("");
          },
          (err) => {
            if (!active) return;

            console.error("Listen group messages error:", err);
            setError(err.message);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Initialize group chat error:", err);

        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize group chat."
        );

        setLoading(false);
      }
    };

    void initializeChat();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [groupId, currentUserId]);

  // ==========================================
  // AUTO SCROLL
  // ==========================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const handleSendMessage = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const text = messageText.trim();

    if (!text || sending) return;

    if (!groupId || !currentUserId) {
      setError("Group ID or User ID is missing.");
      return;
    }

    try {
      setSending(true);
      setError("");

      await sendGroupMessage(
        groupId,
        currentUserId,
        text
      );

      setMessageText("");
    } catch (err) {
      console.error("Send group message error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to send message."
      );
    } finally {
      setSending(false);
    }
  };

  // ==========================================
  // GET SENDER NAME
  // ==========================================

  const getSenderName = (senderId: string): string => {
    const member = members.find(
      (item) => item.uid === senderId
    );

    return member?.displayName || "Unknown Member";
  };

  // ==========================================
  // FORMAT MESSAGE TIME
  // ==========================================

  const formatTime = (
    timestamp: GroupChatMessage["createdAt"]
  ): string => {
    if (!timestamp) return "";

    return timestamp.toDate().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================
  // OPEN SHARED TASK
  // ==========================================

  const handleOpenTask = (message: GroupChatMessage) => {
    const task = message.task;

    if (!task) return;

    if (task.source === "personal") {
      navigate("/dashboard");
      return;
    }

    if (task.source === "group" && task.sourceGroupId) {
      navigate(`/groups/${task.sourceGroupId}`);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">

      {/* HEADER */}

      <div className="flex items-center gap-3 border-b border-gray-200 p-4">
        <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
          <MessageCircle size={20} />
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">
            Group Chat
          </h2>

          <p className="text-sm text-gray-500">
            Conversation with group members
          </p>
        </div>
      </div>

      {/* MESSAGE LIST */}

      
      {/* MESSAGE LIST */}

      <div
        className="h-[400px] space-y-4 overflow-y-auto bg-[#f5f7fb] p-4"
        aria-busy={loading}
        aria-label={loading ? "Loading group messages" : "Group messages"}
      >
        {loading ? (
          <div className="flex h-full flex-col justify-end gap-5 animate-pulse">
            {/* RECEIVED MESSAGE 1 */}
            <div className="flex justify-start">
              <div className="w-[75%] max-w-[320px] space-y-2">
                <div className="h-3 w-20 rounded bg-slate-200" />
                <div className="rounded-2xl rounded-tl-sm border border-slate-100 bg-white p-4">
                  <div className="h-3 w-full rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
                </div>
              </div>
            </div>

            {/* OWN MESSAGE */}
            <div className="flex justify-end">
              <div className="w-[65%] max-w-[280px] rounded-2xl rounded-tr-sm bg-blue-100 p-4">
                <div className="h-3 w-full rounded bg-blue-200" />
                <div className="mt-2 h-3 w-1/2 rounded bg-blue-200" />
              </div>
            </div>

            {/* RECEIVED MESSAGE 2 */}
            <div className="flex justify-start">
              <div className="w-[70%] max-w-[300px] space-y-2">
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="rounded-2xl rounded-tl-sm border border-slate-100 bg-white p-4">
                  <div className="h-3 w-full rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-4/5 rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
                </div>
              </div>
            </div>

            {/* OWN MESSAGE 2 */}
            <div className="flex justify-end">
              <div className="w-[55%] max-w-[240px] rounded-2xl rounded-tr-sm bg-blue-100 p-4">
                <div className="h-3 w-full rounded bg-blue-200" />
              </div>
            </div>
          </div>
        ) : error && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-red-500">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageCircle
              size={36}
              className="mb-3 text-gray-300"
            />

            <p className="font-medium text-gray-600">
              No messages yet
            </p>

            <p className="text-sm text-gray-400">
              Start a conversation with your group.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage =
              message.senderId === currentUserId;

            const isTaskMessage =
              message.type === "task" && Boolean(message.task);

            return (
              <div
                key={message.id}
                className={`flex ${
                  isOwnMessage
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-4 py-3 sm:max-w-[75%] ${
                    isOwnMessage
                      ? "bg-blue-600 text-white"
                      : "border border-gray-200 bg-white text-gray-900"
                  }`}
                >
                  {!isOwnMessage && (
                    <p className="mb-1 text-xs font-semibold text-blue-600">
                      {getSenderName(message.senderId)}
                    </p>
                  )}

                  {isTaskMessage && message.task ? (
                    <SharedTaskCard
                      task={message.task}
                      onOpen={() => handleOpenTask(message)}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {message.text}
                    </p>
                  )}

                  <p
                    className={`mt-1 text-right text-[11px] ${
                      isOwnMessage
                        ? "text-blue-100"
                        : "text-gray-400"
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ERROR MESSAGE */}

      {error && messages.length > 0 && (
        <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* MESSAGE INPUT */}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 border-t border-gray-200 p-3"
      >
        <input
          type="text"
          value={messageText}
          onChange={(event) =>
            setMessageText(event.target.value)
          }
          placeholder="Write a message..."
          maxLength={5000}
          disabled={loading || sending}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
        />

        <button
          type="submit"
          disabled={
            !messageText.trim() ||
            loading ||
            sending
          }
          className="flex items-center justify-center rounded-lg bg-blue-600 p-3 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          {sending ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
    </section>
  );
};

export default GroupChatPanel;
