import { app } from 'electron'
import Database from 'better-sqlite3'
import { join } from 'path'

let db: Database.Database

export function initDb(): void {
  const dbPath = join(app.getPath('userData'), 'darklist.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations()
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
}
