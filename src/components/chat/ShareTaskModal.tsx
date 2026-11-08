
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  MessageCircle,
  Users,
  Loader2,
  Share2,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../services/firebase/config";
import { listenToPrivateChats } from "../../services/chat/chatService";

import {
  shareTaskToPrivateChat,
  shareTaskToGroupChat,
  type SharedTaskPayload,
} from "../../services/chat/taskShareService";

interface ShareTaskModalProps {
  task: SharedTaskPayload;
  currentUserId?: string;
  onClose: () => void;
}

interface PrivateChatOption {
  id: string;
  otherUserId: string;
  displayName: string;
  email: string;
}

const ShareTaskModal = ({
  task,
  currentUserId: propUserId,
  onClose,
}: ShareTaskModalProps) => {
  const { user } = useAuth();
  const currentUserId = user?.uid || propUserId || "";

  const [privateChats, setPrivateChats] = useState<PrivateChatOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const handleClose = useCallback(() => {
    console.log("ShareTaskModal: closing");
    onClose();
  }, [onClose]);

  // ==========================================
  // CLOSE WITH ESCAPE
  // ==========================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose]);

  // ==========================================
  // LOAD PRIVATE CONVERSATIONS
  // ==========================================

  useEffect(() => {
    let active = true;

    if (!currentUserId) {
      setLoading(false);
      setError("User ID tidak ditemukan. Silakan login kembali.");

      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError("");

    const unsubscribe = listenToPrivateChats(
      currentUserId,
      async (chats) => {
        try {
          const options = await Promise.all(
            chats.map(async (chat) => {
              const otherUserId = chat.participants?.find(
                (participant) => participant !== currentUserId
              );

              if (!otherUserId) return null;

              const profileSnapshot = await getDoc(
                doc(db, "users", otherUserId)
              );

              if (!profileSnapshot.exists()) return null;

              const profile = profileSnapshot.data();

              return {
                id: chat.id,
                otherUserId,
                displayName: profile.displayName || "Unknown User",
                email: profile.email || "",
              };
            })
          );

          if (!active) return;

          setPrivateChats(
            options.filter(
              (option): option is PrivateChatOption => option !== null
            )
          );

          setLoading(false);
        } catch (err) {
          console.error("Load private chat options error:", err);

          if (!active) return;

          setError("Failed to load conversations.");
          setLoading(false);
        }
      },
      (err) => {
        if (!active) return;

        console.error("Listen private chats error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [currentUserId]);

  // ==========================================
  // SHARE TO PRIVATE CHAT
  // ==========================================

  const handleSharePrivate = async (chatId: string) => {
    if (!currentUserId || !chatId || sharing) {
      return;
    }

    try {
      setSharing(true);
      setError("");
      setSuccess("");

      await shareTaskToPrivateChat(
        chatId,
        currentUserId,
        task
      );

      setSuccess("Task shared successfully.");
    } catch (err) {
      console.error("Share task error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to share task."
      );
    } finally {
      setSharing(false);
    }
  };

  // ==========================================
  // SHARE TO GROUP CHAT
  // ==========================================

  const handleShareGroup = async () => {
    if (!currentUserId || !task.sourceGroupId || sharing) {
      return;
    }

    try {
      setSharing(true);
      setError("");
      setSuccess("");

      await shareTaskToGroupChat(
        task.sourceGroupId,
        currentUserId,
        task
      );

      setSuccess("Task shared to group chat.");
    } catch (err) {
      console.error("Share task to group error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to share task."
      );
    } finally {
      setSharing(false);
    }
  };

  // ==========================================
  // BACKDROP CLICK
  // ==========================================

  const handleBackdropClick = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  // ==========================================
  // RENDER MODAL
  // ==========================================

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-task-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2
              id="share-task-title"
              className="text-lg font-semibold text-slate-900"
            >
              Share Task
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose where to share this task.
            </p>
          </div>

          {/* CLOSE BUTTON */}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleClose();
            }}
            className="relative z-10 cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* SELECTED TASK */}

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Selected Task
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {task.title}
            </p>
          </div>

          {/* ERROR */}

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* SUCCESS */}

          {success && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {success}
            </p>
          )}

          {/* GROUP CHAT */}

          {task.source === "group" && task.sourceGroupId && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Group Chat
              </p>

              <button
                type="button"
                onClick={handleShareGroup}
                disabled={sharing || !currentUserId}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                  <Users size={20} />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    Share to this Group
                  </p>

                  <p className="text-xs text-slate-500">
                    Send to all members of this group
                  </p>
                </div>

                {sharing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Share2 size={18} className="text-slate-400" />
                )}
              </button>
            </div>
          )}

          {/* PRIVATE CONVERSATIONS */}

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Private Conversations
            </p>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
                <Loader2 size={18} className="animate-spin" />
                Loading conversations...
              </div>
            ) : privateChats.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
                <MessageCircle
                  size={24}
                  className="mx-auto mb-2 text-slate-400"
                />

                <p className="text-sm font-medium text-slate-700">
                  No private conversations
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Start a private chat before sharing a task.
                </p>
              </div>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {privateChats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => handleSharePrivate(chat.id)}
                    disabled={sharing}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <MessageCircle size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {chat.displayName}
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {chat.email}
                      </p>
                    </div>

                    {sharing ? (
                      <Loader2
                        size={18}
                        className="animate-spin text-blue-600"
                      />
                    ) : (
                      <Share2 size={18} className="text-slate-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CANCEL BUTTON */}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleClose();
            }}
            className="w-full cursor-pointer rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ShareTaskModal;
