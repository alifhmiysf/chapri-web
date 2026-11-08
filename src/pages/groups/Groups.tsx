
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UsersRound,
  Plus,
  UserPlus,
  Layers3,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";

import {
  type Group,
  getMyGroups,
  createGroup,
  joinGroup,
} from "../../services/groups/groupService";

import GroupCard from "../../components/groups/GroupCard";
import GroupForm from "../../components/groups/GroupForm";

import "../../styles/groups.css";

const Groups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState<Group[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD GROUPS
  // ==========================================

  const loadGroups = useCallback(async () => {
    if (!user) return;

    try {
      setError("");

      const result = await getMyGroups(user.uid);
      setGroups(result);
    } catch (err) {
      console.error("Load groups error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load groups."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  // ==========================================
  // FORM HANDLERS
  // ==========================================

  const openCreateForm = () => {
    setMode("create");
    setShowForm(true);
  };

  const openJoinForm = () => {
    setMode("join");
    setShowForm(true);
  };

  const handleSubmit = async (
    value: string,
    description?: string
  ) => {
    if (!user) return;

    if (mode === "create") {
      await createGroup(
        user,
        value,
        description ?? ""
      );
    } else {
      await joinGroup(user, value);
    }

    setShowForm(false);
    await loadGroups();
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="groups-page gm-page">

      {/* PAGE HEADER */}

      <header className="gm-header">
        <div className="gm-header-content">
          <div className="gm-eyebrow">
            <Layers3 size={14} />
            <span>WORKSPACE / COLLABORATION</span>
          </div>

          <h1>
            Your teams,
            <br />
            <span>one workspace.</span>
          </h1>

          <p>
            Bring your people together, organize shared tasks,
            and make progress as a team.
          </p>
        </div>

        <div className="gm-header-actions">
          <button
            type="button"
            className="gm-button gm-button-secondary"
            onClick={openJoinForm}
          >
            <UserPlus size={17} />
            Join Group
          </button>

          <button
            type="button"
            className="gm-button gm-button-primary"
            onClick={openCreateForm}
          >
            <Plus size={18} />
            Create Group
          </button>
        </div>
      </header>

      {/* ERROR */}

      {error && (
        <div className="gm-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadGroups()}
          >
            Try again
          </button>
        </div>
      )}

      {/* GROUP OVERVIEW */}

      <section className="gm-overview">
        <div className="gm-overview-heading">
          <div className="gm-overview-icon">
            <UsersRound size={20} />
          </div>

          <div>
            <span className="gm-section-label">
              YOUR WORKSPACES
            </span>

            <h2>My Groups</h2>
          </div>
        </div>

        {!loading && (
          <div className="gm-group-count">
            <strong>{groups.length}</strong>

            <span>
              {groups.length === 1 ? "group" : "groups"}
            </span>
          </div>
        )}
      </section>

      {/* LOADING STATE */}

      {loading ? (
        <div className="gm-loading-grid">
          {[1, 2, 3].map((item) => (
            <div
              className="gm-skeleton-card"
              key={item}
            >
              <div className="gm-skeleton-top">
                <div className="gm-skeleton-icon" />
                <div className="gm-skeleton-line" />
              </div>

              <div className="gm-skeleton-title" />
              <div className="gm-skeleton-description" />
              <div className="gm-skeleton-description short" />
              <div className="gm-skeleton-footer" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (

        /* EMPTY STATE */

        <div className="gm-empty-state">
          <div className="gm-empty-illustration">
            <div className="gm-empty-circle circle-one" />
            <div className="gm-empty-circle circle-two" />

            <div className="gm-empty-main-icon">
              <UsersRound
                size={34}
                strokeWidth={1.7}
              />
            </div>

            <div className="gm-empty-sparkle sparkle-one">
              <Sparkles size={17} />
            </div>

            <div className="gm-empty-sparkle sparkle-two">
              <Plus size={17} />
            </div>
          </div>

          <span className="gm-empty-label">
            YOUR TEAM STARTS HERE
          </span>

          <h3>No groups yet</h3>

          <p>
            You haven't joined any workspace. Create a new group
            for your team or join an existing one using an
            invitation code.
          </p>

          <div className="gm-empty-actions">
            <button
              type="button"
              className="gm-button gm-button-primary"
              onClick={openCreateForm}
            >
              <Plus size={17} />
              Create your first group
            </button>

            <button
              type="button"
              className="gm-button gm-button-secondary"
              onClick={openJoinForm}
            >
              <UserPlus size={17} />
              Join with code
            </button>
          </div>
        </div>

      ) : (

        /* GROUP LIST */

        <div className="gm-group-grid">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onClick={(id) => navigate(`/groups/${id}`)}
            />
          ))}
        </div>
      )}

      {/* GROUP FORM */}

      {showForm && (
        <GroupForm
          mode={mode}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default Groups;
