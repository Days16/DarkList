import { ipcMain, Menu, MenuItem, BrowserWindow, dialog } from 'electron'

export function setupMenuHandlers(): void {
  ipcMain.handle('menu:show-task', (event, { taskId, isDone }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
      {
        label: isDone ? 'Marcar como pendiente' : 'Marcar como completada',
        click: () => event.sender.send('task:toggle', taskId)
      },
      { type: 'separator' },
      {
        label: 'Eliminar tarea',
        click: () => event.sender.send('task:delete', taskId)
      }
    ]

    const menu = Menu.buildFromTemplate(template)
    menu.popup({ window: win })
  })

  ipcMain.handle('menu:show-list', (event, { listId, listName }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
      {
        label: `Eliminar "${listName}"`,
        click: () => event.sender.send('list:delete', listId)
      }
    ]

    const menu = Menu.buildFromTemplate(template)
    menu.popup({ window: win })
  })
}
