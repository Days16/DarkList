export interface Task {
  id: string
  list_id: string | null
  title: string
  done: boolean
  priority: 1 | 2 | 3  // 1=low 2=medium 3=high
  due_date: number | null  // Unix ms
  reminder_at: number | null  // Unix ms
  created_at: number
  updated_at: number
}

export interface List {
  id: string
  name: string
  color: string
  created_at: number
}

export interface AppSettings {
  autoLockMinutes: 0 | 5 | 15 | 30
  accentColor: string
}

export type FilterType = 'all' | 'today' | 'week' | 'priority'
export type SortType = 'created' | 'due_date' | 'priority'
