import { app } from 'electron'
import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync, readdirSync, unlinkSync, statSync } from 'fs'
import Store from 'electron-store'

let db: Database.Database

export function initDb(): void {
  const dbPath = join(app.getPath('userData'), 'darklist.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations()
  
  // Realizar backup si toca
  setTimeout(() => runBackup(dbPath), 5000) // Delay para no afectar el arranque
}

function runBackup(dbPath: string): void {
  const store = new Store({ name: 'darklist-backup-state' })
  const lastBackup = store.get('lastBackup', 0) as number
  const now = Date.now()
  
  // Configuración por defecto: cada 7 días
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  if (now - lastBackup < sevenDays) return

  const backupDir = join(app.getPath('documents'), 'DarkList', 'backups')
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true })
  }

  const dateStr = new Date().toISOString().split('T')[0]
  const backupPath = join(backupDir, `darklist_backup_${dateStr}.db`)
  
  try {
    copyFileSync(dbPath, backupPath)
    store.set('lastBackup', now)
    
    // Rotación: Mantener solo 5 últimos
    const files = readdirSync(backupDir)
      .filter(f => f.startsWith('darklist_backup_'))
      .map(f => ({ name: f, time: statSync(join(backupDir, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time)

    if (files.length > 5) {
      for (let i = 5; i < files.length; i++) {
        unlinkSync(join(backupDir, files[i].name))
      }
    }
  } catch (err) {
    console.error('Error performing backup:', err)
  }
}

export function getDb(): Database.Database {
  if (!db) throw new Error('DB not initialized')
  return db
}

function runMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      color      TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      list_id     TEXT REFERENCES lists(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      done        INTEGER NOT NULL DEFAULT 0,
      priority    INTEGER NOT NULL DEFAULT 2,
      due_date    INTEGER,
      reminder_at INTEGER,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    );
  `)

  const columns = [
    'parent_id TEXT REFERENCES tasks(id) ON DELETE CASCADE',
    'recurrence TEXT',
    'notes TEXT',
    'sort_order INTEGER NOT NULL DEFAULT 0',
    'notified INTEGER NOT NULL DEFAULT 0',
    'completed_at INTEGER'
  ]
  for (const col of columns) {
    try {
      db.exec(`ALTER TABLE tasks ADD COLUMN ${col}`)
    } catch {
      // Column already exists
    }
  }
}
