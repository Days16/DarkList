import { ipcMain, BrowserWindow } from 'electron'
import { randomUUID } from 'crypto'
import { getDb } from '../db'
import { scheduleReminder, cancelReminder } from '../notifications'
import { Task } from '../../shared/types'

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
    sort_order: row.sort_order as number,
    notified: row.notified as number,
    completed_at: (row.completed_at as number | null) ?? null,
    created_at: row.created_at as number,
    updated_at: row.updated_at as number
  }
}

export function setupTaskHandlers(): void {
  ipcMain.handle('tasks:getAll', (_e, listId?: string) => {
    const db = getDb()
    const rows = listId
      ? db.prepare('SELECT * FROM tasks WHERE list_id = ? ORDER BY sort_order ASC, created_at DESC').all(listId)
      : db.prepare('SELECT * FROM tasks ORDER BY sort_order ASC, created_at DESC').all()
    return (rows as Record<string, unknown>[]).map(rowToTask)
  })

  ipcMain.handle('tasks:create', (_e, data: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const db = getDb()
    const id = randomUUID()
    const now = Date.now()
    
    // Get max sort_order
    const maxSort = db.prepare('SELECT MAX(sort_order) as maxSort FROM tasks').get() as { maxSort: number | null }
    const sortOrder = (maxSort?.maxSort ?? -1) + 1

    db.prepare(
      `INSERT INTO tasks (id, list_id, parent_id, title, notes, done, priority, due_date, reminder_at, recurrence, sort_order, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, 
      data.list_id, 
      data.parent_id ?? null,
      data.title, 
      data.notes ?? null,
      data.done ? 1 : 0, 
      data.priority, 
      data.due_date ?? null, 
      data.reminder_at ?? null, 
      data.recurrence ?? null,
      sortOrder,
      null,
      now, 
      now
    )
    const task = rowToTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown>)
    if (task.reminder_at) scheduleReminder(task)
    
    // Broadcast creation to all windows
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('task:created', task)
    })
    
    return task
  })

  ipcMain.handle('tasks:update', (_e, id: string, data: Partial<Task>) => {
    const db = getDb()
    
    // Get existing task for recurrence logic
    const existing = rowToTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown>)
    
    const fields: string[] = []
    const values: unknown[] = []

    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title) }
    if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes) }
    if (data.done !== undefined) { 
      fields.push('done = ?'); 
      values.push(data.done ? 1 : 0) 
      fields.push('completed_at = ?')
      values.push(data.done ? Date.now() : null)
    }
    if (data.priority !== undefined) { fields.push('priority = ?'); values.push(data.priority) }
    if (data.due_date !== undefined) { fields.push('due_date = ?'); values.push(data.due_date) }
    if (data.reminder_at !== undefined) { fields.push('reminder_at = ?'); values.push(data.reminder_at) }
    if (data.list_id !== undefined) { fields.push('list_id = ?'); values.push(data.list_id) }
    if (data.parent_id !== undefined) { fields.push('parent_id = ?'); values.push(data.parent_id) }
    if (data.recurrence !== undefined) { fields.push('recurrence = ?'); values.push(data.recurrence) }
    if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(data.sort_order) }

    if (fields.length === 0) return null
    fields.push('updated_at = ?')
    values.push(Date.now(), id)
    db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...(values as any[]))

    const task = rowToTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown>)
    
    // Handle Recurrence
    if (data.done === true && task.recurrence && !existing.done) {
      const nextDate = new Date(task.due_date || Date.now())
      if (task.recurrence === 'daily') nextDate.setDate(nextDate.getDate() + 1)
      else if (task.recurrence === 'weekly') nextDate.setDate(nextDate.getDate() + 7)
      else if (task.recurrence === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1)
      
      const newId = randomUUID()
      const now = Date.now()
      const maxSortRec = db.prepare('SELECT MAX(sort_order) as maxSort FROM tasks').get() as { maxSort: number | null }
      const newSortOrder = (maxSortRec?.maxSort ?? -1) + 1
      db.prepare(
        `INSERT INTO tasks (id, list_id, parent_id, title, notes, done, priority, due_date, reminder_at, recurrence, sort_order, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        newId,
        task.list_id,
        task.parent_id,
        task.title,
        task.notes,
        0,
        task.priority,
        nextDate.getTime(),
        task.reminder_at ? task.reminder_at + (nextDate.getTime() - (task.due_date || Date.now())) : null,
        task.recurrence,
        newSortOrder,
        null,
        now,
        now
      )
    }

    if (data.reminder_at !== undefined || data.done !== undefined) {
      task.done ? cancelReminder(task.id) : scheduleReminder(task)
    }

    // Broadcast update to all windows
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('task:updated', task)
    })

    return task
  })

  ipcMain.handle('tasks:delete', (_e, id: string) => {
    cancelReminder(id)
    getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id)

    // Broadcast deletion to all windows
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('task:deleted', id)
    })

    return { success: true }
  })

  ipcMain.handle('tasks:restore', (_e, task: Task) => {
    const db = getDb()
    db.prepare(
      `INSERT OR REPLACE INTO tasks (id, list_id, parent_id, title, notes, done, priority, due_date, reminder_at, recurrence, sort_order, notified, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      task.id,
      task.list_id,
      task.parent_id,
      task.title,
      task.notes ?? null,
      task.done ? 1 : 0,
      task.priority,
      task.due_date ?? null,
      task.reminder_at ?? null,
      task.recurrence ?? null,
      task.sort_order,
      task.notified,
      task.completed_at ?? null,
      task.created_at,
      task.updated_at
    )
    const restored = rowToTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id) as Record<string, unknown>)
    if (restored.reminder_at) scheduleReminder(restored)
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('task:created', restored)
    })
    return restored
  })
}
