
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock3,
  Flag,
  LoaderCircle,
  Users,
  CalendarDays,
  ListTodo,
  ArrowUpRight,
} from "lucide-react";

import { db } from "../../services/firebase/config";
import {
  type PublicProject,
  type PublicProjectTask,
  type PublicProjectMember,
} from "../../services/groups/publicProjectService";

import "./PublicProject.css";

type ProjectData = PublicProject & {
  groupName?: string;
};

const formatDate = (
  value?: Timestamp | null
): string => {
  if (!value) return "No deadline";

  const date =
    value instanceof Timestamp
      ? value.toDate()
      : new Date(value as unknown as string);

  if (Number.isNaN(date.getTime())) {
    return "No deadline";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const getStatusLabel = (status: PublicProjectTask["status"]) => {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In Progress";
    default:
      return "To Do";
  }
};

const getPriorityLabel = (
  priority: PublicProjectTask["priority"]
) => {
  switch (priority) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    default:
      return "Low";
  }
};

function PublicProject() {
  const { shareId } = useParams<{ shareId: string }>();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [tasks, setTasks] = useState<PublicProjectTask[]>([]);
  const [members, setMembers] = useState<PublicProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadPublicProject = async () => {
      if (!shareId) {
        setError("Invalid project link.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const projectRef = doc(db, "publicProjects", shareId);
        const projectSnapshot = await getDoc(projectRef);

        if (!projectSnapshot.exists()) {
          throw new Error("This public project could not be found.");
        }

        const projectData = projectSnapshot.data() as ProjectData;

        if (projectData.isPublic !== true) {
          throw new Error("This project is no longer publicly available.");
        }

        const [taskSnapshot, memberSnapshot] = await Promise.all([
          getDocs(collection(projectRef, "tasks")),
          getDocs(collection(projectRef, "members")),
        ]);

        if (!active) return;

        const taskData = taskSnapshot.docs.map((taskDoc) => ({
          id: taskDoc.id,
          ...taskDoc.data(),
        })) as PublicProjectTask[];

        const memberData = memberSnapshot.docs.map((memberDoc) => ({
          id: memberDoc.id,
          ...memberDoc.data(),
        })) as PublicProjectMember[];

        setProject({
          id: projectSnapshot.id,
          ...projectData,
        });

        setTasks(taskData);
        setMembers(memberData);
      } catch (err) {
        console.error("Failed to load public project:", err);

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load this project."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPublicProject();

    return () => {
      active = false;
    };
  }, [shareId]);

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "completed").length,
    [tasks]
  );

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;

    return Math.round((completedTasks / tasks.length) * 100);
  }, [completedTasks, tasks.length]);

  const sortedTasks = useMemo(() => {
    const order = {
      in_progress: 0,
      todo: 1,
      completed: 2,
    };

    return [...tasks].sort(
      (a, b) => order[a.status] - order[b.status]
    );
  }, [tasks]);

 if (loading) {
  return (
    <main className="public-project-page">
      <div className="public-project-container">
        <header className="public-project-topbar">
          <a href="/" className="public-brand">
            chapri<span>.</span>
          </a>
          <div className="public-access-label">
            <span className="public-access-dot" />
            Loading workspace
          </div>
        </header>

        <article className="public-project-document skeleton-document">
          <div className="skeleton-eyebrow skeleton" />

          <section className="skeleton-heading">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
            <div className="skeleton-meta">
              <div className="skeleton skeleton-meta-item" />
              <div className="skeleton skeleton-meta-item" />
            </div>
          </section>

          <section className="skeleton-progress">
            <div className="skeleton skeleton-line short" />
            <div className="skeleton skeleton-progress-bar" />
            <div className="skeleton skeleton-line" />
          </section>

          <section className="skeleton-tasks">
            <div className="skeleton skeleton-line short" />
            {[1, 2, 3, 4].map((item) => (
              <div className="skeleton-task" key={item}>
                <div className="skeleton skeleton-circle" />
                <div className="skeleton-task-content">
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line short" />
                </div>
              </div>
            ))}
          </section>

          <section className="skeleton-members">
            <div className="skeleton skeleton-line short" />
            <div className="skeleton skeleton-member" />
            <div className="skeleton skeleton-member" />
          </section>

          <footer className="public-project-footer">
            <span>chapri.</span>
            <span>Preparing your project...</span>
          </footer>
        </article>
      </div>
    </main>
  );
}

  if (error || !project) {
    return (
      <main className="public-project-state">
        <div className="state-error-icon">
          <AlertCircle size={30} />
        </div>

        <h1>Project unavailable</h1>
        <p>
          {error || "This project link is invalid or no longer available."}
        </p>
      </main>
    );
  }

  return (
    <main className="public-project-page">
      <div className="public-project-container">
        <header className="public-project-topbar">
          <a href="/" className="public-brand">
  <span>Chapri</span>
</a>

          <div className="public-access-label">
            <span className="public-access-dot" />
            Public project
          </div>
        </header>

        <article className="public-project-document">
          <div className="document-eyebrow">
            <span>PROJECT WORKSPACE</span>
            <span className="eyebrow-divider">/</span>
            <span>PUBLIC OVERVIEW</span>
          </div>

          <section className="document-heading">
            <h1>{project.name}</h1>

            <p className="document-description">
              {project.description || "No project description provided."}
            </p>

            <div className="document-meta">
              <div className="document-meta-item">
                <Users size={15} />
                <span>
                  {members.length}{" "}
                  {members.length === 1 ? "member" : "members"}
                </span>
              </div>

              <div className="document-meta-item">
                <ListTodo size={15} />
                <span>
                  {tasks.length}{" "}
                  {tasks.length === 1 ? "task" : "tasks"}
                </span>
              </div>

              {project.updatedAt && (
                <div className="document-meta-item">
                  <Clock3 size={15} />
                  <span>
                    Updated {formatDate(project.updatedAt)}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="progress-section">
            <div className="section-heading-row">
              <div>
                <span className="section-kicker">PROJECT STATUS</span>
                <h2>Overall progress</h2>
              </div>

              <strong className="progress-percentage">
                {progress}%
              </strong>
            </div>

            <div
              className="progress-track"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Project completion"
            >
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="progress-summary">
              <span>
                <strong>{completedTasks}</strong> completed
              </span>
              <span>
                <strong>{tasks.length - completedTasks}</strong> remaining
              </span>
            </div>
          </section>

          <section className="tasks-section">
            <div className="section-heading-row tasks-heading">
              <div>
                <span className="section-kicker">WORK BREAKDOWN</span>
                <h2>Project tasks</h2>
              </div>

              <span className="task-count-label">
                {tasks.length} total
              </span>
            </div>

            {sortedTasks.length === 0 ? (
              <div className="empty-tasks">
                <ListTodo size={25} />
                <h3>No tasks yet</h3>
                <p>Tasks added to this project will appear here.</p>
              </div>
            ) : (
              <div className="public-task-list">
                {sortedTasks.map((task) => (
                  <article className="public-task-item" key={task.id}>
                    <div className="task-status-icon">
                      {task.status === "completed" ? (
                        <CheckCircle2 className="status-completed" size={21} />
                      ) : task.status === "in_progress" ? (
                        <Clock3 className="status-progress" size={21} />
                      ) : (
                        <Circle className="status-todo" size={21} />
                      )}
                    </div>

                    <div className="public-task-content">
                      <div className="public-task-title-row">
                        <h3
                          className={
                            task.status === "completed"
                              ? "task-title-completed"
                              : ""
                          }
                        >
                          {task.title}
                        </h3>

                        <span
                          className={`task-status-badge status-${task.status}`}
                        >
                          {getStatusLabel(task.status)}
                        </span>
                      </div>

                      {task.description && (
                        <p className="public-task-description">
                          {task.description}
                        </p>
                      )}

                      <div className="public-task-meta">
                        <span
                          className={`task-priority priority-${task.priority}`}
                        >
                          <Flag size={12} />
                          {getPriorityLabel(task.priority)}
                        </span>

                        {task.deadline && (
                          <span className="task-deadline">
                            <CalendarDays size={13} />
                            {formatDate(task.deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {members.length > 0 && (
            <section className="members-section">
              <div className="section-heading-row">
                <div>
                  <span className="section-kicker">COLLABORATION</span>
                  <h2>Project members</h2>
                </div>
              </div>

              <div className="public-member-list">
                {members.map((member) => (
                  <div className="public-member-item" key={member.id}>
                    <div className="member-avatar">
                      {(member.displayName || "M")
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="member-information">
                      <strong>{member.displayName}</strong>
                      <span>
                        {member.role === "owner"
                          ? "Project Owner"
                          : member.role === "admin"
                            ? "Administrator"
                            : "Member"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <footer className="public-project-footer">
            <span>Shared via Chapri</span>
            <span className="footer-private-note">
              <ArrowUpRight size={13} />
              Read-only project overview
            </span>
          </footer>
        </article>
      </div>
    </main>
  );
}

export default PublicProject;
