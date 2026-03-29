import { useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import { useUiStore } from './store/uiStore'
import { useTaskStore } from './store/taskStore'
import { useAutoLock } from './hooks/useAutoLock'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import LockScreen from './pages/LockScreen'
import SetupPin from './pages/SetupPin'
import Home from './pages/Home'
import ContextMenu from './components/ContextMenu'
import WidgetView from './components/WidgetView'
import { translations } from './i18n/translations'

export default function App(): JSX.Element {
  const { isUnlocked, hasPin, setHasPin, setUnlocked } = useAuthStore()
  const loadSettings = useUiStore((s) => s.loadSettings)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  const isWidget = window.location.search.includes('widget=true')

  useAutoLock()
  useKeyboardShortcuts()

  // Guardia de Entorno (Bloquear navegadores convencionales)
  if (typeof window.api === 'undefined') {
    const lang = 'es' // Default for guard
    const tGuard = (key: string) => (translations as any)[lang][key] || key
    
    return (
      <div className="h-full bg-base flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 text-4xl shadow-lg ring-1 ring-red-500/20">
          ⚠️
        </div>
        <div className="max-w-md">
          <h1 className="text-text-primary font-bold text-2xl tracking-tight mb-3">{tGuard('incompatible_env')}</h1>
          <p className="text-text-secondary text-base leading-relaxed">
            {tGuard('incompatible_desc')}
          </p>
        </div>
        <div className="mt-4 px-4 py-2 bg-text-primary/5 rounded text-text-primary/40 text-xs font-mono">
          {tGuard('api_undefined')}
        </div>
      </div>
    )
  }

  useEffect(() => {
    const init = async (): Promise<void> => {
      await Promise.all([
        window.api.hasPin().then(setHasPin),
        loadSettings()
      ])
      // Small delay to avoid flicker and show off the logo
      setTimeout(() => setIsInitialLoading(false), 800)
    }
    init()
  }, [setHasPin, loadSettings])

  // Listen for tray "lock" event and settings updates
  useEffect(() => {
    const unsubLock = window.api.onLock(() => setUnlocked(false))
    const unsubSettings = window.api.onSettingsUpdated(() => {
      loadSettings()
    })
    
    // Task Sync
    const { addTask, updateTaskItem, removeTask } = useTaskStore.getState()
    const unsubCreated = window.api.onTaskCreated((t) => addTask(t))
    const unsubUpdated = window.api.onTaskUpdated((t) => updateTaskItem(t.id, t))
    const unsubDeleted = window.api.onTaskDeleted((id) => removeTask(id))

    return () => {
      unsubLock()
      unsubSettings()
      unsubCreated()
      unsubUpdated()
      unsubDeleted()
    }
  }, [setUnlocked, loadSettings])

  if (isInitialLoading) {
    return (
      <div className="h-full bg-base flex flex-col items-center justify-center gap-6 animate-pulse">
        <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-accent/20">
          D
        </div>
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-text-primary font-semibold text-lg tracking-wider">DARKLIST</h1>
          <div className="w-32 h-1 bg-text-primary/5 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full animate-pulse w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!hasPin) return <SetupPin />
  if (!isUnlocked) return <LockScreen />

  return (
    <>
      {isWidget ? <WidgetView /> : <Home />}
      <ContextMenu />
    </>
  )
}
