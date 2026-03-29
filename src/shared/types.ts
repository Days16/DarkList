export interface Task {
  id: string
  list_id: string | null
  parent_id: string | null
  title: string
  notes: string | null
  done: boolean
  priority: 1 | 2 | 3  // 1=low 2=medium 3=high
  due_date: number | null  // Unix ms
  reminder_at: number | null  // Unix ms
  recurrence: 'daily' | 'weekly' | 'monthly' | null
  sort_order: number
  notified: number
  completed_at: number | null
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
  theme: 'dark' | 'light' | 'system'
  language: 'es' | 'en' | 'fr' | 'de' | 'pt' | 'it'
  backupFrequencyDays: number // 0 = off, 7, 30, etc.
  syncUrl?: string
  syncUser?: string
  syncPass?: string
}

export type FilterType = 'all' | 'today' | 'week' | 'priority'
export type SortType = 'created' | 'due_date' | 'priority'
