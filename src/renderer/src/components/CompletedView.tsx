import { useState } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useListStore } from '../store/listStore'
import { useUiStore } from '../store/uiStore'
import { Task } from '@shared/types'
import ConfirmModal from './ConfirmModal'

export default function CompletedView(): JSX.Element {
  const { tasks, updateTaskItem, removeTask } = useTaskStore()
  const { lists } = useListStore()
  const { t, language } = useUiStore()
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const completed = tasks
    .filter((t) => t.done)
    .sort((a, b) => (b.completed_at || 0) - (a.completed_at || 0))

  const handleRestore = async (task: Task): Promise<void> => {
    const updated = await window.api.updateTask(task.id, { done: false })
    updateTaskItem(task.id, updated)
  }

  const handleDeletePermanent = async (): Promise<void> => {
    if (!confirmDelete) return
    await window.api.deleteTask(confirmDelete.id)
    removeTask(confirmDelete.id)
    setConfirmDelete(null)
  }

  const handleClearAll = async (): Promise<void> => {
    for (const task of completed) {
      await window.api.deleteTask(task.id)
      removeTask(task.id)
    }
    setConfirmClear(false)
  }

  if (completed.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-secondary p-8">
        <span className="text-4xl mb-4 opacity-20">🕒</span>
        <p className="text-sm font-medium">{t('history_empty')}</p>
        <p className="text-xs opacity-50 mt-1 text-center max-w-xs">{t('history_desc')}</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden bg-base">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#1e1e20] bg-base/50 backdrop-blur-sm sticky top-0 z-10">
          <span className="text-xs text-text-secondary font-medium tracking-wider uppercase">
            {completed.length} {t('completed_tasks')}
          </span>
          <button
            onClick={() => setConfirmClear(true)}
            className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium border border-red-400/20 hover:border-red-400/40 px-3 py-1.5 rounded-card bg-red-400/5"
          >
            {t('clear_history')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="divide-y divide-[#1e1e20]">
            {completed.map((task) => {
              const list = lists.find((l) => l.id === task.list_id)
              const completedDate = task.completed_at
                ? new Date(task.completed_at).toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'N/A'

              return (
                <div
                  key={task.id}
                  className="group flex items-center justify-between px-6 py-4 hover:bg-elevated/30 transition-colors duration-fast"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-sm text-text-primary line-through opacity-60 truncate">
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2.5 mt-1.5 overflow-hidden">
                      <span className="text-[10px] text-text-secondary bg-white/5 px-2 py-0.5 rounded-full flex-shrink-0">
                        {t('finished_at')} {completedDate}
                      </span>
                      {list && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full truncate flex-shrink-0"
                          style={{ backgroundColor: `${list.color}22`, color: list.color }}
                        >
                          {list.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => handleRestore(task)}
                      title={t('restore')}
                      className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-card transition-all"
                    >
                      <span className="text-lg">↩</span>
                    </button>
                    <button
                      onClick={() => setConfirmDelete(task)}
                      title={t('delete_permanent')}
                      className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-card transition-all"
                    >
                      <span className="text-lg">✕</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          message={`${t('delete_confirm')} "${confirmDelete.title}"?`}
          onConfirm={handleDeletePermanent}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {confirmClear && (
        <ConfirmModal
          message={t('clear_history_confirm')}
          onConfirm={handleClearAll}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </>
  )
}
