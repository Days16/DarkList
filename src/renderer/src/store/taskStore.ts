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
  reorderTasks: (activeId, overId) => {
    const { tasks } = useTaskStore.getState()
    const oldIndex = tasks.findIndex((t: Task) => t.id === activeId)
    const newIndex = tasks.findIndex((t: Task) => t.id === overId)
    if (oldIndex === -1 || newIndex === -1) return

    const arr = [...tasks]
    const [removed] = arr.splice(oldIndex, 1)
    arr.splice(newIndex, 0, removed)

    // Compute updates before mutating state
    const updates: { id: string; sort_order: number }[] = []
    const reordered = arr.map((t: Task, i: number) => {
      if (t.sort_order !== i) {
        updates.push({ id: t.id, sort_order: i })
        return { ...t, sort_order: i }
      }
      return t
    })

    set({ tasks: reordered })

    // IPC calls after set() — outside the reducer
    updates.forEach(({ id, sort_order }) => {
      window.api.updateTask(id, { sort_order })
    })
  },
  setPendingDelete: (task, index = null) => set({ pendingDelete: task, pendingDeleteIndex: index }),
  setDeleteTimer: (t) => set({ deleteTimer: t })
}))
