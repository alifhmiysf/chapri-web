
import { useState } from "react";
import "../../styles/form-modal.css";
interface Props {
  mode: "create" | "join";
  onSubmit: (value: string, description?: string) => Promise<void>;
  onCancel: () => void;
}

const GroupForm = ({ mode, onSubmit, onCancel }: Props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "create") {
        await onSubmit(name.trim(), description.trim());
      } else {
        await onSubmit(inviteCode.trim());
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-modal-overlay">
      <form className="task-modal" onSubmit={handleSubmit}>
        <h2>{mode === "create" ? "Create New Group" : "Join a Group"}</h2>

        {mode === "create" ? (
          <>
            <label>Group Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              maxLength={100}
              required
            />

            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
            />
          </>
        ) : (
          <>
            <label>Invitation Code</label>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter invitation code"
              required
            />
          </>
        )}

        {error && <p className="error-message">{error}</p>}

        <div className="modal-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : mode === "create" ? "Create Group" : "Join Group"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GroupForm;
