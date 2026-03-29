import { useEffect, useState } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useListStore } from '../store/listStore'
import { useUiStore } from '../store/uiStore'
import Sidebar from '../components/Sidebar'
import FilterBar from '../components/FilterBar'
import TaskList from '../components/TaskList'
import TaskInput from '../components/TaskInput'
import Settings from './Settings'
import StatsView from '../components/StatsView'
import CompletedView from '../components/CompletedView'

export default function Home(): JSX.Element {
  const setTasks = useTaskStore((s) => s.setTasks)
  const setLists = useListStore((s) => s.setLists)
  const { t } = useUiStore()
  const activeListId = useListStore((s) => s.activeListId)
  const lists = useListStore((s) => s.lists)
  const [view, setView] = useState<'tasks' | 'settings' | 'stats' | 'completed'>('tasks')

  // Load all data on mount
  useEffect(() => {
    window.api.getLists().then(setLists)
    window.api.getTasks().then(setTasks)
  }, [setLists, setTasks])

  const activeList = lists.find((l) => l.id === activeListId)
  const heading = activeList ? activeList.name : t('all')

  const navigate = (v: 'tasks' | 'settings' | 'stats' | 'completed'): void => setView(v)

  const commonSidebar = (
    <Sidebar 
      onSettings={() => navigate('settings')} 
      onHome={() => navigate('tasks')}
      onStats={() => navigate('stats')}
      onCompleted={() => navigate('completed')}
      activeView={view}
    />
  )

  if (view === 'settings') {
    return (
      <div className="flex h-full bg-base">
        {commonSidebar}
        <Settings onBack={() => navigate('tasks')} />
      </div>
    )
  }

  if (view === 'stats') {
    return (
      <div className="flex h-full bg-base">
        {commonSidebar}
        <div className="flex-1 flex flex-col h-full bg-base overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border-color">
            <button onClick={() => navigate('tasks')} className="text-text-secondary hover:text-text-primary transition-colors text-sm">
              ← {t('back')}
            </button>
            <h1 className="text-text-primary font-semibold">{t('productivity_stats')}</h1>
          </div>
          <StatsView />
        </div>
      </div>
    )
  }

  if (view === 'completed') {
    return (
      <div className="flex h-full bg-base">
        {commonSidebar}
        <div className="flex-1 flex flex-col h-full bg-base overflow-y-auto">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border-color">
            <h1 className="text-text-primary font-semibold">{t('completed_tasks')}</h1>
          </div>
          <CompletedView />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-base">
      {commonSidebar}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* Title */}
        <div className="px-6 pt-5 pb-3">
          <h2 className="text-text-primary font-semibold text-lg">{heading}</h2>
        </div>
        <FilterBar />
        <TaskList />
        <TaskInput />
      </main>
    </div>
  )
}
