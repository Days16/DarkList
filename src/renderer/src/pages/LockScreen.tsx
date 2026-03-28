import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import PinPad from '../components/PinPad'

export default function LockScreen(): JSX.Element {
  const { incrementFailed, resetFailed, setUnlocked, failedAttempts, cooldownUntil } =
    useAuthStore()
  const [shake, setShake] = useState(false)
  const [cooldownLeft, setCooldownLeft] = useState(0)

  useEffect(() => {
    if (!cooldownUntil) return
    const tick = (): void => {
      const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
      setCooldownLeft(left)
      if (left === 0) resetFailed()
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [cooldownUntil, resetFailed])

  const handleSubmit = async (pin: string): Promise<void> => {
    if (cooldownUntil && Date.now() < cooldownUntil) return
    const ok = await window.api.checkPin(pin)
    if (ok) {
      resetFailed()
      setUnlocked(true)
    } else {
      incrementFailed()
      setShake(true)
      setTimeout(() => setShake(false), 400)
    }
  }

  const locked = !!cooldownUntil && Date.now() < cooldownUntil

  return (
    <div className="flex flex-col items-center justify-center h-full bg-base gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text-primary mb-1">DarkList</h1>
        <p className="text-text-secondary text-sm">Introduce tu PIN</p>
        {failedAttempts > 0 && !locked && (
          <p className="text-red-400 text-xs mt-2">
            PIN incorrecto — {5 - failedAttempts} intentos restantes
          </p>
        )}
        {locked && (
          <p className="text-amber-400 text-xs mt-2">
            Bloqueado — espera {cooldownLeft}s
          </p>
        )}
      </div>
      <PinPad onSubmit={handleSubmit} shake={shake} />
    </div>
  )
}
