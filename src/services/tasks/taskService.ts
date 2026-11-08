
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  userId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// Mengambil task milik pengguna yang sedang login
export const subscribeToTasks = (
  userId: string,
  callback: (tasks: Task[]) => void
) => {
  const tasksQuery = query(
    collection(db, "tasks"),
    where("userId", "==", userId)
  );

  return onSnapshot(tasksQuery, (snapshot) => {
    const tasks = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as Task[];

    callback(tasks);
  });
};

// Menambahkan task
export const createTask = async (
  userId: string,
  title: string,
  description: string,
  priority: Task["priority"]
) => {
  return addDoc(collection(db, "tasks"), {
    userId,
    title,
    description,
    priority,
    status: "todo",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// Mengedit task
export const editTask = async (
  taskId: string,
  data: Partial<Pick<Task, "title" | "description" | "priority">>
) => {
  return updateDoc(doc(db, "tasks", taskId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Mengubah status task
export const updateTaskStatus = async (
  taskId: string,
  status: Task["status"]
) => {
  return updateDoc(doc(db, "tasks", taskId), {
    status,
    updatedAt: serverTimestamp(),
  });
};

// Menghapus task
export const removeTask = async (taskId: string) => {
  return deleteDoc(doc(db, "tasks", taskId));
};
