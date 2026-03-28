interface Props {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ message, onConfirm, onCancel }: Props): JSX.Element {
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
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-input hover:opacity-90 transition-opacity"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
