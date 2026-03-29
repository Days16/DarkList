import { ipcMain, dialog, app } from 'electron'
import fs from 'fs'
import https from 'https'
import Store from 'electron-store'
import { getDb } from '../db'
import { join } from 'path'

function getLang(): string {
  const store = new Store({ name: 'darklist-config' })
  return (store.get('settings') as any)?.language || 'es'
}

export function setupDataHandlers(): void {
  ipcMain.handle('data:export', async (event) => {
    const db = getDb()
    const tasks = db.prepare('SELECT * FROM tasks').all()
    const lists = db.prepare('SELECT * FROM lists').all()
    
    const data = {
      tasks,
      lists,
      exported_at: Date.now(),
      version: app.getVersion()
    }

    const lang = getLang()
    const { filePath } = await dialog.showSaveDialog({
      title: lang === 'en' ? 'Export DarkList data' : 'Exportar datos de DarkList',
      defaultPath: `darklist_backup_${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })

    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
      return { success: true, filePath }
    }
    return { success: false }
  })

  ipcMain.handle('data:import', async (event) => {
    const lang = getLang()
    const { filePaths } = await dialog.showOpenDialog({
      title: lang === 'en' ? 'Import data to DarkList' : 'Importar datos a DarkList',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })

    if (filePaths.length === 0) return { success: false }

    try {
      const content = fs.readFileSync(filePaths[0], 'utf-8')
      const data = JSON.parse(content)
      
      if (!data.tasks || !data.lists) {
        throw new Error(lang === 'en' ? 'Invalid file format' : 'Formato de archivo inválido')
      }

      const db = getDb()

      // Confirmation
      const isEn = lang === 'en'
      const confirmTitle = isEn ? 'Confirm overwrite' : 'Confirmar sobreescritura'
      const confirmMsg = isEn
        ? 'This will overwrite existing tasks and lists with matching IDs. Continue?'
        : 'Se sobreescribiran tareas y listas con el mismo ID. Continuar?'
      const confirmButtons = isEn ? ['Cancel', 'Confirm'] : ['Cancelar', 'Confirmar']
      const { response } = await dialog.showMessageBox({
        type: 'warning',
        title: confirmTitle,
        message: confirmMsg,
        buttons: confirmButtons
      })

      if (response === 0) return { success: false }

      const insertList = db.prepare(`
        INSERT OR REPLACE INTO lists (id, name, color, created_at)
        VALUES (?, ?, ?, ?)
      `)
      
      const insertTask = db.prepare(`
        INSERT OR REPLACE INTO tasks (id, list_id, parent_id, title, notes, done, priority, due_date, reminder_at, recurrence, sort_order, notified, completed_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const transaction = db.transaction(() => {
        for (const list of data.lists) {
          insertList.run(list.id, list.name, list.color, list.created_at)
        }
        for (const task of data.tasks) {
          insertTask.run(
            task.id,
            task.list_id,
            task.parent_id,
            task.title,
            task.notes,
            task.done,
            task.priority,
            task.due_date,
            task.reminder_at,
            task.recurrence,
            task.sort_order,
            task.notified,
            task.completed_at ?? null,
            task.created_at,
            task.updated_at
          )
        }
      })

      transaction()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('data:syncPush', async (_e, { url, user, pass }: any) => {
    try {
      const dbPath = join(app.getPath('userData'), 'darklist.db')
      const content = fs.readFileSync(dbPath)
      const auth = Buffer.from(`${user}:${pass}`).toString('base64')
      
      return new Promise((resolve) => {
        const req = https.request(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/octet-stream',
            'Content-Length': content.length
          }
        }, (res) => {
          if (res.statusCode && res.statusCode < 300) resolve({ success: true })
          else resolve({ success: false, error: `Server returned ${res.statusCode}` })
        })
        req.on('error', (e) => resolve({ success: false, error: e.message }))
        req.write(content)
        req.end()
      })
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('data:syncPull', async (_e, { url, user, pass }: any) => {
    try {
      const auth = Buffer.from(`${user}:${pass}`).toString('base64')
      
      return new Promise((resolve) => {
        const req = https.request(url, {
          method: 'GET',
          headers: { 'Authorization': `Basic ${auth}` }
        }, (res) => {
          if (res.statusCode !== 200) {
            resolve({ success: false, error: `Server returned ${res.statusCode}` })
            return
          }
          const chunks: any[] = []
          res.on('data', (chunk) => chunks.push(chunk))
          res.on('end', () => {
            const dbPath = join(app.getPath('userData'), 'darklist.db')
            fs.writeFileSync(dbPath, Buffer.concat(chunks))
            resolve({ success: true })
          })
        })
        req.on('error', (e) => resolve({ success: false, error: e.message }))
        req.end()
      })
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })
}
