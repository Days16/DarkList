import { app, BrowserWindow, Tray, Menu, nativeImage, shell, dialog, ipcMain } from 'electron'
import https from 'https'
import { writeFileSync } from 'fs'
import Store from 'electron-store'
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

// Forzar nombre de la app para la barra de tareas
app.name = 'DarkList'

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

function getTrayLabels(): { open: string; lock: string; quit: string } {
  const configStore = new Store({ name: 'darklist-config' })
  const lang = (configStore.get('settings') as any)?.language || 'es'
  if (lang === 'en') return { open: 'Open', lock: 'Lock', quit: 'Quit' }
  return { open: 'Abrir', lock: 'Bloquear', quit: 'Salir' }
}

function createTray(): void {
  const labels = getTrayLabels()
  tray = new Tray(getAppIcon())
  tray.setToolTip('DarkList')
  const menu = Menu.buildFromTemplate([
    { label: labels.open, click: () => mainWindow?.show() },
    { label: labels.lock, click: () => mainWindow?.webContents.send('app:lock') },
    { type: 'separator' },
    {
      label: labels.quit,
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
  const currentVersion = app.getVersion()
  const owner = 'Days16'
  const repo = 'DarkList'
  const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`

  const options = {
    headers: {
      'User-Agent': 'DarkList-App'
    }
  }

  https.get(url, options, (res) => {
    let data = ''
    res.on('data', (chunk) => (data += chunk))
    res.on('end', () => {
      try {
        const release = JSON.parse(data)
        const latestVersion = release.tag_name.replace('v', '')

        // Simple version comparison (e.g., 1.1.0 > 1.0.0)
        const v1 = currentVersion.split('.').map(Number)
        const v2 = latestVersion.split('.').map(Number)

        let isNewer = false
        for (let i = 0; i < 3; i++) {
          if ((v2[i] || 0) > (v1[i] || 0)) {
            isNewer = true
            break
          }
          if ((v2[i] || 0) < (v1[i] || 0)) break
        }

        if (isNewer) {
          dialog.showMessageBox({
            type: 'info',
            title: 'Actualización disponible',
            message: `¡Hay una nueva versión de DarkList disponible (v${latestVersion})!`,
            detail: '¿Quieres ir a la página de descargas para bajar el nuevo instalador (.exe)?',
            buttons: ['Descargar ahora', 'Más tarde']
          }).then((result) => {
            if (result.response === 0) {
              shell.openExternal(`https://github.com/${owner}/${repo}/releases/latest`)
            }
          })
        }
      } catch (e) {
        console.error('Error al comprobar actualizaciones:', e)
      }
    })
  }).on('error', (err) => {
    console.error('Fallo de red al buscar actualizaciones:', err)
  })
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
  ipcMain.on('tray:rebuild', () => {
    if (tray) { tray.destroy(); tray = null }
    createTray()
  })
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
    writeFileSync(filePath, icsContent)
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
