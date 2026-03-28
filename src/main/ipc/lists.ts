import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { getDb } from '../db'

export function setupListHandlers(): void {
  ipcMain.handle('lists:getAll', () => {
    return getDb().prepare('SELECT * FROM lists ORDER BY created_at ASC').all()
  })

  ipcMain.handle('lists:create', (_e, data: { name: string; color: string }) => {
    const db = getDb()
    const id = randomUUID()
    const now = Date.now()
    db.prepare('INSERT INTO lists (id, name, color, created_at) VALUES (?, ?, ?, ?)').run(
      id, data.name, data.color, now
    )
    return db.prepare('SELECT * FROM lists WHERE id = ?').get(id)
  })

  ipcMain.handle('lists:update', (_e, id: string, data: { name?: string; color?: string }) => {
    const db = getDb()
    const fields: string[] = []
    const values: unknown[] = []
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name) }
    if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color) }
    if (fields.length === 0) return null
    values.push(id)
    db.prepare(`UPDATE lists SET ${fields.join(', ')} WHERE id = ?`).run(...(values as Parameters<typeof db.prepare>[0][]))
    return db.prepare('SELECT * FROM lists WHERE id = ?').get(id)
  })

  ipcMain.handle('lists:delete', (_e, id: string) => {
    getDb().prepare('DELETE FROM lists WHERE id = ?').run(id)
    return { success: true }
  })
}
