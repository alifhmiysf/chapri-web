import {
  Calendar,
  Flag,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Circle,
} from "lucide-react";

import type { SharedTaskPayload } from "../../services/chat/taskShareService";

interface SharedTaskCardProps {
  task: SharedTaskPayload;
  onOpen: () => void;
}

const SharedTaskCard = ({
  task,
  onOpen,
}: SharedTaskCardProps) => {
  const getStatus = () => {
    switch (task.status) {
      case "todo":
        return {
          label: "To Do",
          icon: Circle,
          color: "text-slate-600 bg-slate-100",
        };

      case "in_progress":
        return {
          label: "In Progress",
          icon: Clock,
          color: "text-blue-600 bg-blue-100",
        };

      case "completed":
        return {
          label: "Completed",
          icon: CheckCircle2,
          color: "text-green-600 bg-green-100",
        };

      default:
        return {
          label: task.status,
          icon: Circle,
          color: "text-slate-600 bg-slate-100",
        };
    }
  };

  const getPriority = () => {
    switch (task.priority) {
      case "low":
        return {
          label: "Low",
          color: "text-green-600",
        };

      case "medium":
        return {
          label: "Medium",
          color: "text-yellow-600",
        };

      case "high":
        return {
          label: "High",
          color: "text-red-600",
        };

      default:
        return {
          label: task.priority,
          color: "text-slate-600",
        };
    }
  };

  const formatDeadline = () => {
    if (!task.deadline) return "No deadline";

    const date = new Date(task.deadline);

    if (Number.isNaN(date.getTime())) {
      return "No deadline";
    }

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const status = getStatus();
  const priority = getPriority();
  const StatusIcon = status.icon;

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">

      {/* TASK HEADER */}

      <div className="border-b border-slate-100 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Shared Task
          </span>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              task.source === "group"
                ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {task.source === "group" ? "Group Task" : "Personal Task"}
          </span>
        </div>

        <h3 className="break-words text-base font-semibold text-slate-900">
          {task.title}
        </h3>

        {task.description && (
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">
            {task.description}
          </p>
        )}
      </div>

      {/* TASK INFORMATION */}

      <div className="space-y-3 p-4">

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}
          >
            <StatusIcon size={14} />
            {status.label}
          </span>

          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${priority.color}`}
          >
            <Flag size={14} />
            {priority.label} Priority
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar size={15} />

          <span>
            Deadline: {formatDeadline()}
          </span>
        </div>

      </div>

      {/* OPEN TASK BUTTON */}

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={onOpen}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Open Task
          <ArrowUpRight size={16} />
        </button>
      </div>

    </div>
  );
};

export default SharedTaskCard;