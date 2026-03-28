import { create } from 'zustand'
import { Task } from '@shared/types'

interface TaskState {
  tasks: Task[]
  pendingDelete: Task | null
  deleteTimer: ReturnType<typeof setTimeout> | null
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTaskItem: (id: string, data: Partial<Task>) => void
  removeTask: (id: string) => void
  setPendingDelete: (task: Task | null) => void
  setDeleteTimer: (t: ReturnType<typeof setTimeout> | null) => void
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  pendingDelete: null,
  deleteTimer: null,
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  updateTaskItem: (id, data) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)) })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  setPendingDelete: (task) => set({ pendingDelete: task }),
  setDeleteTimer: (t) => set({ deleteTimer: t })
}))
