import { useEffect } from 'react'
import { useUiStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'

export function useKeyboardShortcuts(): void {
  const { triggerFocusSearch, triggerFocusTaskInput, hideContextMenu } = useUiStore()
  const setUnlocked = useAuthStore((s) => s.setUnlocked)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey

      // Ctrl + N: Nueva tarea
      if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        triggerFocusTaskInput()
      }

      // Ctrl + F: Buscar
      if (isCmdOrCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        triggerFocusSearch()
      }

      // Ctrl + L: Bloquear
      if (isCmdOrCtrl && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        setUnlocked(false)
      }

      // Escape: Cerrar context menu
      if (e.key === 'Escape') {
        hideContextMenu()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [triggerFocusSearch, triggerFocusTaskInput, setUnlocked, hideContextMenu])
}
