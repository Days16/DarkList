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

  // App details
  getVersion: (): Promise<string> => 
    ipcRenderer.invoke('app:getVersion'),

  // App events
  onLock: (cb: () => void): (() => void) => {
    const handler = (): void => cb()
    ipcRenderer.on('app:lock', handler)
    return () => ipcRenderer.removeListener('app:lock', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)
