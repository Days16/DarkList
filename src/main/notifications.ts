import { Notification } from 'electron'
import Store from 'electron-store'
import { getDb } from './db'
import { Task } from '../shared/types'

function getLang(): string {
  const store = new Store({ name: 'darklist-config' })
  return (store.get('settings') as any)?.language || 'es'
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()

export function initNotifications(): void {
  const db = getDb()
  const now = Date.now()
  
  // 1. Check for missed reminders while app was closed
  const missed = db
    .prepare('SELECT * FROM tasks WHERE reminder_at <= ? AND done = 0 AND notified = 0')
    .all(now) as Record<string, unknown>[]
  
  if (missed.length > 0) {
    const lang = getLang()
    const body = missed.length === 1
      ? (lang === 'en' ? `Missed reminder: ${missed[0].title}` : `Recordatorio perdido: ${missed[0].title}`)
      : (lang === 'en' ? `You have ${missed.length} pending reminders to review.` : `Tienes ${missed.length} recordatorios pendientes de revisar.`)
    const title = lang === 'en' ? 'DarkList — Missed reminders' : 'DarkList — Recordatorios perdidos'

    if (Notification.isSupported()) {
      new Notification({ title, body }).show()
    }
    
    // Mark missed as notified
    const ids = missed.map(m => m.id)
    db.prepare(`UPDATE tasks SET notified = 1 WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids)
  }

  // 2. Schedule future reminders
  const future = db
    .prepare('SELECT * FROM tasks WHERE reminder_at > ? AND done = 0')
    .all(now) as Record<string, unknown>[]

  for (const row of future) scheduleReminder(rowToTask(row))
}

export function scheduleReminder(task: Task): void {
  if (timers.has(task.id)) {
    clearTimeout(timers.get(task.id)!)
    timers.delete(task.id)
  }
  if (!task.reminder_at || task.reminder_at <= Date.now() || task.done) return

  const delay = task.reminder_at - Date.now()
  const timer = setTimeout(() => {
    if (Notification.isSupported()) {
      new Notification({ title: 'DarkList', body: task.title }).show()
      // Mark as notified in DB
      getDb().prepare('UPDATE tasks SET notified = 1 WHERE id = ?').run(task.id)
    }
    timers.delete(task.id)
  }, delay)
  timers.set(task.id, timer)
}

export function cancelReminder(taskId: string): void {
  if (timers.has(taskId)) {
    clearTimeout(timers.get(taskId)!)
    timers.delete(taskId)
  }
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    list_id: (row.list_id as string | null) ?? null,
    parent_id: (row.parent_id as string | null) ?? null,
    title: row.title as string,
    notes: (row.notes as string | null) ?? null,
    done: row.done === 1,
    priority: row.priority as 1 | 2 | 3,
    due_date: (row.due_date as number | null) ?? null,
    reminder_at: (row.reminder_at as number | null) ?? null,
    recurrence: (row.recurrence as 'daily' | 'weekly' | 'monthly' | null) ?? null,
    sort_order: (row.sort_order as number) ?? 0,
    notified: (row.notified as number) ?? 0,
    completed_at: (row.completed_at as number | null) ?? null,
    created_at: row.created_at as number,
    updated_at: row.updated_at as number
  }
}
