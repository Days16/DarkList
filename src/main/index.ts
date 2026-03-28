import { app, BrowserWindow, Tray, Menu, nativeImage, shell } from 'electron'
import { join } from 'path'
import { initDb } from './db'
import { initNotifications } from './notifications'
import { setupTaskHandlers } from './ipc/tasks'
import { setupListHandlers } from './ipc/lists'
import { setupAuthHandlers } from './ipc/auth'
import { setupSettingsHandlers } from './ipc/settings'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

// Guardar los datos y la configuración en Documentos/DarkList
app.setPath('userData', join(app.getPath('documents'), 'DarkList'))

function getAppIcon(): Electron.NativeImage {
  const iconPath = join(__dirname, '../../resources/icon.png')
  const img = nativeImage.createFromPath(iconPath)
  if (!img.isEmpty()) return img
  // Fallback: solid violet square
  const size = 16
  const buf = Buffer.alloc(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    buf[i * 4 + 0] = 124
    buf[i * 4 + 1] = 106
    buf[i * 4 + 2] = 247
    buf[i * 4 + 3] = 255
  }
  return nativeImage.createFromBitmap(buf, { width: size, height: size })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 680,
    minWidth: 720,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    icon: getAppIcon(),
    backgroundColor: '#0e0e0f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow!.show())

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow!.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.NODE_ENV === 'development' && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  tray = new Tray(getAppIcon())
  tray.setToolTip('DarkList')
  const menu = Menu.buildFromTemplate([
    { label: 'Abrir', click: () => mainWindow?.show() },
    { label: 'Bloquear', click: () => mainWindow?.webContents.send('app:lock') },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => mainWindow?.show())
}

app.whenReady().then(() => {
  initDb()
  setupTaskHandlers()
  setupListHandlers()
  setupAuthHandlers()
  setupSettingsHandlers()
  createWindow()
  createTray()
  initNotifications()
})

app.on('window-all-closed', () => {
  // keep running in tray
})

app.on('before-quit', () => {
  isQuitting = true
})
