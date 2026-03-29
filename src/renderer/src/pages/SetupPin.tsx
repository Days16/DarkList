import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import PinPad from '../components/PinPad'

export default function SetupPin(): JSX.Element {
  const setHasPin = useAuthStore((s) => s.setHasPin)
  const setUnlocked = useAuthStore((s) => s.setUnlocked)
  const { t } = useUiStore()
  const [step, setStep] = useState<'create' | 'confirm'>('create')
  const [firstPin, setFirstPin] = useState('')
  const [error, setError] = useState('')

  const handleCreate = (pin: string): void => {
    setFirstPin(pin)
    setStep('confirm')
    setError('')
  }

  const handleConfirm = async (pin: string): Promise<void> => {
    if (pin !== firstPin) {
      setError(t('pin_mismatch'))
      setStep('create')
      setFirstPin('')
      return
    }
    await window.api.setPin(pin)
    setHasPin(true)
    setUnlocked(true)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-base gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text-primary mb-1">DarkList</h1>
        <p className="text-text-secondary text-sm">
          {step === 'create' ? t('create_pin') : t('confirm_pin_label')}
        </p>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>
      <PinPad onSubmit={step === 'create' ? handleCreate : handleConfirm} />
    </div>
  )
}
