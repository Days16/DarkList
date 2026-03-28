import { ipcMain } from 'electron'
import Store from 'electron-store'
import bcrypt from 'bcryptjs'

interface Schema {
  pinHash?: string
}

const store = new Store<Schema>({ name: 'darklist-config' })

export function setupAuthHandlers(): void {
  ipcMain.handle('auth:hasPin', () => store.has('pinHash'))

  ipcMain.handle('auth:check', async (_e, pin: string) => {
    const hash = store.get('pinHash')
    if (!hash) return false
    return bcrypt.compare(pin, hash)
  })

  ipcMain.handle('auth:set', async (_e, pin: string) => {
    const hash = await bcrypt.hash(pin, 10)
    store.set('pinHash', hash)
    return { success: true }
  })

  ipcMain.handle('auth:change', async (_e, oldPin: string, newPin: string) => {
    const hash = store.get('pinHash')
    if (!hash) return { success: false, error: 'No PIN set' }
    const valid = await bcrypt.compare(oldPin, hash)
    if (!valid) return { success: false, error: 'Incorrect PIN' }
    const newHash = await bcrypt.hash(newPin, 10)
    store.set('pinHash', newHash)
    return { success: true }
  })
}
