import { useState } from 'react'
import { useUiStore } from '../store/uiStore'

const ACCENT_COLORS = [
  { label: 'Violeta', value: '#7c6af7' },
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Verde', value: '#22c55e' },
  { label: 'Ámbar', value: '#f59e0b' },
  { label: 'Coral', value: '#ef4444' },
  { label: 'Gris', value: '#6b7280' }
]

const AUTO_LOCK_OPTIONS: { label: string; value: 0 | 5 | 15 | 30 }[] = [
  { label: 'Nunca', value: 0 },
  { label: '5 minutos', value: 5 },
  { label: '15 minutos', value: 15 },
  { label: '30 minutos', value: 30 }
]

interface Props {
  onBack: () => void
}

export default function Settings({ onBack }: Props): JSX.Element {
  const { accentColor, autoLockMinutes, saveSettings } = useUiStore()

  // PIN change
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinMsg, setPinMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const changePin = async (): Promise<void> => {
    setPinMsg(null)
    if (newPin.length < 4) { setPinMsg({ type: 'err', text: 'El PIN debe tener al menos 4 dígitos' }); return }
    if (newPin !== confirmPin) { setPinMsg({ type: 'err', text: 'Los PINs no coinciden' }); return }
    const res = await window.api.changePin(oldPin, newPin)
    if (res.success) {
      setPinMsg({ type: 'ok', text: 'PIN actualizado' })
      setOldPin(''); setNewPin(''); setConfirmPin('')
    } else {
      setPinMsg({ type: 'err', text: res.error ?? 'Error al cambiar PIN' })
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-base overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1e1e20]">
        <button
          onClick={onBack}
          className="text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          ← Volver
        </button>
        <h1 className="text-text-primary font-semibold">Ajustes</h1>
      </div>

      <div className="flex flex-col gap-8 px-6 py-6 max-w-md">
        {/* Accent color */}
        <section>
          <h2 className="text-text-primary text-sm font-medium mb-3">Color de acento</h2>
          <div className="flex gap-3 flex-wrap">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => saveSettings({ accentColor: c.value })}
                title={c.label}
                className={`w-8 h-8 rounded-full transition-all duration-fast
                  ${accentColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-base scale-110' : ''}`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </section>

        {/* Auto-lock */}
        <section>
          <h2 className="text-text-primary text-sm font-medium mb-3">Auto-bloqueo</h2>
          <div className="flex gap-2 flex-wrap">
            {AUTO_LOCK_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => saveSettings({ autoLockMinutes: o.value })}
                className={`px-3 py-1.5 rounded-input text-sm transition-colors duration-fast
                  ${autoLockMinutes === o.value
                    ? 'bg-accent text-white'
                    : 'bg-elevated text-text-secondary hover:text-text-primary'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </section>

        {/* Change PIN */}
        <section>
          <h2 className="text-text-primary text-sm font-medium mb-3">Cambiar PIN</h2>
          <div className="flex flex-col gap-2">
            <input
              type="password"
              inputMode="numeric"
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="PIN actual"
              className="bg-elevated text-text-primary rounded-input px-3 py-2 text-sm outline-none
                border border-transparent focus:border-accent transition-colors"
            />
            <input
              type="password"
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Nuevo PIN (4–6 dígitos)"
              className="bg-elevated text-text-primary rounded-input px-3 py-2 text-sm outline-none
                border border-transparent focus:border-accent transition-colors"
            />
            <input
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Confirmar nuevo PIN"
              onKeyDown={(e) => e.key === 'Enter' && changePin()}
              className="bg-elevated text-text-primary rounded-input px-3 py-2 text-sm outline-none
                border border-transparent focus:border-accent transition-colors"
            />
            {pinMsg && (
              <p className={`text-xs ${pinMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                {pinMsg.text}
              </p>
            )}
            <button
              onClick={changePin}
              disabled={!oldPin || !newPin || !confirmPin}
              className="mt-1 px-4 py-2 bg-accent text-white rounded-input text-sm
                disabled:opacity-40 hover:opacity-90 transition-opacity self-start"
            >
              Actualizar PIN
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
