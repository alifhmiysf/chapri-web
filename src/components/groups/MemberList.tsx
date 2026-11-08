
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import type {
  GroupMember,
  GroupRole,
} from "../../services/groups/groupService";

interface MemberListProps {
  members: GroupMember[];
  currentUserId: string;
  ownerId: string;
  onChangeRole: (
    targetId: string,
    role: GroupRole
  ) => Promise<void>;
  onRemoveMember: (targetId: string) => Promise<void>;
  onLeaveGroup: () => Promise<void>;
  onStartChat?: (targetId: string) => Promise<void>;
}

const MemberList = ({
  members,
  currentUserId,
  ownerId,
  onChangeRole,
  onRemoveMember,
  onLeaveGroup,
  onStartChat,
}: MemberListProps) => {
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);

  const currentMember = members.find(
    (member) => member.uid === currentUserId
  );

  const currentRole = currentMember?.role;
  const isOwner = currentRole === "owner";
  const isAdmin = currentRole === "admin" || isOwner;

  // Change member role
  const handleRoleChange = async (
    targetId: string,
    role: GroupRole
  ) => {
    try {
      await onChangeRole(targetId, role);
    } catch (error) {
      console.error("Change role error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to change member role."
      );
    }
  };

  // Remove member
  const handleRemove = async (targetId: string) => {
    if (!window.confirm("Remove this member from the group?")) {
      return;
    }

    try {
      await onRemoveMember(targetId);
    } catch (error) {
      console.error("Remove member error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to remove member."
      );
    }
  };

  // Leave group
  const handleLeave = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) {
      return;
    }

    try {
      await onLeaveGroup();
    } catch (error) {
      console.error("Leave group error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to leave group."
      );
    }
  };

  // Start private chat
  const handleStartChat = async (targetId: string) => {
    if (!onStartChat) return;

    try {
      setChatLoadingId(targetId);

      await onStartChat(targetId);
    } catch (error) {
      console.error("Start private chat error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unknown error while opening private chat."
      );
    } finally {
      setChatLoadingId(null);
    }
  };

  return (
    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {members.map((member) => {
        const isSelf = member.uid === currentUserId;
        const isTargetOwner = member.uid === ownerId;

        return (
          <div
            key={member.uid}
            className="flex flex-wrap items-center justify-between gap-4 p-4"
          >
            {/* Member Information */}
            <div>
              <p className="font-medium text-slate-900">
                {member.displayName}

                {isSelf && (
                  <span className="ml-2 text-xs text-slate-400">
                    (You)
                  </span>
                )}
              </p>

              <p className="text-sm text-slate-500">
                {member.email}
              </p>

              <span className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs capitalize text-slate-700">
                {member.role}
              </span>
            </div>

            {/* Member Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Private Chat */}
              {!isSelf && onStartChat && (
                <button
                  type="button"
                  onClick={() => handleStartChat(member.uid)}
                  disabled={chatLoadingId !== null}
                  className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MessageCircle size={16} />

                  {chatLoadingId === member.uid
                    ? "Opening..."
                    : "Message"}
                </button>
              )}

              {/* Change Role */}
              {isOwner && !isTargetOwner && (
                <select
                  value={member.role}
                  onChange={(event) =>
                    handleRoleChange(
                      member.uid,
                      event.target.value as GroupRole
                    )
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              )}

              {/* Remove Member */}
              {isAdmin && !isTargetOwner && (
                <button
                  type="button"
                  onClick={() => handleRemove(member.uid)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                >
                  Remove
                </button>
              )}

              {/* Leave Group */}
              {isSelf && !isOwner && (
                <button
                  type="button"
                  onClick={handleLeave}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  Leave Group
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MemberList;
