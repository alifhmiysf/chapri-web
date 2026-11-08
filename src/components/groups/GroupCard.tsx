import {
  UsersRound,
  ArrowUpRight,
  Crown,
} from "lucide-react";

import type { Group } from "../../services/groups/groupService";

interface Props {
  group: Group;
  onClick: (groupId: string) => void;
}

const GroupCard = ({ group, onClick }: Props) => {
  return (
    <article className="gm-group-card">
      <div className="gm-card-top">
        <div className="gm-card-icon">
          <UsersRound size={22} strokeWidth={1.8} />
        </div>

        <span className="gm-card-badge">
          <span className="gm-card-status-dot" />
          Workspace
        </span>
      </div>

      <div className="gm-card-content">
        <h3>{group.name}</h3>

        <p>
          {group.description || "No group description provided yet."}
        </p>
      </div>

      <div className="gm-card-divider" />

      <div className="gm-card-footer">
        <div className="gm-card-owner">
          <div className="gm-owner-icon">
            <Crown size={14} />
          </div>

          <div className="gm-owner-info">
            <span>GROUP OWNER</span>
            <strong>{group.ownerId.slice(0, 8)}</strong>
          </div>
        </div>

        <button
          type="button"
          className="gm-open-button"
          onClick={() => onClick(group.id)}
          aria-label={`Open ${group.name}`}
        >
          <span>Open</span>
          <ArrowUpRight size={17} />
        </button>
      </div>
    </article>
  );
};

export default GroupCard;