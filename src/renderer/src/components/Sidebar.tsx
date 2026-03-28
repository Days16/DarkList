import { useState, useEffect } from 'react'
import { useListStore } from '../store/listStore'
import { useTaskStore } from '../store/taskStore'
import { useAuthStore } from '../store/authStore'
import NewListModal from './NewListModal'
import ConfirmModal from './ConfirmModal'

interface Props {
  onSettings: () => void
}

export default function Sidebar({ onSettings }: Props): JSX.Element {
  const { lists, activeListId, setActiveListId, removeList } = useListStore()
  const tasks = useTaskStore((s) => s.tasks)
  const setUnlocked = useAuthStore((s) => s.setUnlocked)
  const [showNew, setShowNew] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    window.api.getVersion().then(setVersion).catch(() => {})
  }, [])

  const pendingCount = (listId: string | null): number =>
    tasks.filter((t) => !t.done && (listId === null ? true : t.list_id === listId)).length

  const handleDeleteList = async (): Promise<void> => {
    if (!deleteTarget) return
    await window.api.deleteList(deleteTarget)
    removeList(deleteTarget)
    setDeleteTarget(null)
  }

  return (
    <>
      <aside className="w-[200px] flex-shrink-0 bg-surface flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-5 pb-3">
          <span className="text-text-primary font-semibold text-base tracking-tight">DarkList</span>
        </div>

        {/* All tasks */}
        <nav className="flex-1 overflow-y-auto px-2">
          <button
            onClick={() => setActiveListId(null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-card text-sm
              transition-colors duration-fast
              ${activeListId === null ? 'bg-elevated text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-elevated/50'}`}
          >
            <span>Todas</span>
            {pendingCount(null) > 0 && (
              <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">
                {pendingCount(null)}
              </span>
            )}
          </button>

          {/* Lists */}
          <div className="mt-3 space-y-0.5">
            {lists.map((list) => (
              <div key={list.id} className="group flex items-center">
                <button
                  onClick={() => setActiveListId(list.id)}
                  className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-card text-sm
                    transition-colors duration-fast truncate
                    ${activeListId === list.id ? 'bg-elevated text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-elevated/50'}`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: list.color }}
                  />
                  <span className="truncate">{list.name}</span>
                  {pendingCount(list.id) > 0 && (
                    <span className="ml-auto text-xs text-text-secondary">{pendingCount(list.id)}</span>
                  )}
                </button>
                <button
                  onClick={() => setDeleteTarget(list.id)}
                  className="opacity-0 group-hover:opacity-100 pr-2 text-text-secondary hover:text-red-400
                    transition-all text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* New list */}
          <button
            onClick={() => setShowNew(true)}
            className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary
              hover:text-text-primary transition-colors duration-fast"
          >
            <span className="text-base leading-none">+</span>
            <span>Nueva lista</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="px-2 pb-4 flex flex-col gap-0.5">
          <button
            onClick={onSettings}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary
              hover:text-text-primary transition-colors duration-fast rounded-card hover:bg-elevated/50"
          >
            <span>⚙</span>
            <span>Ajustes</span>
          </button>
          <button
            onClick={() => setUnlocked(false)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary
              hover:text-text-primary transition-colors duration-fast rounded-card hover:bg-elevated/50"
          >
            <span>🔒</span>
            <span>Bloquear</span>
          </button>
          
          <div className="mt-2 text-center text-[10px] text-text-secondary/30 font-medium tooltip" title="Versión de DarkList">
            v{version}
          </div>
        </div>
      </aside>

      {showNew && <NewListModal onClose={() => setShowNew(false)} />}
      {deleteTarget && (
        <ConfirmModal
          message="¿Eliminar esta lista y todas sus tareas?"
          onConfirm={handleDeleteList}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
