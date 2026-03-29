import { contextBridge, ipcRenderer } from 'electron'
import type { Task, List, AppSettings } from '../shared/types'

const api = {
  // Tasks
  getTasks: (listId?: string): Promise<Task[]> =>
    ipcRenderer.invoke('tasks:getAll', listId),
  createTask: (data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> =>
    ipcRenderer.invoke('tasks:create', data),
  updateTask: (id: string, data: Partial<Task>): Promise<Task> =>
    ipcRenderer.invoke('tasks:update', id, data),
  deleteTask: (id: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('tasks:delete', id),

  // Lists
  getLists: (): Promise<List[]> =>
    ipcRenderer.invoke('lists:getAll'),
  createList: (data: { name: string; color: string }): Promise<List> =>
    ipcRenderer.invoke('lists:create', data),
  updateList: (id: string, data: { name?: string; color?: string }): Promise<List> =>
    ipcRenderer.invoke('lists:update', id, data),
  deleteList: (id: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('lists:delete', id),

  // Auth
  hasPin: (): Promise<boolean> =>
    ipcRenderer.invoke('auth:hasPin'),
  checkPin: (pin: string): Promise<boolean> =>
    ipcRenderer.invoke('auth:check', pin),
  setPin: (pin: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('auth:set', pin),
  changePin: (oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('auth:change', oldPin, newPin),

  // Settings
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:get'),
  setSettings: (data: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:set', data),

  getVersion: (): Promise<string> => 
    ipcRenderer.invoke('app:getVersion'),
  toggleWidget: (): void => 
    ipcRenderer.send('app:toggleWidget'),
  exportToCalendar: (task: any): Promise<void> => 
    ipcRenderer.invoke('app:exportToCalendar', task),

  // Data
  exportData: (): Promise<{ success: boolean; filePath?: string }> =>
    ipcRenderer.invoke('data:export'),
  importData: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('data:import'),
  syncPush: (url: string, user: string, pass: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('data:syncPush', { url, user, pass }),
  syncPull: (url: string, user: string, pass: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('data:syncPull', { url, user, pass }),

  // Menu
  showTaskMenu: (taskId: string, isDone: boolean): Promise<void> =>
    ipcRenderer.invoke('menu:show-task', { taskId, isDone }),
  showListMenu: (listId: string, listName: string): Promise<void> =>
    ipcRenderer.invoke('menu:show-list', { listId, listName }),

  // App events
  onLock: (cb: () => void): (() => void) => {
    const handler = (): void => cb()
    ipcRenderer.on('app:lock', handler)
    return () => ipcRenderer.removeListener('app:lock', handler)
  },
  onSettingsUpdated: (cb: (settings: AppSettings) => void): (() => void) => {
    const handler = (_e: any, settings: AppSettings): void => cb(settings)
    ipcRenderer.on('settings:updated', handler)
    return () => ipcRenderer.removeListener('settings:updated', handler)
  },
  onTaskCreated: (cb: (task: Task) => void): (() => void) => {
    const handler = (_e: any, t: Task): void => cb(t)
    ipcRenderer.on('task:created', handler)
    return () => ipcRenderer.removeListener('task:created', handler)
  },
  onTaskUpdated: (cb: (task: Task) => void): (() => void) => {
    const handler = (_e: any, t: Task): void => cb(t)
    ipcRenderer.on('task:updated', handler)
    return () => ipcRenderer.removeListener('task:updated', handler)
  },
  onTaskDeleted: (cb: (id: string) => void): (() => void) => {
    const handler = (_e: any, id: string): void => cb(id)
    ipcRenderer.on('task:deleted', handler)
    return () => ipcRenderer.removeListener('task:deleted', handler)
  },
  onListDelete: (cb: (id: string) => void): (() => void) => {
    const handler = (_e: any, id: string): void => cb(id)
    ipcRenderer.on('list:delete', handler)
    return () => ipcRenderer.removeListener('list:delete', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)
