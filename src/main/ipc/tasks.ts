import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { getDb } from '../db'
import { scheduleReminder, cancelReminder } from '../notifications'
import { Task } from '../../shared/types'

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

export function setupTaskHandlers(): void {
  ipcMain.handle('tasks:getAll', (_e, listId?: string) => {
    const db = getDb()
    const rows = listId
      ? db.prepare('SELECT * FROM tasks WHERE list_id = ? ORDER BY created_at DESC').all(listId)
      : db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all()
    return (rows as Record<string, unknown>[]).map(rowToTask)
  })

  ipcMain.handle('tasks:create', (_e, data: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const db = getDb()
    const id = randomUUID()
    const now = Date.now()
    db.prepare(
      `INSERT INTO tasks (id, list_id, title, done, priority, due_date, reminder_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.list_id, data.title, data.done ? 1 : 0, data.priority, data.due_date, data.reminder_at, now, now)
    const task = rowToTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown>)
    if (task.reminder_at) scheduleReminder(task)
    return task
  })

  ipcMain.handle('tasks:update', (_e, id: string, data: Partial<Task>) => {
    const db = getDb()
    const fields: string[] = []
    const values: unknown[] = []

    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title) }
    if (data.done !== undefined) { fields.push('done = ?'); values.push(data.done ? 1 : 0) }
    if (data.priority !== undefined) { fields.push('priority = ?'); values.push(data.priority) }
    if (data.due_date !== undefined) { fields.push('due_date = ?'); values.push(data.due_date) }
    if (data.reminder_at !== undefined) { fields.push('reminder_at = ?'); values.push(data.reminder_at) }
    if (data.list_id !== undefined) { fields.push('list_id = ?'); values.push(data.list_id) }

    if (fields.length === 0) return null
    fields.push('updated_at = ?')
    values.push(Date.now(), id)
    db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...(values as Parameters<typeof db.prepare>[0][]))

    const task = rowToTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown>)
    if (data.reminder_at !== undefined || data.done !== undefined) {
      task.done ? cancelReminder(task.id) : scheduleReminder(task)
    }
    return task
  })

  ipcMain.handle('tasks:delete', (_e, id: string) => {
    cancelReminder(id)
    getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id)
    return { success: true }
  })
}
