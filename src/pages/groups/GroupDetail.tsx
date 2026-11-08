import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  LayoutDashboard,
  MessageCircle,
  ListTodo,
  Users,
  Settings,
  Copy,
  Check,
  Globe,
  ExternalLink,
  Plus,
  X,
  Pencil,
  Trash2,
  Save,
  AlertTriangle,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";

import {
  getGroup,
  getGroupMembers,
  changeMemberRole,
  removeMember,
  leaveGroup,
  updateGroup,
  deleteGroup,
  type Group,
  type GroupMember,
  type GroupRole,
} from "../../services/groups/groupService";

import {
  createGroupTask,
  getGroupTasks,
  updateGroupTaskDetails,
  updateGroupTaskStatus,
  deleteGroupTask,
  type GroupTask,
  type GroupTaskPriority,
  type GroupTaskStatus,
} from "../../services/groups/groupTaskService";

import {
  getPublicShareSettings,
  enablePublicProject,
  disablePublicProject,
} from "../../services/groups/publicProjectService";

import { getOrCreatePrivateChat } from "../../services/chat/chatService";
import type { SharedTaskPayload } from "../../services/chat/taskShareService";

import MemberList from "../../components/groups/MemberList";
import GroupTaskItem from "../../components/groups/GroupTaskItem";
import GroupChatPanel from "../../components/chat/GroupChatPanel";
import ShareTaskModal from "../../components/chat/ShareTaskModal";

type GroupTab = "overview" | "chat" | "tasks" | "members" | "settings";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "members", label: "Members", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

const taskColumns: {
  status: GroupTaskStatus;
  title: string;
  description: string;
  color: string;
}[] = [
  {
    status: "todo",
    title: "To Do",
    description: "Tasks waiting to be started",
    color: "bg-slate-400",
  },
  {
    status: "in_progress",
    title: "In Progress",
    description: "Tasks currently being worked on",
    color: "bg-blue-500",
  },
  {
    status: "completed",
    title: "Completed",
    description: "Finished tasks",
    color: "bg-emerald-500",
  },
];

const getLocalDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [tasks, setTasks] = useState<GroupTask[]>([]);

  const [activeTab, setActiveTab] = useState<GroupTab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [savingTask, setSavingTask] = useState(false);
  const [copied, setCopied] = useState(false);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const [editingTask, setEditingTask] = useState<GroupTask | null>(null);
  const [sharingTask, setSharingTask] = useState<GroupTask | null>(null);

  // TASK FORM VISIBILITY
  const [showTaskForm, setShowTaskForm] = useState(false);

  // GROUP EDIT STATE
  const [showGroupEditForm, setShowGroupEditForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [groupEditError, setGroupEditError] = useState("");

  // GROUP DELETE STATE
  const [deletingGroup, setDeletingGroup] = useState(false);

  // PUBLIC PROJECT SHARING STATE
  const [publicShareId, setPublicShareId] = useState<string | null>(null);
  const [publicEnabled, setPublicEnabled] = useState(false);
  const [publicSaving, setPublicSaving] = useState(false);
  const [publicCopied, setPublicCopied] = useState(false);
  const [publicError, setPublicError] = useState("");

  // TASK FORM DATA
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<GroupTaskPriority>("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [deadline, setDeadline] = useState("");

  const currentMember = members.find(
    (member) => member.uid === user?.uid
  );

  const isOwner = Boolean(
    user && group && group.ownerId === user.uid
  );

  const canManageTasks =
    currentMember?.role === "owner" ||
    currentMember?.role === "admin";

  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  // RESET TASK FORM

  const resetTaskForm = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setPriority("medium");
    setAssignedTo("");
    setDeadline("");
    setTaskError("");
    setShowTaskForm(false);
  };

  // LOAD GROUP

  const loadGroup = useCallback(async () => {
    if (!id || !user) {
      setError("Group ID or user is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        groupData,
        memberData,
        taskData,
        publicSettings,
      ] = await Promise.all([
        getGroup(id),
        getGroupMembers(id),
        getGroupTasks(id, user.uid),
        getPublicShareSettings(id),
      ]);

      if (!groupData) {
        setError("Group not found.");
        return;
      }

      setGroup(groupData);
      setMembers(memberData);
      setTasks(taskData);

      setPublicShareId(publicSettings.shareId);
      setPublicEnabled(publicSettings.enabled);

      setGroupName(groupData.name);
      setGroupDescription(groupData.description || "");
    } catch (err) {
      console.error("Load group detail error:", err);
      setError("Failed to load group details.");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  // GROUP INFORMATION MANAGEMENT

  const handleOpenGroupEdit = () => {
    if (!group || !isOwner) return;

    setGroupName(group.name);
    setGroupDescription(group.description || "");
    setGroupEditError("");
    setShowGroupEditForm(true);
  };

  const handleCancelGroupEdit = () => {
    if (!group) return;

    setGroupName(group.name);
    setGroupDescription(group.description || "");
    setGroupEditError("");
    setShowGroupEditForm(false);
  };

  const handleUpdateGroup = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!id || !user || !group || !isOwner || savingGroup) return;

    const trimmedName = groupName.trim();
    const trimmedDescription = groupDescription.trim();

    if (!trimmedName) {
      setGroupEditError("Group name cannot be empty.");
      return;
    }

    try {
      setSavingGroup(true);
      setGroupEditError("");

      await updateGroup(
        id,
        trimmedName,
        trimmedDescription
      );

      setGroup((currentGroup) =>
        currentGroup
          ? {
              ...currentGroup,
              name: trimmedName,
              description: trimmedDescription,
            }
          : currentGroup
      );

      setShowGroupEditForm(false);
    } catch (err) {
      console.error("Update group error:", err);

      setGroupEditError(
        err instanceof Error
          ? err.message
          : "Failed to update group information."
      );
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!id || !user || !group || !isOwner || deletingGroup) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${group.name}"?\n\n` +
        "This action will delete the group, its tasks, members, group chat, invitation code, and public project data. This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeletingGroup(true);
      setError("");

      await deleteGroup(id, user.uid);

      navigate("/groups", { replace: true });
    } catch (err) {
      console.error("Delete group error:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to delete group.";

      alert(message);
      setDeletingGroup(false);
    }
  };

  // MEMBER MANAGEMENT

  const handleChangeRole = async (
    targetId: string,
    role: GroupRole
  ) => {
    if (!id || !user) return;

    try {
      await changeMemberRole(id, user.uid, targetId, role);
      await loadGroup();
    } catch (err) {
      console.error("Change member role error:", err);
      alert("Failed to change member role.");
    }
  };

  const handleRemoveMember = async (targetId: string) => {
    if (!id || !user) return;

    try {
      await removeMember(id, user.uid, targetId);
      await loadGroup();
    } catch (err) {
      console.error("Remove member error:", err);
      alert("Failed to remove member.");
    }
  };

  const handleLeaveGroup = async () => {
    if (!id || !user) return;

    try {
      await leaveGroup(id, user.uid);
      navigate("/groups", { replace: true });
    } catch (err) {
      console.error("Leave group error:", err);
      alert("Failed to leave group.");
    }
  };

  // PRIVATE CHAT

  const handleStartChat = async (targetId: string) => {
    if (!user) {
      throw new Error("You must be logged in to start a chat.");
    }

    try {
      const chatId = await getOrCreatePrivateChat(
        user.uid,
        targetId
      );

      navigate(`/chats/${chatId}`);
    } catch (err) {
      console.error("Start private chat error:", err);
      throw err;
    }
  };

  // INVITATION CODE

  const handleCopyInviteCode = async () => {
    if (!group?.inviteCode) return;

    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy invitation code error:", err);
      alert("Failed to copy invitation code.");
    }
  };

  // PUBLIC PROJECT SHARING

  const handleEnablePublicSharing = async () => {
    if (!id || !user || publicSaving) return;

    try {
      setPublicSaving(true);
      setPublicError("");

      const shareId = await enablePublicProject(id, user.uid);

      setPublicShareId(shareId);
      setPublicEnabled(true);
    } catch (err) {
      console.error("Enable public sharing error:", err);

      setPublicError(
        err instanceof Error
          ? err.message
          : "Failed to enable public sharing."
      );
    } finally {
      setPublicSaving(false);
    }
  };

  const handleDisablePublicSharing = async () => {
    if (!id || !user || publicSaving) return;

    const confirmed = window.confirm(
      "Are you sure you want to disable public project sharing?"
    );

    if (!confirmed) return;

    try {
      setPublicSaving(true);
      setPublicError("");

      await disablePublicProject(id, user.uid);

      setPublicEnabled(false);
    } catch (err) {
      console.error("Disable public sharing error:", err);

      setPublicError(
        err instanceof Error
          ? err.message
          : "Failed to disable public sharing."
      );
    } finally {
      setPublicSaving(false);
    }
  };

  const handleCopyPublicLink = async () => {
    if (!publicShareId) return;

    const publicUrl =
      `${window.location.origin}/public/projects/${publicShareId}`;

    try {
      await navigator.clipboard.writeText(publicUrl);

      setPublicCopied(true);

      window.setTimeout(() => {
        setPublicCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Copy public link error:", err);
      alert("Failed to copy public project link.");
    }
  };

  // CREATE / UPDATE GROUP TASK

  const handleTaskSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!id || !user) return;

    try {
      setSavingTask(true);
      setTaskError("");

      const input = {
        title,
        description,
        priority,
        assignedTo: assignedTo || null,
        deadline: deadline
          ? new Date(`${deadline}T23:59:59`)
          : null,
      };

      if (editingTask) {
        await updateGroupTaskDetails(
          id,
          editingTask.id,
          user.uid,
          input
        );
      } else {
        await createGroupTask(id, user.uid, input);
      }

      resetTaskForm();
      await loadGroup();
    } catch (err) {
      console.error("Save group task error:", err);

      setTaskError(
        err instanceof Error
          ? err.message
          : "Failed to save task."
      );
    } finally {
      setSavingTask(false);
    }
  };

  // OPEN ADD TASK FORM

  const handleOpenCreateForm = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setPriority("medium");
    setAssignedTo("");
    setDeadline("");
    setTaskError("");
    setShowTaskForm(true);
  };

  // EDIT TASK

  const handleEditTask = (task: GroupTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setAssignedTo(task.assignedTo || "");
    setDeadline(
      task.deadline
        ? getLocalDateValue(task.deadline.toDate())
        : ""
    );

    setTaskError("");
    setShowTaskForm(true);
    setActiveTab("tasks");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // SHARE TASK

  const getSharePayload = (task: GroupTask): SharedTaskPayload => ({
    id: task.id,
    source: "group",
    sourceGroupId: group!.id,
    title: task.title,
    description: task.description || "",
    status: task.status,
    priority: task.priority,
    deadline: task.deadline
      ? task.deadline.toDate().toISOString()
      : null,
  });

  // UPDATE TASK STATUS

  const handleTaskStatusChange = async (
    taskId: string,
    status: GroupTaskStatus
  ) => {
    if (!id || !user) return;

    const previousTask = tasks.find((task) => task.id === taskId);

    if (!previousTask || previousTask.status === status) return;

    try {
      setUpdatingTaskId(taskId);

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId ? { ...task, status } : task
        )
      );

      await updateGroupTaskStatus(id, taskId, user.uid, status);
    } catch (err) {
      console.error("Update task status error:", err);

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId
            ? { ...task, status: previousTask.status }
            : task
        )
      );

      alert("Failed to update task status.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // DRAG AND DROP

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    taskId: string
  ) => {
    setDraggedTaskId(taskId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (
    event: React.DragEvent<HTMLDivElement>,
    newStatus: GroupTaskStatus
  ) => {
    event.preventDefault();

    const taskId =
      event.dataTransfer.getData("text/plain") || draggedTaskId;

    setDraggedTaskId(null);

    if (!taskId || updatingTaskId) return;

    const task = tasks.find((item) => item.id === taskId);

    if (!task || task.status === newStatus) return;

    await handleTaskStatusChange(taskId, newStatus);
  };

  // DELETE TASK

  const handleDeleteTask = async (taskId: string) => {
    if (!id || !user) return;

    try {
      await deleteGroupTask(id, taskId, user.uid);

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId)
      );
    } catch (err) {
      console.error("Delete task error:", err);
      alert("Failed to delete task.");
    }
  };

  // LOADING

  if (loading) {
    return (
      <div className="w-full min-w-0 space-y-6">
        {/* LOADING HEADER */}

        <div className="flex items-center justify-between">
          <span className="text-2xl font-extrabold tracking-tight text-[#172b4d]">
            chapri<span className="text-[#3155c5]">.</span>
          </span>

          <span className="text-xs font-medium text-slate-400">
            Loading workspace...
          </span>
        </div>

        {/* GROUP HEADER SKELETON */}

        <section className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="h-6 w-32 rounded-full bg-blue-50" />
              <div className="h-8 w-2/3 max-w-sm rounded-lg bg-slate-200" />
              <div className="h-3 w-full max-w-lg rounded bg-slate-100" />
              <div className="h-3 w-3/4 max-w-md rounded bg-slate-100" />
            </div>

            <div className="flex h-20 w-24 flex-col justify-center gap-2 rounded-xl bg-slate-50 p-4">
              <div className="h-6 w-8 rounded bg-slate-200" />
              <div className="h-3 w-14 rounded bg-slate-100" />
            </div>
          </div>
        </section>

        {/* TAB NAVIGATION SKELETON */}

        <div className="animate-pulse flex gap-6 overflow-hidden border-b border-slate-200 pb-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-5 w-20 flex-shrink-0 rounded bg-slate-100"
            />
          ))}
        </div>

        {/* OVERVIEW STATISTICS */}

        <div className="animate-pulse grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="h-3 w-24 rounded bg-slate-100" />
              <div className="mt-4 h-8 w-12 rounded-lg bg-slate-200" />
            </div>
          ))}
        </div>

        {/* RECENT TASKS */}

        <section className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-slate-200" />
              <div className="h-3 w-56 max-w-full rounded bg-slate-100" />
            </div>

            <div className="h-4 w-20 rounded bg-slate-100" />
          </div>

          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 rounded-xl border border-slate-100 p-4"
              >
                <div className="h-9 w-9 flex-shrink-0 rounded-lg bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-slate-200" />
                  <div className="h-3 w-1/3 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MEMBERS */}

        <section className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
          <div className="h-5 w-36 rounded bg-slate-200" />

          <div className="mt-5 flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-9 w-28 rounded-full bg-slate-100"
              />
            ))}
          </div>
        </section>

        {/* LOADING FOOTER */}

        <div className="flex items-center justify-center gap-2 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />

          <p className="text-xs font-medium text-slate-400">
            Chapri is preparing your workspace...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <p className="text-red-600">{error}</p>

        <button
          onClick={() => navigate("/groups")}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  if (!group || !user) return null;

  // MAIN UI

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* BACK BUTTON */}

      <button
        onClick={() => navigate("/groups")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
      >
        <ArrowLeft size={17} />
        Back to Groups
      </button>

      {/* GROUP HEADER */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              GROUP WORKSPACE
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {group.name}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {group.description || "No description provided."}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
            <Users size={19} className="text-blue-600" />

            <div>
              <p className="text-lg font-bold text-slate-900">
                {members.length}
              </p>

              <p className="text-xs text-slate-500">Members</p>
            </div>
          </div>
        </div>
      </section>

      {/* TAB NAVIGATION */}

      <div className="overflow-x-auto border-b border-slate-200">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon size={17} />
                {tab.label}

                {tab.id === "tasks" && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {tasks.length}
                  </span>
                )}

                {tab.id === "members" && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {members.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* OVERVIEW TAB */}

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Total Tasks</p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {tasks.length}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Completed Tasks</p>

              <p className="mt-2 text-3xl font-bold text-green-600">
                {completedTasks}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Group Members</p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                {members.length}
              </p>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Group Tasks
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  A quick look at your group's tasks.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("tasks")}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View all tasks →
              </button>
            </div>

            {tasks.length === 0 ? (
              <p className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                No tasks have been created yet.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {task.title}
                      </p>

                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {task.status.replace("_", " ")} · {task.priority} priority
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Group Members
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  People collaborating in this workspace.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("members")}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View members →
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {members.slice(0, 6).map((member) => (
                <span
                  key={member.uid}
                  className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600"
                >
                  {member.displayName || member.email}
                </span>
              ))}

              {members.length === 0 && (
                <p className="text-sm text-slate-500">
                  No members found.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* CHAT TAB */}

      {activeTab === "chat" && (
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <GroupChatPanel
            groupId={group.id}
            currentUserId={user.uid}
            members={members}
          />
        </section>
      )}

      {/* TASKS TAB */}

      {activeTab === "tasks" && (
        <section className="min-w-0 space-y-5">
          {/* TASK HEADER */}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Collaborative Tasks
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Tasks shared with members of this group.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600">
                {tasks.length} Tasks
              </span>

              {!showTaskForm && (
                <button
                  type="button"
                  onClick={handleOpenCreateForm}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Plus size={17} />
                  Add Task
                </button>
              )}
            </div>
          </div>

          {/* TASK FORM */}

          {showTaskForm && (
            <form
              onSubmit={handleTaskSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingTask ? "Edit Task" : "Create New Task"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {editingTask
                      ? "Update the task information below."
                      : "Fill in the details to create a group task."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetTaskForm}
                  aria-label="Close task form"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="task-title"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Task Title
                  </label>

                  <input
                    id="task-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={150}
                    required
                    placeholder="Enter task title"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="task-description"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="task-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    placeholder="Describe this task..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="task-priority"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Priority
                    </label>

                    <select
                      id="task-priority"
                      value={priority}
                      onChange={(event) =>
                        setPriority(event.target.value as GroupTaskPriority)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="task-assignee"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Assign To
                    </label>

                    <select
                      id="task-assignee"
                      value={assignedTo}
                      onChange={(event) => setAssignedTo(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                    >
                      <option value="">Unassigned</option>

                      {members.map((member) => (
                        <option key={member.uid} value={member.uid}>
                          {member.displayName || member.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="task-deadline"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Deadline
                    </label>

                    <input
                      id="task-deadline"
                      type="date"
                      value={deadline}
                      onChange={(event) => setDeadline(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                    />
                  </div>
                </div>
              </div>

              {taskError && (
                <p className="mt-3 text-sm text-red-600">
                  {taskError}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={savingTask}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingTask
                    ? "Saving..."
                    : editingTask
                      ? "Save Changes"
                      : "Create Task"}
                </button>

                <button
                  type="button"
                  onClick={resetTaskForm}
                  disabled={savingTask}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* TASK BOARD */}

          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <ListTodo
                className="mx-auto mb-3 text-slate-400"
                size={34}
              />

              <h3 className="font-semibold text-slate-800">
                No tasks yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create the first collaborative task for this group.
              </p>

              {!showTaskForm && (
                <button
                  type="button"
                  onClick={handleOpenCreateForm}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Create First Task
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <div className="grid min-w-[900px] grid-cols-3 items-start gap-5">
                {taskColumns.map((column) => {
                  const columnTasks = tasks.filter(
                    (task) => task.status === column.status
                  );

                  return (
                    <div
                      key={column.status}
                      onDragOver={handleDragOver}
                      onDrop={(event) =>
                        void handleDrop(event, column.status)
                      }
                      className="min-h-[450px] rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-colors"
                    >
                      <div className="mb-2 flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${column.color}`}
                          />

                          <h3 className="font-bold text-slate-800">
                            {column.title}
                          </h3>

                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
                            {columnTasks.length}
                          </span>
                        </div>
                      </div>

                      <p className="mb-4 px-1 text-xs text-slate-400">
                        {column.description}
                      </p>

                      <div className="space-y-3">
                        {columnTasks.map((task) => (
                          <div
                            key={task.id}
                            draggable={!updatingTaskId}
                            onDragStart={(event) =>
                              handleDragStart(event, task.id)
                            }
                            onDragEnd={() => setDraggedTaskId(null)}
                            className={`cursor-grab transition-all active:cursor-grabbing ${
                              draggedTaskId === task.id
                                ? "scale-95 opacity-40"
                                : "opacity-100"
                            }`}
                          >
                            <GroupTaskItem
                              task={task}
                              members={members}
                              canManage={canManageTasks}
                              onStatusChange={handleTaskStatusChange}
                              onEdit={handleEditTask}
                              onDelete={handleDeleteTask}
                              onShare={setSharingTask}
                            />
                          </div>
                        ))}

                        {columnTasks.length === 0 && (
                          <div className="flex min-h-[130px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white/60 p-5 text-center">
                            <p className="text-xs text-slate-400">
                              Drop tasks here
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-center text-xs text-slate-400">
            Drag and drop tasks between columns to update their status.
          </p>
        </section>
      )}

      {/* MEMBERS TAB */}

      {activeTab === "members" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Group Members
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage members, roles, and private conversations.
            </p>
          </div>

          <MemberList
            members={members}
            currentUserId={user.uid}
            ownerId={group.ownerId}
            onChangeRole={handleChangeRole}
            onRemoveMember={handleRemoveMember}
            onLeaveGroup={handleLeaveGroup}
            onStartChat={handleStartChat}
          />
        </section>
      )}

      {/* SETTINGS TAB */}

      {activeTab === "settings" && (
        <section className="max-w-2xl space-y-5">
          {/* INVITATION SETTINGS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Invitation Settings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Share this code with people you want to invite to your group.
            </p>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Group Invitation Code
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded-lg bg-slate-100 px-4 py-3 text-sm font-bold tracking-wider text-slate-800">
                  {group.inviteCode}
                </code>

                <button
                  type="button"
                  onClick={handleCopyInviteCode}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy Code"}
                </button>
              </div>
            </div>
          </div>

          {/* PUBLIC PROJECT SHARING */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Globe size={20} className="text-blue-600" />

                  <h2 className="text-lg font-bold text-slate-900">
                    Public Project Sharing
                  </h2>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Share your project progress with anyone through a public
                  link. Visitors do not need to log in.
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  publicEnabled
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {publicEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            {publicError && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {publicError}
              </p>
            )}

            {publicEnabled && publicShareId ? (
              <div className="mt-5 space-y-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Public Project Link
                </label>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/public/projects/${publicShareId}`}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleCopyPublicLink}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    {publicCopied ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}

                    {publicCopied ? "Copied" : "Copy Link"}
                  </button>
                </div>

                <a
                  href={`/public/projects/${publicShareId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View Public Page
                  <ExternalLink size={15} />
                </a>

                <p className="text-xs leading-5 text-slate-400">
                  Anyone with this link can view the project's progress.
                  They cannot edit tasks or access your private workspace.
                </p>

                <button
                  type="button"
                  onClick={handleDisablePublicSharing}
                  disabled={publicSaving}
                  className="mt-3 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {publicSaving
                    ? "Processing..."
                    : "Disable Public Sharing"}
                </button>
              </div>
            ) : (
              <div className="mt-5">
                <div className="mb-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Make your project publicly accessible
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your project name, description, task progress, and
                    member display names will be visible to visitors.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleEnablePublicSharing}
                  disabled={publicSaving || !canManageTasks}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Globe size={16} />

                  {publicSaving
                    ? "Enabling..."
                    : "Enable Public Sharing"}
                </button>

                {!canManageTasks && (
                  <p className="mt-2 text-xs text-slate-400">
                    Only group owners and administrators can manage public sharing.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* GROUP INFORMATION */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Group Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  View and manage your group's basic information.
                </p>
              </div>

              {isOwner && !showGroupEditForm && (
                <button
                  type="button"
                  onClick={handleOpenGroupEdit}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Pencil size={15} />
                  Edit Group
                </button>
              )}
            </div>

            {showGroupEditForm ? (
              <form
                onSubmit={handleUpdateGroup}
                className="mt-5 space-y-4"
              >
                <div>
                  <label
                    htmlFor="group-name"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Group Name
                  </label>

                  <input
                    id="group-name"
                    type="text"
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    maxLength={100}
                    required
                    placeholder="Enter group name"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="group-description"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="group-description"
                    value={groupDescription}
                    onChange={(event) =>
                      setGroupDescription(event.target.value)
                    }
                    rows={4}
                    maxLength={500}
                    placeholder="Describe your group..."
                    className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {groupEditError && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {groupEditError}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={savingGroup || !groupName.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={16} />

                    {savingGroup ? "Saving..." : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelGroupEdit}
                    disabled={savingGroup}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Group Name
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {group.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Description
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {group.description || "No description provided."}
                  </p>
                </div>

                {!isOwner && (
                  <p className="text-xs text-slate-400">
                    Only the group owner can edit group information.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* DANGER ZONE - OWNER ONLY */}

          {isOwner && (
            <div className="rounded-2xl border border-red-200 bg-white p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-red-50 p-2.5">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-red-700">
                    Danger Zone
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Permanently delete this group and its associated data.
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50/50 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Delete this group
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Group tasks, members, group chat, invitation code, and
                    public project data will also be deleted.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDeleteGroup}
                  disabled={deletingGroup || savingGroup}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />

                  {deletingGroup ? "Deleting..." : "Delete Group"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* SHARE TASK MODAL */}

      {sharingTask && (
        <ShareTaskModal
          task={getSharePayload(sharingTask)}
          currentUserId={user.uid}
          onClose={() => setSharingTask(null)}
        />
      )}
    </div>
  );
};

export default GroupDetail;