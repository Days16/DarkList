import { Notification } from 'electron'
import { getDb } from './db'
import { Task } from '../shared/types'

const timers = new Map<string, ReturnType<typeof setTimeout>>()

export function initNotifications(): void {
  const rows = getDb()
    .prepare('SELECT * FROM tasks WHERE reminder_at > ? AND done = 0')
    .all(Date.now()) as Record<string, unknown>[]
  for (const row of rows) scheduleReminder(rowToTask(row))
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
    title: row.title as string,
    done: row.done === 1,
    priority: row.priority as 1 | 2 | 3,
    due_date: (row.due_date as number | null) ?? null,
    reminder_at: (row.reminder_at as number | null) ?? null,
    created_at: row.created_at as number,
    updated_at: row.updated_at as number
  }
}
