import { useEffect, useRef } from 'react'
import { useUiStore } from '../store/uiStore'
import { useTaskStore } from '../store/taskStore'
import { useListStore } from '../store/listStore'
import { Task } from '@shared/types'

export default function ContextMenu(): JSX.Element | null {
  const { contextMenu, hideContextMenu, t } = useUiStore()
  const { updateTaskItem, addTask, removeTask, setPendingDelete, setDeleteTimer } = useTaskStore()
  const { lists, removeList } = useListStore()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideContextMenu()
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [hideContextMenu])

  if (!contextMenu) return null

  const { x, y, type, data } = contextMenu

  // Ensure menu stays within window bounds
  const top = Math.min(y, window.innerHeight - 300)
  const left = Math.min(x, window.innerWidth - 200)

  // --- Task Actions ---
  const handleTaskToggle = async (): Promise<void> => {
    const task = data as Task
    const updated = await window.api.updateTask(task.id, { done: !task.done })
    updateTaskItem(task.id, updated)
    hideContextMenu()
  }

  const handleTaskDelete = async (): Promise<void> => {
    const task = data as Task
    removeTask(task.id)
    setPendingDelete(task)
    const t = setTimeout(async () => {
      await window.api.deleteTask(task.id)
      setPendingDelete(null)
    }, 3000)
    setDeleteTimer(t)
    hideContextMenu()
  }

  const handleTaskDuplicate = async (): Promise<void> => {
    const task = data as Task
    const { id, created_at, updated_at, ...rest } = task
    const newItem = await window.api.createTask({
      ...rest,
      title: `${rest.title} (${t('duplicate').toLowerCase()})`,
      done: false,
      completed_at: null
    })
    addTask(newItem)
    hideContextMenu()
  }

  const handleToggleToday = async (): Promise<void> => {
    const task = data as Task
    const now = new Date().setHours(0, 0, 0, 0)
    const isToday = task.due_date && new Date(task.due_date).setHours(0, 0, 0, 0) === now
    const updated = await window.api.updateTask(task.id, { due_date: isToday ? null : now })
    updateTaskItem(task.id, updated)
    hideContextMenu()
  }

  const handleTaskCalendar = async (): Promise<void> => {
    const task = data as Task
    await window.api.exportToCalendar(task)
    hideContextMenu()
  }

  const handleSetPriority = async (p: 1 | 2 | 3): Promise<void> => {
    const task = data as Task
    const updated = await window.api.updateTask(task.id, { priority: p })
    updateTaskItem(task.id, updated)
    hideContextMenu()
  }

  const handleMoveToList = async (listId: string | null): Promise<void> => {
    const task = data as Task
    const updated = await window.api.updateTask(task.id, { list_id: listId })
    updateTaskItem(task.id, updated)
    hideContextMenu()
  }

  const handleListRename = async (): Promise<void> => {
    const { id, name } = data
    const newName = window.prompt(t('rename_list_prompt'), name)
    if (newName && newName !== name) {
      const updated = await window.api.updateList(id, { name: newName.trim() })
      useListStore.getState().setLists(lists.map(l => l.id === id ? updated : l))
    }
    hideContextMenu()
  }

  const handleListDelete = async (): Promise<void> => {
    const { id, name } = data
    if (window.confirm(`${t('delete_list')} "${name}"?`)) {
      await window.api.deleteList(id)
      removeList(id)
    }
    hideContextMenu()
  }

  return (
    <div
      ref={menuRef}
      style={{ top, left }}
      className="fixed z-[100] w-52 bg-elevated/90 backdrop-blur-xl border border-[#2a2a2c] rounded-card shadow-2xl py-1.5 animate-in fade-in zoom-in duration-fast"
    >
      {type === 'task' && (
        <>
          <button onClick={handleTaskToggle} className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-sm text-text-primary transition-colors flex items-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {data.done ? <polyline points="23 4 23 10 17 10" /> : <polyline points="20 6 9 17 4 12" />}
              {data.done && <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />}
            </svg>
            <span>{data.done ? t('reopen') : t('complete')}</span>
          </button>

          <button onClick={handleToggleToday} className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-sm text-text-primary transition-colors flex items-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>{(data.due_date && new Date(data.due_date).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0)) ? t('remove_from_today') : t('add_to_today')}</span>
          </button>

          <button onClick={handleTaskDuplicate} className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-sm text-text-primary transition-colors flex items-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>{t('duplicate')}</span>
          </button>

          <button onClick={handleTaskCalendar} className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-sm text-text-primary transition-colors flex items-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>{t('add_to_calendar')}</span>
          </button>

          <div className="h-[1px] bg-[#2a2a2c] mx-2 my-1" />

          <div className="px-3 py-1 text-[10px] text-text-secondary uppercase font-bold tracking-widest">{t('priority')}</div>
          <div className="flex px-2 gap-1 pb-1">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => handleSetPriority(p as 1 | 2 | 3)}
                className={`flex-1 py-1 rounded text-[10px] border transition-all ${data.priority === p
                    ? 'bg-accent/20 border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:bg-white/5'
                  }`}
              >
                {p === 1 ? t('low') : p === 2 ? t('medium') : t('high')}
              </button>
            ))}
          </div>

          <div className="h-[1px] bg-[#2a2a2c] mx-2 my-1" />

          <div className="px-3 py-1 text-[10px] text-text-secondary uppercase font-bold tracking-widest">{t('move_to')}</div>
          <div className="max-h-32 overflow-y-auto px-1">
            <button
              onClick={() => handleMoveToList(null)}
              className="w-full text-left px-2 py-1 hover:bg-white/5 text-xs text-text-secondary rounded transition-colors"
            >
              {t('no_list')}
            </button>
            {lists.map((l) => (
              <button
                key={l.id}
                onClick={() => handleMoveToList(l.id)}
                className="w-full text-left px-2 py-1 hover:bg-white/5 text-xs text-text-secondary rounded transition-colors flex items-center gap-2 truncate"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                <span className="truncate">{l.name}</span>
              </button>
            ))}
          </div>

          <div className="h-[1px] bg-[#2a2a2c] mx-2 my-1" />

          <button onClick={handleTaskDelete} className="w-full text-left px-3 py-1.5 hover:bg-red-500/10 text-sm text-red-400 transition-colors flex items-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            <span>{t('delete')}</span>
          </button>
        </>
      )}

      {type === 'widget' && (
        <>
          <button
            onClick={async () => {
              const val = window.prompt(t('new_task'))
              if (val) {
                const title = val.trim()
                if (!title) return
                const now = new Date()
                const todayEnd = new Date(now).setHours(23, 59, 59, 999)
                const task = await window.api.createTask({
                  title,
                  done: false,
                  priority: 1,
                  due_date: todayEnd,
                  list_id: null,
                  parent_id: null,
                  notes: '',
                  reminder_at: null,
                  recurrence: null,
                  completed_at: null,
                  sort_order: 0,
                  notified: 0
                })
                addTask(task)
                hideContextMenu()
              }
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-sm text-text-primary transition-colors flex items-center gap-2.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>{t('add_task')}</span>
          </button>

          <button
            onClick={() => {
              window.location.reload()
              hideContextMenu()
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-sm text-text-primary transition-colors flex items-center gap-2.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            <span>{t('refresh')}</span>
          </button>

          <div className="h-[1px] bg-[#2a2a2c] mx-2 my-1" />

          <button
            onClick={() => {
              window.api.toggleWidget()
              hideContextMenu()
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-red-500/10 text-sm text-red-400 transition-colors flex items-center gap-2.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18"></path>
              <path d="M6 6l12 12"></path>
            </svg>
            <span>{t('close_widget')}</span>
          </button>
        </>
      )}
    </div>
  )
}
