import { useEffect } from 'react'
import { useUiStore } from '../store/uiStore'

interface Props {
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export default function ConfirmModal({ message, onConfirm, onCancel, confirmLabel, cancelLabel, danger = true }: Props): JSX.Element {
  const { t } = useUiStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-surface rounded-card p-6 w-72 flex flex-col gap-5">
        <p className="text-text-primary text-sm">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            {cancelLabel ?? t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm text-white rounded-input hover:opacity-90 transition-opacity ${danger ? 'bg-red-500' : 'bg-accent'}`}
          >
            {confirmLabel ?? t('delete_action')}
          </button>
        </div>
      </div>
    </div>
  )
}
