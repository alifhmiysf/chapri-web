
import { useEffect, useState } from "react";
import type { Task } from "../../services/tasks/taskService";

interface Props {
  initialTask: Task | null;
  onSubmit: (
    title: string,
    description: string,
    priority: Task["priority"]
  ) => Promise<void>;
  onCancel: () => void;
}

const TaskForm = ({ initialTask, onSubmit, onCancel }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(initialTask?.title ?? "");
    setDescription(initialTask?.description ?? "");
    setPriority(initialTask?.priority ?? "medium");
  }, [initialTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setSaving(true);

    try {
      await onSubmit(title.trim(), description.trim(), priority);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="task-modal-overlay">
      <form className="task-modal" onSubmit={handleSubmit}>
        <h2>{initialTask ? "Edit Task" : "Create New Task"}</h2>

        <label>Task Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          maxLength={150}
          required
        />

        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add some details..."
        />

        <label>Priority</label>
        <select
          value={priority}
          onChange={(e) =>
            setPriority(e.target.value as Task["priority"])
          }
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <div className="modal-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Task"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
