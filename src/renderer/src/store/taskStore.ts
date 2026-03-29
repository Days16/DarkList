import { create } from 'zustand'
import { Task } from '@shared/types'

interface TaskState {
  tasks: Task[]
  pendingDelete: Task | null
  pendingDeleteIndex: number | null
  deleteTimer: ReturnType<typeof setTimeout> | null
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  restoreTask: () => void
  updateTaskItem: (id: string, data: Partial<Task>) => void
  removeTask: (id: string) => void
  reorderTasks: (activeId: string, overId: string) => void
  setPendingDelete: (task: Task | null, index?: number | null) => void
  setDeleteTimer: (t: ReturnType<typeof setTimeout> | null) => void
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  pendingDelete: null,
  pendingDeleteIndex: null,
  deleteTimer: null,
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) =>
    set((s) => {
      if (s.tasks.some((t) => t.id === task.id)) return s
      return { tasks: [task, ...s.tasks] }
    }),
  restoreTask: () =>
    set((s) => {
      if (!s.pendingDelete || s.pendingDeleteIndex === null) return s
      const newTasks = [...s.tasks]
      newTasks.splice(s.pendingDeleteIndex, 0, s.pendingDelete)
      return { tasks: newTasks, pendingDelete: null, pendingDeleteIndex: null }
    }),
  updateTaskItem: (id, data) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)) })),
  removeTask: (id: string) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  reorderTasks: (activeId, overId) =>
    set((s) => {
      const oldIndex = s.tasks.findIndex((t) => t.id === activeId)
      const newIndex = s.tasks.findIndex((t) => t.id === overId)
      if (oldIndex === -1 || newIndex === -1) return s

      const newTasks = [...s.tasks]
      const [removed] = newTasks.splice(oldIndex, 1)
      newTasks.splice(newIndex, 0, removed)

      // Update sort_order for all moved tasks
      newTasks.forEach((t, i) => {
        if (t.sort_order !== i) {
          t.sort_order = i
          window.api.updateTask(t.id, { sort_order: i })
        }
      })

      return { tasks: newTasks }
    }),
  setPendingDelete: (task, index = null) => set({ pendingDelete: task, pendingDeleteIndex: index }),
  setDeleteTimer: (t) => set({ deleteTimer: t })
}))
