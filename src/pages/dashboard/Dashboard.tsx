
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
  Plus,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";

import {
  type Task,
  subscribeToTasks,
  createTask,
  editTask,
  updateTaskStatus,
  removeTask,
} from "../../services/tasks/taskService";

import TaskItem from "../../components/tasks/TaskItem";
import TaskForm from "../../components/tasks/TaskForm";
import ShareTaskModal from "../../components/chat/ShareTaskModal";

import type { SharedTaskPayload } from "../../services/chat/taskShareService";

import "../../styles/dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sharingTask, setSharingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  // =========================================
  // SUBSCRIBE TASKS
  // =========================================

  useEffect(() => {
    if (!user) return;

    return subscribeToTasks(user.uid, setTasks);
  }, [user]);

  // =========================================
  // TASK STATISTICS
  // =========================================

  const stats = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((task) => task.status === "todo").length,
      progress: tasks.filter(
        (task) => task.status === "in_progress"
      ).length,
      completed: tasks.filter(
        (task) => task.status === "completed"
      ).length,
    }),
    [tasks]
  );

  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (task) => filter === "all" || task.status === filter
      ),
    [tasks, filter]
  );

  const completionRate =
    stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;

  const firstName =
    user?.displayName?.trim().split(/\s+/)[0] || "there";

  // =========================================
  // SAVE TASK
  // =========================================

  const handleSave = async (
    title: string,
    description: string,
    priority: Task["priority"]
  ) => {
    try {
      setError("");

      if (!user) return;

      if (editingTask) {
        await editTask(editingTask.id, {
          title,
          description,
          priority,
        });
      } else {
        await createTask(
          user.uid,
          title,
          description,
          priority
        );
      }

      setShowForm(false);
      setEditingTask(null);
    } catch {
      setError("Failed to save task. Please try again.");
    }
  };

  // =========================================
  // DELETE TASK
  // =========================================

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this task?"
      )
    ) {
      return;
    }

    try {
      setError("");
      await removeTask(id);
    } catch {
      setError("Failed to delete task.");
    }
  };

  // =========================================
  // UPDATE TASK STATUS
  // =========================================

  const handleStatusChange = async (
    id: string,
    status: Task["status"]
  ) => {
    try {
      setError("");
      await updateTaskStatus(id, status);
    } catch {
      setError("Failed to update task status.");
    }
  };

  // =========================================
  // SHARE TASK PAYLOAD
  // =========================================

  const getSharePayload = (
    task: Task
  ): SharedTaskPayload => ({
    id: task.id,
    source: "personal",
    sourceGroupId: null,
    title: task.title,
    description: task.description || "",
    status: task.status,
    priority: task.priority,
    deadline: null,
  });

  // =========================================
  // OPEN CREATE FORM
  // =========================================

  const openCreateForm = () => {
    setError("");
    setEditingTask(null);
    setShowForm(true);
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="chapri-dashboard">

      {/* =====================================
          PAGE INTRO
      ===================================== */}

      <section className="dashboard-welcome">
        <div className="dashboard-welcome-content">
          <div className="dashboard-welcome-label">
            <Sparkles size={14} />
            <span>YOUR PERSONAL WORKSPACE</span>
          </div>

          <h1>
            Dashboard<span className="dashboard-title-dot">.</span>
          </h1>

          <p>
            Good to see you, {firstName}. Organize your priorities
            and make progress one task at a time.
          </p>
        </div>

        <div className="dashboard-welcome-decoration">
          <div className="dashboard-decoration-circle dashboard-circle-one" />
          <div className="dashboard-decoration-circle dashboard-circle-two" />

          <div className="dashboard-decoration-card">
            <div className="dashboard-decoration-icon">
              <CheckCircle2 size={25} />
            </div>

            <div>
              <strong>{completionRate}%</strong>
              <span>Completion rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          TASK OVERVIEW
      ===================================== */}

      <section className="dashboard-overview">
        <div className="dashboard-section-intro">
          <div>
            <span className="dashboard-eyebrow">
              AT A GLANCE
            </span>
            <h2>Task overview</h2>
          </div>

          <span className="dashboard-overview-caption">
            Your productivity at a glance
          </span>
        </div>

        <div className="dashboard-stats-grid">

          {/* ALL TASKS */}

          <article className="dashboard-stat-card">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon icon-total">
                <ListTodo size={19} />
              </div>

              <span className="dashboard-stat-label">
                ALL TASKS
              </span>
            </div>

            <strong className="dashboard-stat-number">
              {stats.total}
            </strong>

            <span className="dashboard-stat-description">
              Tasks in your workspace
            </span>
          </article>

          {/* TO DO */}

          <article className="dashboard-stat-card">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon icon-todo">
                <Circle size={19} />
              </div>

              <span className="dashboard-stat-label">
                TO DO
              </span>
            </div>

            <strong className="dashboard-stat-number">
              {stats.todo}
            </strong>

            <span className="dashboard-stat-description">
              Waiting to be started
            </span>
          </article>

          {/* IN PROGRESS */}

          <article className="dashboard-stat-card">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon icon-progress">
                <Clock3 size={19} />
              </div>

              <span className="dashboard-stat-label">
                IN PROGRESS
              </span>
            </div>

            <strong className="dashboard-stat-number">
              {stats.progress}
            </strong>

            <span className="dashboard-stat-description">
              Currently being worked on
            </span>
          </article>

          {/* COMPLETED */}

          <article className="dashboard-stat-card">
            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon icon-completed">
                <CheckCircle2 size={19} />
              </div>

              <span className="dashboard-stat-label">
                COMPLETED
              </span>
            </div>

            <strong className="dashboard-stat-number">
              {stats.completed}
            </strong>

            <span className="dashboard-stat-description">
              Successfully finished
            </span>
          </article>

        </div>
      </section>

      {/* =====================================
          TASK LIST
      ===================================== */}

      <section
        className="dashboard-tasks-section"
        id="personal-tasks"
      >
        <div className="dashboard-tasks-header">
          <div>
            <span className="dashboard-eyebrow">
              YOUR WORKSPACE
            </span>

            <h2>All tasks</h2>

            <p>
              Keep track of everything you need to get done.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-secondary-create"
            onClick={openCreateForm}
          >
            <Plus size={16} />
            New task
          </button>
        </div>

        {/* TASK TOOLBAR */}

        <div className="dashboard-task-toolbar">
          <div className="dashboard-task-count">
            <span>{filteredTasks.length}</span>

            <span>
              {filteredTasks.length === 1
                ? "task"
                : "tasks"}{" "}
              displayed
            </span>
          </div>

          <div className="dashboard-filter">
            <label htmlFor="dashboard-task-filter">
              Filter:
            </label>

            <select
              id="dashboard-task-filter"
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
            >
              <option value="all">All tasks</option>
              <option value="todo">To do</option>
              <option value="in_progress">
                In progress
              </option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div
            className="dashboard-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* EMPTY STATE OR TASK GRID */}

        {filteredTasks.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="dashboard-empty-icon">
              <ListTodo size={27} />
            </div>

            <h3>
              {tasks.length === 0
                ? "Your workspace is ready"
                : "No tasks found"}
            </h3>

            <p>
              {tasks.length === 0
                ? "You haven't created any personal tasks yet. Start with one small step."
                : "There are no tasks matching this filter. Try selecting another status."}
            </p>

            {/* CREATE FIRST TASK */}

            {tasks.length === 0 && (
              <button
                type="button"
                className="dashboard-create-button"
                onClick={openCreateForm}
              >
                <Plus size={16} />
                Create your first task
              </button>
            )}

            {/* RESET FILTER */}

            {tasks.length > 0 && filter !== "all" && (
              <button
                type="button"
                className="dashboard-reset-filter"
                onClick={() => setFilter("all")}
              >
                View all tasks
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        ) : (
          <div className="dashboard-task-grid">
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={(selectedTask) => {
                  setError("");
                  setEditingTask(selectedTask);
                  setShowForm(true);
                }}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onShare={setSharingTask}
              />
            ))}
          </div>
        )}
      </section>

      {/* =====================================
          TASK FORM
      ===================================== */}

      {showForm && (
        <TaskForm
          initialTask={editingTask}
          onSubmit={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* =====================================
          SHARE TASK MODAL
      ===================================== */}

      {sharingTask && user && (
        <ShareTaskModal
          task={getSharePayload(sharingTask)}
          currentUserId={user.uid}
          onClose={() => setSharingTask(null)}
        />
      )}

    </div>
  );
};

export default Dashboard;
