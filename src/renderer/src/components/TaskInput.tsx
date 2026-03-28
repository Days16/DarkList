import { useState } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useListStore } from '../store/listStore'

export default function TaskInput(): JSX.Element {
  const addTask = useTaskStore((s) => s.addTask)
  const { lists, activeListId } = useListStore()
  const [title, setTitle] = useState('')
  const [listId, setListId] = useState<string | null>(activeListId)

  const submit = async (): Promise<void> => {
    const trimmed = title.trim()
    if (!trimmed) return
    const task = await window.api.createTask({
      title: trimmed,
      list_id: listId,
      done: false,
      priority: 2,
      due_date: null,
      reminder_at: null
    })
    addTask(task)
    setTitle('')
  }

  return (
    <div className="px-4 py-3 border-t border-[#1e1e20] flex items-center gap-2">
      <span className="text-text-secondary text-lg leading-none select-none">+</span>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Nueva tarea… (Enter)"
        className="flex-1 bg-transparent text-text-primary text-sm outline-none placeholder:text-text-secondary"
      />
      {lists.length > 0 && (
        <select
          value={listId ?? ''}
          onChange={(e) => setListId(e.target.value || null)}
          className="bg-elevated text-text-secondary text-xs rounded-input px-2 py-1 outline-none
            border border-transparent focus:border-accent max-w-[120px] truncate"
        >
          <option value="">Sin lista</option>
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
