
import { useState } from "react";
import {
  Share2,
  CalendarDays,
  UserRound,
  CircleUserRound,
  X,
  Pencil,
  Trash2,
  Flag,
  Clock3,
} from "lucide-react";

import type {
  GroupTask,
  GroupTaskStatus,
} from "../../services/groups/groupTaskService";

import type { GroupMember } from "../../services/groups/groupService";

interface GroupTaskItemProps {
  task: GroupTask;
  members: GroupMember[];
  canManage: boolean;
  onStatusChange: (
    taskId: string,
    status: GroupTaskStatus
  ) => void;
  onEdit: (task: GroupTask) => void;
  onDelete: (taskId: string) => void;
  onShare: (task: GroupTask) => void;
}

const priorityStyles = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-600",
};

const statusLabels: Record<GroupTaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  completed: "Completed",
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const GroupTaskItem = ({
  task,
  members,
  canManage,
  onStatusChange,
  onEdit,
  onDelete,
  onShare,
}: GroupTaskItemProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const creator = members.find(
    (member) => member.uid === task.createdBy
  );

  const assignee = members.find(
    (member) => member.uid === task.assignedTo
  );

  const deadline = task.deadline
    ? task.deadline.toDate()
    : null;

  const handleEdit = () => {
    setShowDetails(false);
    onEdit(task);
  };

  const handleShare = () => {
    setShowDetails(false);
    onShare(task);
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) return;

    setShowDetails(false);
    onDelete(task.id);
  };

  return (
    <>
      {/* COMPACT TASK CARD */}

      <button
        type="button"
        onClick={() => setShowDetails(true)}
        className="group w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="min-w-0 flex-1 break-words text-sm font-semibold leading-5 text-slate-800 transition group-hover:text-blue-600">
            {task.title}
          </h4>

          <span
            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
              priorityStyles[task.priority]
            }`}
          >
            {task.priority}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <CircleUserRound size={13} />
            <span className="max-w-[125px] truncate">
              {assignee
                ? assignee.displayName || assignee.email
                : "Unassigned"}
            </span>
          </span>

          {deadline && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <CalendarDays size={13} />
              {formatDate(deadline)}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
          <span className="text-[11px] font-medium text-slate-400">
            {statusLabels[task.status]}
          </span>

          <span className="text-[11px] font-semibold text-blue-500 opacity-0 transition group-hover:opacity-100">
            View details →
          </span>
        </div>
      </button>

      {/* TASK DETAILS MODAL */}

      {showDetails && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowDetails(false);
            }
          }}
        >
          <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      priorityStyles[task.priority]
                    }`}
                  >
                    {task.priority} priority
                  </span>

                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-600">
                    {statusLabels[task.status]}
                  </span>
                </div>

                <h2 className="break-words text-xl font-bold text-slate-900">
                  {task.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowDetails(false)}
                aria-label="Close task details"
                className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL CONTENT */}

            <div className="max-h-[65vh] space-y-6 overflow-y-auto px-6 py-5">
              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Description
                </h3>

                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                  {task.description?.trim() ||
                    "No description provided."}
                </p>
              </section>

              <section>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Task Information
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                      <Flag size={14} />
                      Priority
                    </div>

                    <p className="text-sm font-semibold capitalize text-slate-800">
                      {task.priority}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                      <Clock3 size={14} />
                      Status
                    </div>

                    <select
                      value={task.status}
                      onChange={(event) =>
                        onStatusChange(
                          task.id,
                          event.target.value as GroupTaskStatus
                        )
                      }
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                      <UserRound size={14} />
                      Created By
                    </div>

                    <p className="break-words text-sm font-semibold text-slate-800">
                      {creator
                        ? creator.displayName || creator.email
                        : "Unknown"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                      <CircleUserRound size={14} />
                      Assigned To
                    </div>

                    <p className="break-words text-sm font-semibold text-slate-800">
                      {assignee
                        ? assignee.displayName || assignee.email
                        : "Unassigned"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                      <CalendarDays size={14} />
                      Deadline
                    </div>

                    <p className="text-sm font-semibold text-slate-800">
                      {deadline
                        ? formatDate(deadline)
                        : "No deadline"}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* MODAL ACTIONS */}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              >
                <Share2 size={16} />
                Share
              </button>

              {canManage && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>

                  <button
                    type="button"
                    onClick={handleEdit}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Pencil size={15} />
                    Edit Task
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupTaskItem;
