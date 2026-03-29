import { useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
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

  // Ensure parents of matched subtasks are included so they can be rendered
  const matchedIds = new Set(result.map(t => t.id))
  const parentIdsOfMatches = new Set(result.filter(t => t.parent_id).map(t => t.parent_id))
  
  for (const parentId of parentIdsOfMatches) {
    if (!matchedIds.has(parentId!)) {
      const parentTask = tasks.find(t => t.id === parentId)
      if (parentTask) result.push(parentTask)
    }
  }

  result.sort((a, b) => {
    if (sort === 'due_date') {
      if (a.due_date === null && b.due_date === null) return 0
      if (a.due_date === null) return 1
      if (b.due_date === null) return -1
      return a.due_date - b.due_date
    }
    if (sort === 'priority') {
      return b.priority - a.priority
    }
    // 'created' — Manual sort_order takes precedence
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return b.created_at - a.created_at
  })

  // done tasks go to bottom
  result.sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))

  return result
}

export default function TaskList(): JSX.Element {
  const { tasks, pendingDelete, deleteTimer, setPendingDelete, setDeleteTimer, removeTask, reorderTasks } =
    useTaskStore()
  const activeListId = useListStore((s) => s.activeListId)
  const { filter, sort, searchQuery, t } = useUiStore()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const visible = useMemo(
    () => applyFiltersAndSort(tasks, activeListId, filter, sort, searchQuery),
    [tasks, activeListId, filter, sort, searchQuery]
  )
  
  // Group main tasks and subtasks
  const mainTasks = visible.filter((t: Task) => !t.parent_id)
  const pending = mainTasks.filter((t: Task) => !t.done)
  const done = mainTasks.filter((t: Task) => t.done)

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderTasks(active.id as string, over.id as string)
    }
  }

  const requestDelete = async (task: Task): Promise<void> => {
    if (deleteTimer) clearTimeout(deleteTimer)
    const index = useTaskStore.getState().tasks.findIndex(t => t.id === task.id)
    removeTask(task.id)
    setPendingDelete(task, index !== -1 ? index : 0)
    await window.api.deleteTask(task.id)
    const t = setTimeout(() => {
      setPendingDelete(null)
      setDeleteTimer(null)
    }, 3000)
    setDeleteTimer(t)
  }

  const undoDelete = async (): Promise<void> => {
    if (!pendingDelete) return
    if (deleteTimer) clearTimeout(deleteTimer)
    const taskToRestore = pendingDelete
    useTaskStore.getState().restoreTask()
    setDeleteTimer(null)
    await window.api.restoreTask(taskToRestore)
  }

  if (visible.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-secondary text-sm">{t('no_tasks_message')}</p>
      </div>
    )
  }

  return (
    <div className="relative flex-1 overflow-y-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <div className="px-2 py-2">
          <SortableContext items={pending.map((t: Task) => t.id)} strategy={verticalListSortingStrategy}>
            {pending.map((t: Task) => {
              const subtasks = visible.filter((st: Task) => st.parent_id === t.id)
              return (
                <div key={t.id}>
                  <TaskItem task={t} onDeleteRequest={requestDelete} />
                  {subtasks.length > 0 && (
                    <div className="ml-8 border-l border-text-primary/10">
                      {subtasks.map((st: Task) => (
                        <TaskItem key={st.id} task={st} onDeleteRequest={requestDelete} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </SortableContext>
          
          {done.length > 0 && (
            <>
              <div className="px-4 pt-4 pb-1">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">
                  {t('completed_tasks')} ({done.length})
                </span>
              </div>
              <SortableContext items={done.map((t: Task) => t.id)} strategy={verticalListSortingStrategy}>
                {done.map((t: Task) => {
                  const subtasks = visible.filter((st: Task) => st.parent_id === t.id)
                  return (
                    <div key={t.id}>
                      <TaskItem task={t} onDeleteRequest={requestDelete} />
                      {subtasks.length > 0 && (
                        <div className="ml-8 border-l border-text-primary/10">
                          {subtasks.map((st: Task) => (
                            <TaskItem key={st.id} task={st} onDeleteRequest={requestDelete} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </SortableContext>
            </>
          )}
        </div>
      </DndContext>

      {pendingDelete && (
        <Snackbar
          message={`"${pendingDelete.title}" ${t('task_deleted_message')}`}
          actionLabel={t('undo')}
          onAction={undoDelete}
        />
      )}
    </div>
  )
}
