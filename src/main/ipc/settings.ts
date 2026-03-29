import { ipcMain, BrowserWindow, safeStorage } from 'electron'
import Store from 'electron-store'
import { AppSettings } from '../../shared/types'

interface Schema {
  settings: AppSettings
  _syncPassEncrypted?: string
}

const DEFAULT: AppSettings = {
  autoLockMinutes: 0,
  accentColor: '#7c6af7',
  theme: 'dark',
  language: 'es',
  backupFrequencyDays: 7
}

const store = new Store<Schema>({ name: 'darklist-config' })

function getSettingsWithPass(): AppSettings {
  const s = store.get('settings', DEFAULT)
  const encrypted = store.get('_syncPassEncrypted') as string | undefined
  if (encrypted && safeStorage.isEncryptionAvailable()) {
    try {
      s.syncPass = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    } catch {
      s.syncPass = ''
    }
  }
  return s
}

export function setupSettingsHandlers(): void {
  ipcMain.handle('settings:get', () => getSettingsWithPass())

  ipcMain.handle('settings:set', (_e, data: Partial<AppSettings>) => {
    const current = store.get('settings', DEFAULT)
    const toStore: AppSettings = { ...current, ...data }

    // Encrypt syncPass separately, never store plaintext
    if (data.syncPass !== undefined) {
      if (data.syncPass && safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(data.syncPass).toString('base64')
        store.set('_syncPassEncrypted', encrypted)
      } else {
        store.delete('_syncPassEncrypted' as any)
      }
      delete toStore.syncPass
    }

    store.set('settings', toStore)

    // Return with decrypted pass so renderer state stays in sync
    const updated = getSettingsWithPass()

    // Broadcast to all windows
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('settings:updated', updated)
    })

    return updated
  })
}
