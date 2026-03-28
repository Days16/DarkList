import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'

export function useAutoLock(): void {
  const isUnlocked = useAuthStore((s) => s.isUnlocked)
  const setUnlocked = useAuthStore((s) => s.setUnlocked)
  const autoLockMinutes = useUiStore((s) => s.autoLockMinutes)

  useEffect(() => {
    if (!isUnlocked || autoLockMinutes === 0) return

    const ms = autoLockMinutes * 60_000
    let timer: ReturnType<typeof setTimeout>

    const reset = (): void => {
      clearTimeout(timer)
      timer = setTimeout(() => setUnlocked(false), ms)
    }

    reset()
    window.addEventListener('mousemove', reset)
    window.addEventListener('keydown', reset)
    window.addEventListener('mousedown', reset)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', reset)
      window.removeEventListener('keydown', reset)
      window.removeEventListener('mousedown', reset)
    }
  }, [isUnlocked, autoLockMinutes, setUnlocked])
}
