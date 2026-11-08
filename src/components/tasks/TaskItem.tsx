
import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  X,
  Share2,
  Pencil,
  Trash2,
} from "lucide-react";

import type { Task } from "../../services/tasks/taskService";
import "./TaskItem.css";

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Task["status"]) => void;
  onShare: (task: Task) => void;
}

const TaskItem = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onShare,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const isCompleted = task.status === "completed";

  const closeModal = () => setIsOpen(false);

  return (
    <>
      <div
        className={`personal-note-row ${isCompleted ? "completed" : ""}`}
        onClick={() => setIsOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        <span className="personal-note-bullet">
          {isCompleted ? (
            <CheckCircle2 size={17} />
          ) : (
            <Circle size={17} />
          )}
        </span>

        <span className="personal-note-title">
          {task.title}
        </span>

        <span className="personal-note-description">
          {task.description || "No description"}
        </span>
      </div>

      {isOpen && (
        <div className="note-modal-overlay" onClick={closeModal}>
          <div
            className="note-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="note-modal-header">
              <span>PERSONAL TASK</span>
              <button type="button" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <div className="note-modal-content">
              <span className={`note-priority ${task.priority}`}>
                {task.priority} priority
              </span>

              <h2 className={isCompleted ? "completed-text" : ""}>
                {task.title}
              </h2>

              <p className={isCompleted ? "completed-text" : ""}>
                {task.description || "No description"}
              </p>
            </div>

            <div className="note-modal-status-control">
              <label>Task status</label>
              <select
                value={task.status}
                onChange={(e) =>
                  onStatusChange(
                    task.id,
                    e.target.value as Task["status"]
                  )
                }
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="note-modal-actions">
              <button type="button" onClick={() => {
                closeModal();
                onShare(task);
              }}>
                <Share2 size={15} /> Share
              </button>

              <button type="button" onClick={() => {
                closeModal();
                onEdit(task);
              }}>
                <Pencil size={15} /> Edit
              </button>

              <button
                type="button"
                className="note-delete-button"
                onClick={() => {
                  closeModal();
                  onDelete(task.id);
                }}
              >
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskItem;
