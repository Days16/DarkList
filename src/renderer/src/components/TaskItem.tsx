import { useState, useRef, useEffect } from 'react'
import { Task } from '@shared/types'
import { useTaskStore } from '../store/taskStore'
import { useListStore } from '../store/listStore'

const PRIORITY_COLORS: Record<number, string> = {
  1: '#6b7280',
  2: '#f59e0b',
  3: '#ef4444'
}

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Baja',
  2: 'Media',
  3: 'Alta'
}

interface Props {
  task: Task
  onDeleteRequest: (task: Task) => void
}

export default function TaskItem({ task, onDeleteRequest }: Props): JSX.Element {
  const { updateTaskItem } = useTaskStore()
  const lists = useListStore((s) => s.lists)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [showMenu, setShowMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return
    const handler = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  const toggle = async (): Promise<void> => {
    const updated = await window.api.updateTask(task.id, { done: !task.done })
    updateTaskItem(task.id, { done: updated.done })
  }

  const saveTitle = async (): Promise<void> => {
    setEditing(false)
    const trimmed = title.trim()
    if (!trimmed || trimmed === task.title) { setTitle(task.title); return }
    await window.api.updateTask(task.id, { title: trimmed })
    updateTaskItem(task.id, { title: trimmed })
  }

  const setPriority = async (p: 1 | 2 | 3): Promise<void> => {
    await window.api.updateTask(task.id, { priority: p })
    updateTaskItem(task.id, { priority: p })
    setShowMenu(false)
  }

  const setDueDate = async (dateStr: string): Promise<void> => {
    const ts = dateStr ? new Date(dateStr).getTime() : null
    await window.api.updateTask(task.id, { due_date: ts })
    updateTaskItem(task.id, { due_date: ts })
  }

  const setReminder = async (dateStr: string): Promise<void> => {
    const ts = dateStr ? new Date(dateStr).getTime() : null
    await window.api.updateTask(task.id, { reminder_at: ts })
    updateTaskItem(task.id, { reminder_at: ts })
  }

  const setList = async (listId: string): Promise<void> => {
    const id = listId || null
    await window.api.updateTask(task.id, { list_id: id })
    updateTaskItem(task.id, { list_id: id })
    setShowMenu(false)
  }

  const list = lists.find((l) => l.id === task.list_id)

  const dueDateStr = task.due_date
    ? new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null

  const isOverdue =
    task.due_date && !task.done && task.due_date < Date.now()

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3 hover:bg-elevated/40 rounded-card
        transition-colors duration-fast ${task.done ? 'opacity-50' : ''}`}
    >
      {/* Checkbox */}
      <button
        onClick={toggle}
        className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center
          transition-all duration-fast
          ${task.done ? 'bg-accent border-accent' : 'border-[#3a3a3c] hover:border-accent'}`}
      >
        {task.done && <span className="text-white text-[10px] leading-none">✓</span>}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle()
              if (e.key === 'Escape') { setEditing(false); setTitle(task.title) }
            }}
            className="w-full bg-transparent text-text-primary text-sm outline-none"
          />
        ) : (
          <span
            onClick={() => !task.done && setEditing(true)}
            className={`text-sm block truncate
              ${task.done ? 'line-through text-text-secondary cursor-default' : 'text-text-primary cursor-text hover:text-accent/90'}`}
          >
            {task.title}
          </span>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {/* Priority dot */}
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
            title={PRIORITY_LABELS[task.priority]}
          />
          {/* List badge */}
          {list && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: list.color + '33', color: list.color }}
            >
              {list.name}
            </span>
          )}
          {/* Due date */}
          {dueDateStr && (
            <span className={`text-[10px] ${isOverdue ? 'text-red-400' : 'text-text-secondary'}`}>
              {isOverdue ? '⚠ ' : ''}{dueDateStr}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-fast flex-shrink-0">
        {/* Options menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="text-text-secondary hover:text-text-primary text-xs px-1"
          >
            •••
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 bg-elevated border border-[#2a2a2c] rounded-card
              shadow-xl z-20 w-52 py-1 text-sm">
              {/* Priority */}
              <div className="px-3 py-1.5 text-[10px] text-text-secondary uppercase tracking-wider">
                Prioridad
              </div>
              {([1, 2, 3] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface
                    transition-colors text-left ${task.priority === p ? 'text-text-primary' : 'text-text-secondary'}`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLORS[p] }}
                  />
                  {PRIORITY_LABELS[p]}
                </button>
              ))}

              {/* List */}
              {lists.length > 0 && (
                <>
                  <div className="border-t border-[#2a2a2c] mx-3 my-1" />
                  <div className="px-3 py-1.5 text-[10px] text-text-secondary uppercase tracking-wider">
                    Lista
                  </div>
                  <button
                    onClick={() => setList('')}
                    className={`w-full text-left px-3 py-1.5 hover:bg-surface transition-colors
                      ${!task.list_id ? 'text-text-primary' : 'text-text-secondary'}`}
                  >
                    Sin lista
                  </button>
                  {lists.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setList(l.id)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface
                        transition-colors ${task.list_id === l.id ? 'text-text-primary' : 'text-text-secondary'}`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                      {l.name}
                    </button>
                  ))}
                </>
              )}

              {/* Due date */}
              <div className="border-t border-[#2a2a2c] mx-3 my-1" />
              <div className="px-3 py-1.5 text-[10px] text-text-secondary uppercase tracking-wider">
                Fecha límite
              </div>
              <div className="px-3 pb-2">
                <input
                  type="date"
                  defaultValue={task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-surface text-text-primary text-xs rounded-input px-2 py-1
                    outline-none border border-[#2a2a2c] focus:border-accent"
                />
              </div>

              {/* Reminder */}
              <div className="px-3 pb-1 text-[10px] text-text-secondary uppercase tracking-wider">
                Recordatorio
              </div>
              <div className="px-3 pb-2">
                <input
                  type="datetime-local"
                  defaultValue={
                    task.reminder_at
                      ? new Date(task.reminder_at - new Date().getTimezoneOffset() * 60000)
                          .toISOString()
                          .slice(0, 16)
                      : ''
                  }
                  onChange={(e) => setReminder(e.target.value)}
                  className="w-full bg-surface text-text-primary text-xs rounded-input px-2 py-1
                    outline-none border border-[#2a2a2c] focus:border-accent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Edit */}
        {!task.done && (
          <button
            onClick={() => setEditing(true)}
            title="Editar"
            className="text-text-secondary hover:text-text-primary text-xs px-1 transition-colors"
          >
            ✎
          </button>
        )}

        {/* Delete */}
        <button
          onClick={() => onDeleteRequest(task)}
          title="Eliminar"
          className="text-text-secondary hover:text-red-400 text-xs px-1 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
