interface Props {
  message: string
  actionLabel: string
  onAction: () => void
}

export default function Snackbar({ message, actionLabel, onAction }: Props): JSX.Element {
  return (
    <div
      className="fixed bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4
        bg-elevated border border-[#2a2a2c] rounded-card px-4 py-3 text-sm shadow-xl z-40
        animate-[fadeInUp_0.2s_ease]"
    >
      <span className="text-text-secondary">{message}</span>
      <button
        onClick={onAction}
        className="text-accent font-medium hover:opacity-80 transition-opacity"
      >
        {actionLabel}
      </button>
    </div>
  )
}
