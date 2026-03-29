import { useState, useEffect } from 'react'
import { useListStore } from '../store/listStore'
import { useUiStore } from '../store/uiStore'

const COLORS = [
  '#7c6af7', // violet
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // coral
  '#f472b6', // pink
  '#22d3ee', // cyan
  '#6b7280'  // gray
]

interface Props {
  onClose: () => void
}

export default function NewListModal({ onClose }: Props): JSX.Element {
  const addList = useListStore((s) => s.addList)
  const { t } = useUiStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const submit = async (): Promise<void> => {
    const trimmed = name.trim()
    if (!trimmed) return
    const list = await window.api.createList({ name: trimmed, color })
    addList(list)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-card p-6 w-80 flex flex-col gap-5">
        <h2 className="text-text-primary font-semibold">{t('new_list')}</h2>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={t('rename_list_prompt').replace(':', '')}
          className="bg-elevated text-text-primary rounded-input px-3 py-2 text-sm outline-none
            border border-transparent focus:border-accent transition-colors"
        />

        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-all duration-fast
                ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm bg-accent text-white rounded-input
              disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {t('new_list')}
          </button>
        </div>
      </div>
    </div>
  )
}
