import { useEffect, useState } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useUiStore } from '../store/uiStore'
import { Task } from '@shared/types'

const PRIORITY_COLORS: Record<number, string> = {
  1: '#6b7280',
  2: '#f59e0b',
  3: '#ef4444'
}

export default function WidgetView(): JSX.Element {
  const { tasks, setTasks, addTask, updateTaskItem } = useTaskStore()
  const { t, showContextMenu, language } = useUiStore()
  const [newTitle, setNewTitle] = useState('')

  // Load tasks on mount
  useEffect(() => {
    window.api.getTasks().then(setTasks)
  }, [setTasks])

  // Listen for task updates from main window (real-time sync)
  useEffect(() => {
    const unsubCreated = window.api.onTaskCreated((task: Task) => {
      addTask(task)
    })
    const unsubUpdated = window.api.onTaskUpdated((task: Task) => {
      updateTaskItem(task.id, task)
    })
    const unsubDeleted = window.api.onTaskDeleted((id: string) => {
      useTaskStore.getState().removeTask(id)
    })
    return () => {
      unsubCreated()
      unsubUpdated()
      unsubDeleted()
    }
  }, [])

  // Show all pending tasks (sorted like the main app)
  const pendingTasks = tasks
    .filter((t) => !t.done && !t.parent_id)
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
      return b.created_at - a.created_at
    })

  const handleAddNew = async (): Promise<void> => {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    const task = await window.api.createTask({
      title: trimmed,
      done: false,
      priority: 1,
      due_date: null,
      list_id: null,
      parent_id: null,
      notes: '',
      reminder_at: null,
      recurrence: null,
      sort_order: 0,
      notified: 0,
      completed_at: null
    })
    addTask(task)
    setNewTitle('')
  }

  const toggleTask = async (task: Task): Promise<void> => {
    const updated = await window.api.updateTask(task.id, { done: !task.done })
    updateTaskItem(task.id, updated)
  }

  const handleContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault()
    showContextMenu(e.clientX, e.clientY, 'widget', {})
  }

  const closeWidget = (): void => {
    window.api.toggleWidget()
  }

  return (
    <div
      onContextMenu={handleContextMenu}
      className="h-screen w-screen bg-base rounded-2xl overflow-hidden flex flex-col shadow-2xl"
    >
      {/* Header / Drag Area */}
      <div
        style={{ WebkitAppRegion: 'drag' } as any}
        className="h-10 flex items-center justify-between px-3 border-b border-border-color flex-shrink-0"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-accent rounded-lg flex items-center justify-center text-[10px] font-bold text-white">
            D
          </div>
          <span className="text-xs font-medium text-text-primary">{t('home')}</span>
          <span className="text-[10px] text-text-secondary">{pendingTasks.length}</span>
        </div>

        <div style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            onClick={closeWidget}
            className="w-6 h-6 rounded-card hover:bg-elevated/50 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors duration-fast"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Task List — same style as main app TaskItem */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {pendingTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <span className="text-2xl mb-2">✨</span>
            <p className="text-[10px] font-medium text-text-primary uppercase tracking-widest">
              {t('all_caught_up')}
            </p>
          </div>
        ) : (
          pendingTasks.map((task) => {
            const isOverdue = task.due_date && !task.done && task.due_date < Date.now()
            const dueDateStr = task.due_date
              ? new Date(task.due_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })
              : null

            return (
              <div
                key={task.id}
                onContextMenu={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  showContextMenu(e.clientX, e.clientY, 'task', task)
                }}
                className="group flex items-start gap-3 px-3 py-2.5 rounded-card transition-colors duration-fast hover:bg-elevated/50 relative"
              >
                {/* Priority bar */}
                <div
                  className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r-full opacity-0 group-hover:opacity-70 transition-opacity duration-fast"
                  style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                />

                {/* Checkbox — identical to TaskItem */}
                <button
                  onClick={() => toggleTask(task)}
                  className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center
                    transition-all duration-200 active:scale-90
                    ${task.done
                      ? 'bg-accent border-accent'
                      : 'border-text-secondary/50 hover:border-accent hover:bg-accent/10'
                    }`}
                >
                  {task.done && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4.5L3.5 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Content — identical to TaskItem */}
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm block truncate ${
                      task.done ? 'line-through text-text-secondary' : 'text-text-primary'
                    }`}
                  >
                    {task.title}
                  </span>

                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                    />
                    {dueDateStr && (
                      <span className={`text-[10px] ${isOverdue ? 'text-red-400' : 'text-text-secondary'}`}>
                        {isOverdue ? '⚠ ' : ''}{dueDateStr}
                      </span>
                    )}
                    {task.recurrence && (
                      <span className="text-[10px] text-accent/70">↻ {task.recurrence}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* New Task Input — same style as TaskInput in main app */}
      <div className="px-3 py-2.5 border-t border-border-color">
        <div className="flex items-center gap-2">
          <span className="text-accent text-sm">+</span>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNew()}
            placeholder={`${t('add_task')}...`}
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-secondary/40 outline-none"
          />
        </div>
      </div>
    </div>
  )
}
