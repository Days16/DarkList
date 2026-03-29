import { useMemo } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useUiStore } from '../store/uiStore'

export default function StatsView(): JSX.Element {
  const tasks = useTaskStore((s) => s.tasks)
  const { t } = useUiStore()

  const stats = useMemo(() => {
    const now = Date.now()
    const todayStart = new Date().setHours(0, 0, 0, 0)
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000

    const completed = tasks.filter((t) => t.done && t.completed_at)
    const completedToday = completed.filter((t) => t.completed_at! >= todayStart).length
    const completedThisWeek = completed.filter((t) => t.completed_at! >= weekStart).length
    const totalPending = tasks.filter((t) => !t.done).length

    // Racha (streak) calculation
    const daysWithCompletion = new Set(
      completed.map((t) => new Date(t.completed_at!).setHours(0, 0, 0, 0))
    )
    const sortedDays = Array.from(daysWithCompletion).sort((a, b) => b - a)
    
    let streak = 0
    let currentCheck = todayStart
    
    // Check if they completed today
    if (daysWithCompletion.has(todayStart)) {
      streak = 1
      while (daysWithCompletion.has(currentCheck - 24 * 60 * 60 * 1000)) {
        streak++
        currentCheck -= 24 * 60 * 60 * 1000
      }
    } else if (daysWithCompletion.has(todayStart - 24 * 60 * 60 * 1000)) {
      // If they didn't complete today, check if they did yesterday (to keep the streak alive until the day ends)
      streak = 1
      currentCheck = todayStart - 24 * 60 * 60 * 1000
      while (daysWithCompletion.has(currentCheck - 24 * 60 * 60 * 1000)) {
        streak++
        currentCheck -= 24 * 60 * 60 * 1000
      }
    }

    return { completedToday, completedThisWeek, totalPending, streak }
  }, [tasks])

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Streak Card */}
        <div className="bg-elevated p-6 rounded-card border border-[#1e1e20] flex flex-col items-center justify-center text-center gap-2">
          <span className="text-4xl">🔥</span>
          <div className="text-3xl font-bold text-text-primary">{stats.streak}</div>
          <div className="text-text-secondary text-sm font-medium uppercase tracking-wider">{t('streak_days')}</div>
        </div>

        {/* Today Card */}
        <div className="bg-elevated p-6 rounded-card border border-[#1e1e20] flex flex-col items-center justify-center text-center gap-2">
          <span className="text-4xl">✅</span>
          <div className="text-3xl font-bold text-text-primary">{stats.completedToday}</div>
          <div className="text-text-secondary text-sm font-medium uppercase tracking-wider">{t('completed_today')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Week Card */}
        <div className="bg-elevated p-6 rounded-card border border-[#1e1e20] flex flex-col gap-1">
          <div className="text-text-secondary text-[10px] uppercase font-bold tracking-widest">{t('last_7_days')}</div>
          <div className="text-2xl font-semibold text-text-primary">{stats.completedThisWeek} {t('tasks_unit')}</div>
          <p className="text-text-secondary text-xs mt-1">{t('encouragement_3')}</p>
        </div>

        {/* Pending Card */}
        <div className="bg-elevated p-6 rounded-card border border-[#1e1e20] flex flex-col gap-1">
          <div className="text-text-secondary text-[10px] uppercase font-bold tracking-widest">{t('total_pending')}</div>
          <div className="text-2xl font-semibold text-text-primary">{stats.totalPending} {t('tasks_unit')}</div>
          <p className="text-text-secondary text-xs mt-1">{t('encouragement_1')}</p>
        </div>
      </div>

      {/* Encouragement Message */}
      <div className="mt-4 p-4 bg-accent/10 border border-accent/20 rounded-card text-center">
        <p className="text-accent text-sm font-medium italic">
          "{stats.completedToday > 0 ? t('encouragement_1') : t('encouragement_2')}"
        </p>
      </div>
    </div>
  )
}
