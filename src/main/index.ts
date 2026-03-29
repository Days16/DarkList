import { app, BrowserWindow, Tray, Menu, nativeImage, shell, dialog, ipcMain } from 'electron'
import electronUpdater from 'electron-updater'
const { autoUpdater } = electronUpdater
import { join } from 'path'
import { initDb } from './db'
import { initNotifications } from './notifications'
import { setupTaskHandlers } from './ipc/tasks'
import { setupListHandlers } from './ipc/lists'
import { setupAuthHandlers } from './ipc/auth'
import { setupSettingsHandlers } from './ipc/settings'
import { setupDataHandlers } from './ipc/data'
import { setupMenuHandlers } from './ipc/menu'

let mainWindow: BrowserWindow | null = null
let widgetWindow: BrowserWindow | null = null
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
    if (!isQuitting && process.env.NODE_ENV !== 'development') {
      e.preventDefault()
      mainWindow!.hide()
    } else if (process.env.NODE_ENV === 'development') {
      isQuitting = true
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.NODE_ENV === 'development' && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    // Abrir consola automáticamente en desarrollo
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createWidgetWindow(): void {
  if (widgetWindow) {
    widgetWindow.focus()
    return
  }

  widgetWindow = new BrowserWindow({
    width: 320,
    height: 480,
    resizable: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true
    }
  })

  const url = process.env.NODE_ENV === 'development' && process.env['ELECTRON_RENDERER_URL']
    ? `${process.env['ELECTRON_RENDERER_URL']}?widget=true`
    : `file://${join(__dirname, '../renderer/index.html')}?widget=true`

  widgetWindow.loadURL(url)
  widgetWindow.on('ready-to-show', () => widgetWindow?.show())
  widgetWindow.on('closed', () => { widgetWindow = null })
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

function initAutoUpdater(): void {
  // Evitar la descarga automática para poder interactuar con el usuario
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // Cuando hay una actualización disponible
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Actualización disponible',
      message: `La versión ${info.version} de DarkList está disponible. ¿Deseas descargarla ahora?`,
      buttons: ['Actualizar', 'Más tarde']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate()
      }
    })
  })

  // Cuando la actualización ya fue descargada
  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Instalar Actualización',
      message: 'La actualización se ha descargado. La aplicación se reiniciará para instalarla.',
      buttons: ['Reiniciar y Actualizar', 'Más tarde']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })

  // Buscar actualizaciones sin notificaciones intrusivas del sistema operativo por defecto (usamos las nuestras)
  autoUpdater.checkForUpdates()
}

app.whenReady().then(() => {
  initDb()
  setupTaskHandlers()
  setupListHandlers()
  setupAuthHandlers()
  setupSettingsHandlers()
  setupDataHandlers()
  setupMenuHandlers()
  ipcMain.handle('app:getVersion', () => app.getVersion())
  ipcMain.on('app:toggleWidget', () => {
    if (widgetWindow) {
      widgetWindow.close()
    } else {
      createWidgetWindow()
    }
  })
  ipcMain.handle('app:exportToCalendar', async (_e, task: any) => {
    const date = task.due_date ? new Date(task.due_date) : new Date()
    const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    
    // Manual ICS generation for speed and reliability
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${task.title}`,
      `DTSTART:${dateStr}`,
      `DTEND:${dateStr}`,
      'DESCRIPTION:Tarea de DarkList',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')

    const tempDir = app.getPath('temp')
    const filePath = join(tempDir, `task_${task.id}.ics`)
    require('fs').writeFileSync(filePath, icsContent)
    return shell.openPath(filePath)
  })
  createWindow()
  createTray()
  initNotifications()
  initAutoUpdater()
})

app.on('window-all-closed', () => {
  if (process.env.NODE_ENV === 'development') {
    app.quit()
  }
  // keep running in tray
})

app.on('before-quit', () => {
  isQuitting = true
})
