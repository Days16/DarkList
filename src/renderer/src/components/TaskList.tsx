import { useTaskStore } from '../store/taskStore'
import { useListStore } from '../store/listStore'
import { useUiStore } from '../store/uiStore'
import { Task, FilterType, SortType } from '@shared/types'
import TaskItem from './TaskItem'
import Snackbar from './Snackbar'

function applyFiltersAndSort(
  tasks: Task[],
  listId: string | null,
  filter: FilterType,
  sort: SortType,
  query: string
): Task[] {
  let result = [...tasks]

  if (listId !== null) result = result.filter((t) => t.list_id === listId)

  const now = Date.now()
  const todayStart = new Date().setHours(0, 0, 0, 0)
  const todayEnd = new Date().setHours(23, 59, 59, 999)
  const weekEnd = todayStart + 7 * 24 * 60 * 60 * 1000

  if (filter === 'today')
    result = result.filter((t) => t.due_date && t.due_date >= todayStart && t.due_date <= todayEnd)
  else if (filter === 'week')
    result = result.filter((t) => t.due_date && t.due_date >= todayStart && t.due_date <= weekEnd)
  else if (filter === 'priority') result = result.filter((t) => t.priority === 3)

  if (query) {
    const q = query.toLowerCase()
    result = result.filter((t) => t.title.toLowerCase().includes(q))
  }

  result.sort((a, b) => {
    if (sort === 'due_date') {
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date - b.due_date
    }
    if (sort === 'priority') return b.priority - a.priority
    return b.created_at - a.created_at
  })

  // done tasks go to bottom
  result.sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))

  return result
}

export default function TaskList(): JSX.Element {
  const { tasks, pendingDelete, deleteTimer, setPendingDelete, setDeleteTimer, removeTask } =
    useTaskStore()
  const activeListId = useListStore((s) => s.activeListId)
  const { filter, sort, searchQuery } = useUiStore()

  const visible = applyFiltersAndSort(tasks, activeListId, filter, sort, searchQuery)
  const pending = visible.filter((t) => !t.done)
  const done = visible.filter((t) => t.done)

  const requestDelete = (task: Task): void => {
    if (deleteTimer) clearTimeout(deleteTimer)
    removeTask(task.id)
    setPendingDelete(task)
    const t = setTimeout(async () => {
      await window.api.deleteTask(task.id)
      setPendingDelete(null)
      setDeleteTimer(null)
    }, 3000)
    setDeleteTimer(t)
  }

  const undoDelete = (): void => {
    if (!pendingDelete) return
    if (deleteTimer) clearTimeout(deleteTimer)
    useTaskStore.getState().addTask(pendingDelete)
    // Re-sort manually would be nice but store will just add at top
    setPendingDelete(null)
    setDeleteTimer(null)
  }

  if (visible.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-secondary text-sm">Sin tareas</p>
      </div>
    )
  }

  return (
    <div className="relative flex-1 overflow-y-auto">
      <div className="py-2">
        {pending.map((t) => (
          <TaskItem key={t.id} task={t} onDeleteRequest={requestDelete} />
        ))}
        {done.length > 0 && (
          <>
            <div className="px-4 pt-4 pb-1">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider">
                Completadas ({done.length})
              </span>
            </div>
            {done.map((t) => (
              <TaskItem key={t.id} task={t} onDeleteRequest={requestDelete} />
            ))}
          </>
        )}
      </div>

      {pendingDelete && (
        <Snackbar
          message={`"${pendingDelete.title}" eliminada`}
          actionLabel="Deshacer"
          onAction={undoDelete}
        />
      )}
    </div>
  )
}
