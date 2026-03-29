import { useMemo } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useUiStore } from '../store/uiStore'

const DAY_LABELS: Record<string, string[]> = {
  es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  de: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  it: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
}

export default function StatsView(): JSX.Element {
  const tasks = useTaskStore((s) => s.tasks)
  const { t, language } = useUiStore()

  const stats = useMemo(() => {
    const todayStart = new Date().setHours(0, 0, 0, 0)
    const DAY_MS = 24 * 60 * 60 * 1000

    const completed = tasks.filter((t) => t.done && t.completed_at)
    const completedToday = completed.filter((t) => t.completed_at! >= todayStart).length
    const completedThisWeek = completed.filter((t) => t.completed_at! >= todayStart - 6 * DAY_MS).length
    const totalPending = tasks.filter((t) => !t.done).length

    // Racha (streak) calculation
    const daysWithCompletion = new Set(
      completed.map((t) => new Date(t.completed_at!).setHours(0, 0, 0, 0))
    )

    let streak = 0
    let currentCheck = todayStart

    if (daysWithCompletion.has(todayStart)) {
      streak = 1
      while (daysWithCompletion.has(currentCheck - DAY_MS)) {
        streak++
        currentCheck -= DAY_MS
      }
    } else if (daysWithCompletion.has(todayStart - DAY_MS)) {
      streak = 1
      currentCheck = todayStart - DAY_MS
      while (daysWithCompletion.has(currentCheck - DAY_MS)) {
        streak++
        currentCheck -= DAY_MS
      }
    }

    // MEJORA-5: 7-day bar chart data
    const weekBars = Array.from({ length: 7 }, (_, i) => {
      const dayStart = todayStart - (6 - i) * DAY_MS
      const dayEnd = dayStart + DAY_MS
      const count = completed.filter(
        (t) => t.completed_at! >= dayStart && t.completed_at! < dayEnd
      ).length
      const date = new Date(dayStart)
      return { count, label: (DAY_LABELS[language] ?? DAY_LABELS.es)[date.getDay()], isToday: i === 6 }
    })

    return { completedToday, completedThisWeek, totalPending, streak, weekBars }
  }, [tasks, language])

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

      {/* MEJORA-5: Weekly activity chart */}
      <div className="bg-elevated p-5 rounded-card border border-[#1e1e20]">
        <div className="text-text-secondary text-[10px] uppercase font-bold tracking-widest mb-4">{t('activity_chart')}</div>
        <div className="flex items-end gap-1.5 h-20">
          {stats.weekBars.map((bar, i) => {
            const max = Math.max(...stats.weekBars.map((b) => b.count), 1)
            const pct = (bar.count / max) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-text-secondary">{bar.count > 0 ? bar.count : ''}</span>
                <div className="w-full rounded-t-sm transition-all duration-500 relative"
                  style={{
                    height: `${Math.max(pct, bar.count > 0 ? 8 : 2)}%`,
                    backgroundColor: bar.isToday ? 'var(--accent)' : bar.count > 0 ? 'var(--accent-glow)' : '#2a2a2e'
                  }}
                />
                <span className={`text-[9px] ${bar.isToday ? 'text-accent font-semibold' : 'text-text-secondary'}`}>
                  {bar.label}
                </span>
              </div>
            )
          })}
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
