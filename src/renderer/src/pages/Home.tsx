import { useEffect, useState } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useListStore } from '../store/listStore'
import Sidebar from '../components/Sidebar'
import FilterBar from '../components/FilterBar'
import TaskList from '../components/TaskList'
import TaskInput from '../components/TaskInput'
import Settings from './Settings'

export default function Home(): JSX.Element {
  const setTasks = useTaskStore((s) => s.setTasks)
  const setLists = useListStore((s) => s.setLists)
  const activeListId = useListStore((s) => s.activeListId)
  const lists = useListStore((s) => s.lists)
  const [showSettings, setShowSettings] = useState(false)

  // Load all data on mount
  useEffect(() => {
    window.api.getLists().then(setLists)
    window.api.getTasks().then(setTasks)
  }, [setLists, setTasks])

  const activeList = lists.find((l) => l.id === activeListId)
  const heading = activeList ? activeList.name : 'Todas las tareas'

  if (showSettings) {
    return (
      <div className="flex h-full">
        <Sidebar onSettings={() => setShowSettings(true)} />
        <Settings onBack={() => setShowSettings(false)} />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <Sidebar onSettings={() => setShowSettings(true)} />
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
