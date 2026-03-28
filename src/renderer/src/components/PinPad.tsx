import { useState, useEffect } from 'react'

interface Props {
  onSubmit: (pin: string) => void
  shake?: boolean
}

const BUTTONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

export default function PinPad({ onSubmit, shake = false }: Props): JSX.Element {
  const [pin, setPin] = useState('')

  useEffect(() => {
    if (shake) setPin('')
  }, [shake])

  const press = (val: string): void => {
    if (val === '⌫') {
      setPin((p) => p.slice(0, -1))
      return
    }
    if (val === '') return
    const next = pin + val
    if (next.length > 6) return
    setPin(next)
    if (next.length >= 4) {
      // auto-submit at 4-6 digits when user presses submit (here we auto at 4 for UX)
      // Actually wait for explicit confirm via Enter
    }
  }

  const submit = (): void => {
    if (pin.length < 4) return
    onSubmit(pin)
    setPin('')
  }

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key >= '0' && e.key <= '9') press(e.key)
      else if (e.key === 'Backspace') press('⌫')
      else if (e.key === 'Enter') submit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  return (
    <div className={`flex flex-col items-center gap-6 ${shake ? 'animate-[shake_0.3s_ease]' : ''}`}>
      {/* Dots */}
      <div className="flex gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-150 ${
              i < pin.length ? 'bg-accent' : 'bg-elevated border border-[#2a2a2c]'
            }`}
          />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3">
        {BUTTONS.map((btn, i) => (
          <button
            key={i}
            onClick={() => (btn === '' ? null : btn === '⌫' ? press('⌫') : press(btn))}
            disabled={btn === ''}
            className={`w-16 h-16 rounded-card text-text-primary text-xl font-medium
              transition-all duration-fast
              ${btn === '' ? 'invisible' : 'bg-surface hover:bg-elevated active:scale-95'}`}
          >
            {btn}
          </button>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={pin.length < 4}
        className="w-full max-w-[13rem] py-3 rounded-card bg-accent text-white font-medium
          disabled:opacity-30 transition-opacity duration-fast hover:opacity-90"
      >
        Continuar
      </button>
    </div>
  )
}
