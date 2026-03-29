import { useState, useRef, useEffect } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useListStore } from '../store/listStore'
import { useUiStore } from '../store/uiStore'

export default function TaskInput(): JSX.Element {
  const addTask = useTaskStore((s) => s.addTask)
  const { lists, activeListId } = useListStore()
  const { t } = useUiStore()
  const [title, setTitle] = useState('')
  const [listId, setListId] = useState<string | null>(activeListId)
  const focusTrigger = useUiStore((s) => s.focusTaskInputTrigger)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (focusTrigger > 0) inputRef.current?.focus()
  }, [focusTrigger])

  useEffect(() => {
    setListId(activeListId)
  }, [activeListId])

  const submit = async (): Promise<void> => {
    const trimmed = title.trim()
    if (!trimmed) return
    const task = await window.api.createTask({
      title: trimmed,
      list_id: listId,
      parent_id: null,
      done: false,
      priority: 2,
      due_date: null,
      reminder_at: null,
      notes: '',
      recurrence: null,
      sort_order: 0,
      notified: 0,
      completed_at: null
    })
    setTitle('')
  }

  return (
    <div className="px-4 py-3 border-t border-[#1e1e20] flex items-center gap-2">
      <span className="text-text-secondary text-lg leading-none select-none">+</span>
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={t('new_task')}
        className="flex-1 bg-transparent text-text-primary placeholder:text-text-secondary/50 outline-none text-sm"
      />
      {lists.length > 0 && (
        <select
          value={listId ?? ''}
          onChange={(e) => setListId(e.target.value || null)}
          className="bg-elevated text-text-secondary text-xs rounded-input px-2 py-1 outline-none
            border border-transparent focus:border-accent max-w-[120px] truncate"
        >
          <option value="">{t('no_list')}</option>
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
