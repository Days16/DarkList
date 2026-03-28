import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useUiStore } from './store/uiStore'
import { useAutoLock } from './hooks/useAutoLock'
import LockScreen from './pages/LockScreen'
import SetupPin from './pages/SetupPin'
import Home from './pages/Home'

export default function App(): JSX.Element {
  const { isUnlocked, hasPin, setHasPin, setUnlocked } = useAuthStore()
  const loadSettings = useUiStore((s) => s.loadSettings)

  useAutoLock()

  useEffect(() => {
    window.api.hasPin().then(setHasPin)
    loadSettings()
  }, [setHasPin, loadSettings])

  // Listen for tray "lock" event
  useEffect(() => {
    const cleanup = window.api.onLock(() => setUnlocked(false))
    return cleanup
  }, [setUnlocked])

  if (!hasPin) return <SetupPin />
  if (!isUnlocked) return <LockScreen />
  return <Home />
}
