import type { Task, List, AppSettings } from '../shared/types'

declare global {
  interface Window {
    api: {
      getTasks(listId?: string): Promise<Task[]>
      createTask(data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task>
      updateTask(id: string, data: Partial<Task>): Promise<Task>
      deleteTask(id: string): Promise<{ success: boolean }>

      getLists(): Promise<List[]>
      createList(data: { name: string; color: string }): Promise<List>
      updateList(id: string, data: { name?: string; color?: string }): Promise<List>
      deleteList(id: string): Promise<{ success: boolean }>

      hasPin(): Promise<boolean>
      checkPin(pin: string): Promise<boolean>
      setPin(pin: string): Promise<{ success: boolean }>
      changePin(oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }>

      getSettings(): Promise<AppSettings>
      setSettings(data: Partial<AppSettings>): Promise<AppSettings>

      getVersion(): Promise<string>
      toggleWidget(): void
      exportToCalendar(task: any): Promise<void>
      exportData(): Promise<{ success: boolean; filePath?: string }>
      importData(): Promise<{ success: boolean; error?: string }>
      syncPush(url: string, user: string, pass: string): Promise<{ success: boolean; error?: string }>
      syncPull(url: string, user: string, pass: string): Promise<{ success: boolean; error?: string }>

      // Menu
      showTaskMenu(taskId: string, isDone: boolean): Promise<void>
      showListMenu(listId: string, listName: string): Promise<void>

      // App events
      onLock(cb: () => void): (() => void)
      onSettingsUpdated(cb: (settings: AppSettings) => void): (() => void)
      onTaskCreated(cb: (task: Task) => void): (() => void)
      onTaskUpdated(cb: (task: Task) => void): (() => void)
      onTaskDeleted(cb: (id: string) => void): (() => void)
      onListDelete(cb: (id: string) => void): (() => void)
    }
  }
}
