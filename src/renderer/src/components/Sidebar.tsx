import { useState, useEffect } from 'react'
import { useListStore } from '../store/listStore'
import { useTaskStore } from '../store/taskStore'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import NewListModal from './NewListModal'
import ConfirmModal from './ConfirmModal'

interface Props {
  onSettings: () => void
  onHome: () => void
  onStats: () => void
  onCompleted: () => void
  activeView: 'tasks' | 'settings' | 'stats' | 'completed'
}

export default function Sidebar({ onSettings, onHome, onStats, onCompleted, activeView }: Props): JSX.Element {
  const { lists, activeListId, setActiveListId, removeList } = useListStore()
  const { showContextMenu, t } = useUiStore()
  const tasks = useTaskStore((s) => s.tasks)
  const setUnlocked = useAuthStore((s) => s.setUnlocked)
  const [showNew, setShowNew] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [version, setVersion] = useState<string>('')
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true')

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString())
  }, [isCollapsed])

  useEffect(() => {
    window.api.getVersion().then(setVersion).catch(() => {})
  }, [])

  const pendingCount = (listId: string | null): number =>
    tasks.filter((t) => !t.done && (listId === null ? true : t.list_id === listId)).length

  const totalCount = (listId: string): number =>
    tasks.filter((t) => t.list_id === listId).length

  const handleDeleteList = async (): Promise<void> => {
    if (!deleteTarget) return
    await window.api.deleteList(deleteTarget)
    removeList(deleteTarget)
    setDeleteTarget(null)
  }

  const handleContextMenu = (e: React.MouseEvent, list: any): void => {
    e.preventDefault()
    showContextMenu(e.clientX, e.clientY, 'list', list)
  }

  return (
    <>
      <aside className={`flex-shrink-0 bg-surface flex flex-col h-full transition-all duration-300 ${isCollapsed ? 'w-[64px]' : 'w-[200px]'}`}>
        {/* Header */}
        <div className={`pt-5 pb-3 flex items-center ${isCollapsed ? 'justify-center' : 'px-4 justify-between'}`}>
          {!isCollapsed && (
            <button 
              onClick={() => {
                setActiveListId(null)
                if (onHome) onHome()
              }}
              className="text-text-primary font-semibold text-base tracking-tight truncate hover:text-accent transition-colors text-left"
              title={t('go_to_all')}
            >
              DarkList
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-elevated/50 transition-colors flex-shrink-0"
            title={isCollapsed ? t('expand') : t('collapse')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isCollapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
            </svg>
          </button>
        </div>

        {/* All tasks */}
        <nav className="flex-1 overflow-y-auto px-2 overflow-x-hidden">
          <button
            onClick={() => {
              setActiveListId(null)
              if (onHome) onHome()
            }}
            title={isCollapsed ? t('all_tasks') : undefined}
            className={`w-full flex items-center p-2 rounded-card text-sm transition-colors duration-fast
              ${isCollapsed ? 'justify-center' : 'justify-between px-3'}
              ${activeListId === null ? 'bg-elevated text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-elevated/50'}`}
          >
            {isCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            ) : (
              <>
                <div className="flex items-center gap-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <span className="truncate">{t('all_tasks')}</span>
                </div>
                {pendingCount(null) > 0 && (
                  <span className="flex-shrink-0 text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full ml-2">
                    {pendingCount(null)}
                  </span>
                )}
              </>
            )}
          </button>

          {/* Lists */}
          <div className="mt-3 space-y-0.5">
            {lists.map((list) => (
              <div key={list.id} className="group relative flex items-center" title={isCollapsed ? list.name : undefined}>
                <button
                  onClick={() => {
                    setActiveListId(list.id)
                    onHome()
                  }}
                  onContextMenu={(e) => handleContextMenu(e, list)}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-card text-sm
                    transition-colors duration-fast truncate
                    ${isCollapsed ? 'justify-center' : 'px-3'}
                    ${activeListId === list.id && activeView === 'tasks' ? 'bg-elevated text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-elevated/50'}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: list.color }}
                  />
                  {!isCollapsed && <span className="truncate flex-1 text-left">{list.name}</span>}
                  {!isCollapsed && pendingCount(list.id) > 0 && (
                    <span className="text-xs text-text-secondary flex-shrink-0 ml-2">{pendingCount(list.id)}</span>
                  )}
                </button>
                {!isCollapsed && (
                  <button
                    onClick={() => setDeleteTarget(list.id)}
                    className="opacity-0 group-hover:opacity-100 absolute right-1 text-text-secondary hover:text-red-400
                      transition-all text-xs bg-surface/80 group-hover:bg-surface p-1 rounded backdrop-blur-sm"
                    title={t('delete_list')}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* New list */}
          <button
            onClick={() => setShowNew(true)}
            title={isCollapsed ? t('new_list') : undefined}
            className={`mt-1 w-full flex items-center gap-2.5 p-2 text-sm text-text-secondary
              hover:text-text-primary transition-colors duration-fast rounded-card hover:bg-elevated/50 ${isCollapsed ? 'justify-center' : 'px-3'}`}
          >
            <span className="w-5 flex justify-center text-lg">+</span>
            {!isCollapsed && <span className="truncate">{t('new_list')}</span>}
          </button>

          <div className="border-t border-border-color mx-3 my-3" />

          <button
            onClick={onHome}
            className={`w-full flex items-center gap-2.5 p-2 rounded-card text-sm
              transition-colors duration-fast
              ${isCollapsed ? 'justify-center' : 'px-3'}
              ${activeView === 'tasks' && activeListId === null ? 'bg-elevated text-text-primary' : 'text-text-secondary hover:bg-elevated/50 hover:text-text-primary'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            {!isCollapsed && <span className="truncate">{t('home')}</span>}
          </button>

          {/* Stats */}
          <button
            onClick={onStats}
            className={`w-full flex items-center gap-2.5 p-2 rounded-card text-sm
              transition-colors duration-fast
              ${isCollapsed ? 'justify-center' : 'px-3'}
              ${activeView === 'stats' ? 'bg-accent text-white font-medium shadow-lg shadow-accent/20' : 'text-text-secondary hover:bg-elevated/50 hover:text-text-primary'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            {!isCollapsed && <span className="truncate">{t('stats')}</span>}
          </button>

          {/* Completed Tasks History */}
          <button
            onClick={onCompleted}
            className={`w-full flex items-center gap-2.5 p-2 rounded-card text-sm
              transition-colors duration-fast
              ${isCollapsed ? 'justify-center' : 'px-3'}
              ${activeView === 'completed' ? 'bg-accent text-white font-medium shadow-lg shadow-accent/20' : 'text-text-secondary hover:bg-elevated/50 hover:text-text-primary'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {!isCollapsed && <span className="truncate">{t('history')}</span>}
          </button>

          {/* Floating Widget Toggle */}
          <button
            onClick={() => window.api.toggleWidget()}
            className={`w-full flex items-center gap-2.5 p-2 rounded-card text-sm
              transition-colors duration-fast text-text-secondary hover:bg-elevated/50 hover:text-text-primary
              ${isCollapsed ? 'justify-center' : 'px-3'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            {!isCollapsed && <span className="truncate">Widget {t('today')}</span>}
          </button>
        </nav>

        {/* Footer */}
        <div className="px-2 pb-4 flex flex-col gap-0.5">
          <button
            onClick={onSettings}
            title={isCollapsed ? t('settings') : undefined}
            className={`w-full flex items-center gap-2 p-2 text-sm text-text-secondary
              hover:text-text-primary transition-colors duration-fast rounded-card hover:bg-elevated/50 ${isCollapsed ? 'justify-center' : 'px-3'}`}
          >
            <span className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </span>
            {!isCollapsed && <span className="truncate">{t('settings')}</span>}
          </button>
          <button
            onClick={() => setUnlocked(false)}
            title={isCollapsed ? t('lock') : undefined}
            className={`w-full flex items-center gap-2 p-2 text-sm text-text-secondary
              hover:text-text-primary transition-colors duration-fast rounded-card hover:bg-elevated/50 ${isCollapsed ? 'justify-center' : 'px-3'}`}
          >
            <span className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
            {!isCollapsed && <span className="truncate">{t('lock')}</span>}
          </button>
          
          {!isCollapsed && (
            <div className="mt-2 text-center text-[10px] text-text-secondary/30 font-medium tooltip" title="Versión de DarkList">
              v{version}
            </div>
          )}
        </div>
      </aside>

      {showNew && <NewListModal onClose={() => setShowNew(false)} />}
      {deleteTarget && (
        <ConfirmModal
          message={t('delete_list_confirm')}
          onConfirm={handleDeleteList}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
