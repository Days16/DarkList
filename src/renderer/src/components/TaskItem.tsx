import { useState, useRef, useEffect } from 'react'
import { Task } from '@shared/types'
import { useTaskStore } from '../store/taskStore'
import { useListStore } from '../store/listStore'
import { useUiStore } from '../store/uiStore'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
  const { updateTaskItem, addTask, tasks } = useTaskStore()
  const { showContextMenu, t, searchQuery } = useUiStore()
  const lists = useListStore((s) => s.lists)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes || '')
  const [showNotes, setShowNotes] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : (task.done ? 0.5 : 1)
  }

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
    updateTaskItem(task.id, updated)
  }

  const handleContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault()
    showContextMenu(e.clientX, e.clientY, 'task', task)
  }

  const saveTitle = async (): Promise<void> => {
    setEditing(false)
    const trimmed = title.trim()
    if (!trimmed || trimmed === task.title) { setTitle(task.title); return }
    const updated = await window.api.updateTask(task.id, { title: trimmed })
    updateTaskItem(task.id, updated)
  }

  const setPriority = async (p: 1 | 2 | 3): Promise<void> => {
    const updated = await window.api.updateTask(task.id, { priority: p })
    updateTaskItem(task.id, updated)
    setShowMenu(false)
  }

  const addSubtask = async (): Promise<void> => {
    const subtask = await window.api.createTask({
      title: t('new_subtask'),
      list_id: task.list_id,
      parent_id: task.id,
      priority: 2,
      done: false,
      due_date: task.due_date,
      reminder_at: null,
      notes: '',
      recurrence: null,
      sort_order: 0,
      notified: 0,
      completed_at: null
    })
    addTask(subtask)
    setShowMenu(false)
  }

  const toggleRecurrence = async (r: 'daily' | 'weekly' | 'monthly' | null): Promise<void> => {
    await window.api.updateTask(task.id, { recurrence: r })
    updateTaskItem(task.id, { recurrence: r })
    setShowMenu(false)
  }

  const saveNotes = async (): Promise<void> => {
    if (notes === task.notes) return
    const updated = await window.api.updateTask(task.id, { notes })
    updateTaskItem(task.id, updated)
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

  // MEJORA-3: subtask counter
  const subtasks = tasks.filter((t) => t.parent_id === task.id)
  const doneSubtasks = subtasks.filter((t) => t.done).length

  // MEJORA-4: highlight search query in title
  const renderTitle = (): JSX.Element => {
    if (!searchQuery || task.done) return <>{task.title}</>
    const idx = task.title.toLowerCase().indexOf(searchQuery.toLowerCase())
    if (idx === -1) return <>{task.title}</>
    return (
      <>
        {task.title.slice(0, idx)}
        <mark className="bg-accent/30 text-accent rounded not-italic">{task.title.slice(idx, idx + searchQuery.length)}</mark>
        {task.title.slice(idx + searchQuery.length)}
      </>
    )
  }

  const dueDateStr = task.due_date
    ? new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null

  const isOverdue =
    task.due_date && !task.done && task.due_date < Date.now()

  return (
    <div
      ref={setNodeRef}
      style={style}
      onContextMenu={handleContextMenu}
      className={`group flex flex-col gap-1 px-3 py-2.5 rounded-card transition-colors duration-fast hover:bg-elevated/50 relative`}
    >
      {/* Priority Accent Bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r-full opacity-0 group-hover:opacity-70 transition-opacity duration-fast"
        style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
      />

      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="mt-1 text-text-secondary/20 hover:text-text-secondary cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg width="12" height="18" viewBox="0 0 12 18">
            <circle cx="2" cy="3" r="1.5" fill="currentColor" />
            <circle cx="2" cy="9" r="1.5" fill="currentColor" />
            <circle cx="2" cy="15" r="1.5" fill="currentColor" />
            <circle cx="10" cy="3" r="1.5" fill="currentColor" />
            <circle cx="10" cy="9" r="1.5" fill="currentColor" />
            <circle cx="10" cy="15" r="1.5" fill="currentColor" />
          </svg>
        </div>

        {/* Checkbox */}
        <button
          onClick={toggle}
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
              {renderTitle()}
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
            {/* Recurrence badge */}
            {task.recurrence && (
              <span className="text-[10px] text-accent/70 flex items-center gap-1">
                <span>↻</span>
                <span className="capitalize">{task.recurrence}</span>
              </span>
            )}
            {/* Subtask counter badge */}
            {subtasks.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border
                ${doneSubtasks === subtasks.length
                  ? 'border-green-500/40 text-green-400'
                  : 'border-border-color text-text-secondary'}`}>
                ✓ {doneSubtasks}/{subtasks.length}
              </span>
            )}
            {/* Notes indicator */}
            {task.notes && (
              <button onClick={() => setShowNotes(!showNotes)} className="text-[10px] text-text-secondary hover:text-text-primary">
                📝 Notas
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-fast flex-shrink-0">
          {/* Options menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="w-7 h-7 rounded-lg hover:bg-text-primary/10 flex items-center justify-center text-text-secondary hover:text-text-primary transition-all duration-300"
              title="Más opciones"
            >
              <svg width="14" height="4" viewBox="0 0 14 4" fill="currentColor">
                <circle cx="2" cy="2" r="1.5" />
                <circle cx="7" cy="2" r="1.5" />
                <circle cx="12" cy="2" r="1.5" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-elevated border border-border-color rounded-card
              shadow-2xl z-50 w-52 py-1 text-sm animate-in fade-in slide-in-from-top-1 backdrop-blur-md">
                {/* Priority */}
                <div className="px-3 py-1.5 text-[10px] text-text-secondary uppercase tracking-wider">
                  {t('priority')}
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
                    <div className="border-t border-border-color mx-3 my-1" />
                    <div className="px-3 py-1.5 text-[10px] text-text-secondary uppercase tracking-wider">
                      {t('home')}
                    </div>
                    <button
                      onClick={() => setList('')}
                      className={`w-full text-left px-3 py-1.5 hover:bg-surface transition-colors
                      ${!task.list_id ? 'text-text-primary' : 'text-text-secondary'}`}
                    >
                      {t('no_list_selected')}
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
                <div className="border-t border-border-color mx-3 my-1" />
                <div className="px-3 py-1.5 text-[10px] text-text-secondary uppercase tracking-wider">
                  {t('due_date')}
                </div>
                <div className="px-3 pb-2">
                  <input
                    type="date"
                    defaultValue={task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-surface text-text-primary text-xs rounded-input px-2 py-1
                    outline-none border border-border-color focus:border-accent"
                  />
                </div>

                {/* Reminder */}
                <div className="px-3 pb-1 text-[10px] text-text-secondary uppercase tracking-wider">
                  {t('reminder')}
                </div>
                <div className="px-3 pb-2">
                  <input
                    type="datetime-local"
                    defaultValue={
                      task.reminder_at
                        ? (() => {
                            const d = new Date(task.reminder_at)
                            return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                          })()
                        : ''
                    }
                    onChange={(e) => setReminder(e.target.value)}
                    className="w-full bg-surface text-text-primary text-xs rounded-input px-2 py-1
                    outline-none border border-border-color focus:border-accent"
                  />
                </div>

                {/* Recurrence */}
                <div className="border-t border-border-color mx-3 my-1" />
                <div className="px-3 py-1.5 text-[10px] text-text-secondary uppercase tracking-wider">
                  {t('recurrence')}
                </div>
                <div className="flex flex-wrap gap-1 px-3 pb-2">
                  {(['daily', 'weekly', 'monthly', null] as const).map((r) => (
                    <button
                      key={r || 'none'}
                      onClick={() => toggleRecurrence(r)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors
                      ${task.recurrence === r ? 'bg-accent/20 border-accent text-accent' : 'border-border-color text-text-secondary hover:border-accent/50'}`}
                    >
                      {r ? r.charAt(0).toUpperCase() + r.slice(1) : 'Ninguna'}
                    </button>
                  ))}
                </div>

                {/* Subtasks */}
                {!task.parent_id && (
                  <>
                    <div className="border-t border-border-color mx-3 my-1" />
                    <button
                      onClick={addSubtask}
                      className="w-full text-left px-3 py-2 hover:bg-surface text-text-primary transition-colors flex items-center gap-2"
                    >
                      <span className="text-accent">+</span>
                      {t('add_subtask')}
                    </button>
                  </>
                )}

                {/* Notes Toggle */}
                <div className="border-t border-border-color mx-3 my-1" />
                <button
                  onClick={() => { setShowNotes(!showNotes); setShowMenu(false) }}
                  className="w-full text-left px-3 py-2 hover:bg-surface text-text-primary transition-colors flex items-center gap-2"
                >
                  <span>📝</span>
                  {showNotes ? t('hide_notes') : t('view_notes')}
                </button>
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

      {showNotes && (
        <div className="mt-2 ml-10">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder={t('add_notes_placeholder')}
            className="w-full bg-surface/50 text-text-secondary text-xs rounded-input p-2 outline-none border border-transparent focus:border-white/5 min-h-[60px] resize-none"
          />
        </div>
      )}
    </div>
  )
}
