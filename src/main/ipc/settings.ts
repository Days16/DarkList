import { ipcMain } from 'electron'
import Store from 'electron-store'
import { AppSettings } from '../../shared/types'

interface Schema {
  settings: AppSettings
}

const DEFAULT: AppSettings = { autoLockMinutes: 0, accentColor: '#7c6af7' }

const store = new Store<Schema>({ name: 'darklist-config' })

export function setupSettingsHandlers(): void {
  ipcMain.handle('settings:get', () => store.get('settings', DEFAULT))

  ipcMain.handle('settings:set', (_e, data: Partial<AppSettings>) => {
    const current = store.get('settings', DEFAULT)
    const updated: AppSettings = { ...current, ...data }
    store.set('settings', updated)
    return updated
  })
}
