import { useEffect, useState } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useUiStore } from '../store/uiStore'
import { Task } from '@shared/types'

export default function WidgetView(): JSX.Element {
  const { tasks, setTasks, addTask, updateTaskItem } = useTaskStore()
  const { t, showContextMenu } = useUiStore()
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    window.api.getTasks().then(setTasks)
  }, [setTasks])

  const todayEnd = new Date().setHours(23, 59, 59, 999)

  const todayTasks = tasks.filter(
    (t) => !t.done && t.due_date && t.due_date <= todayEnd
  ).sort((a, b) => (a.due_date || 0) - (b.due_date || 0))

  const handleAddNew = async (): Promise<void> => {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    const task = await window.api.createTask({
      title: trimmed,
      done: false,
      priority: 1,
      due_date: todayEnd,
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
      className="h-screen w-screen bg-base/80 backdrop-blur-xl border border-border-color rounded-2xl overflow-hidden flex flex-col shadow-2xl relative"
      style={{ boxShadow: '0 0 40px -10px var(--accent-glow)' } as any}
    >
      {/* Premium Border Inner Highlight */}
      <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Header / Drag Area */}
      <div
        style={{ WebkitAppRegion: 'drag' } as any}
        className="h-12 flex items-center justify-between px-4 bg-text-primary/5 border-b border-border-color flex-shrink-0"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-accent rounded-lg flex items-center justify-center text-[10px] font-bold text-white">
            D
          </div>
          <span className="text-xs font-bold text-text-primary tracking-wider">{t('today').toUpperCase()}</span>
        </div>

        <div style={{ WebkitAppRegion: 'no-drag' } as any} className="flex items-center gap-1">
          <button
            onClick={closeWidget}
            className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-text-secondary hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {todayTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <span className="text-2xl mb-2">✨</span>
            <p className="text-[10px] font-medium text-text-primary uppercase tracking-widest">{t('all_caught_up')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-start gap-3 p-2 rounded-card bg-white/[0.02] hover:bg-white/5 transition-colors"
              >
                <button
                  onClick={() => toggleTask(task)}
                  className={`mt-0.5 w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center
                    transition-all duration-fast
                    ${task.done ? 'bg-accent border-accent' : 'border-border-color hover:border-accent'}`}
                >
                  {task.done && <span className="text-white text-[8px]">✓</span>}
                </button>

                <span className={`text-xs leading-tight break-words
                  ${task.done ? 'line-through text-text-secondary' : 'text-text-primary'}`}
                >
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Task Input Area */}
      <div className="px-4 py-2 bg-text-primary/5 border-t border-border-color">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddNew()}
          placeholder={`${t('add_task')}...`}
          className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-secondary/40 outline-none py-1"
        />
      </div>

      {/* Footer */}
      <div className="p-2 bg-text-primary/[0.01] flex justify-center">
        <span className="text-[8px] text-text-secondary uppercase tracking-[0.2em] opacity-40">
          {t('widget_footer')}
        </span>
      </div>
    </div>
  )
}
