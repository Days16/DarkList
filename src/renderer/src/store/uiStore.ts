import { create } from 'zustand'
import { AppSettings, FilterType, SortType } from '@shared/types'
import { translations, Language, TranslationKey } from '../i18n/translations'

interface UiState {
  filter: FilterType
  sort: SortType
  searchQuery: string
  accentColor: string
  autoLockMinutes: 0 | 5 | 15 | 30
  theme: 'dark' | 'light' | 'system'
  language: Language
  backupFrequencyDays: number
  syncUrl?: string
  syncUser?: string
  syncPass?: string
  focusSearchTrigger: number
  focusTaskInputTrigger: number
  contextMenu: { x: number; y: number; type: 'task' | 'list' | 'widget'; data: any } | null
  setFilter: (f: FilterType) => void
  setSort: (s: SortType) => void
  setSearchQuery: (q: string) => void
  triggerFocusSearch: () => void
  triggerFocusTaskInput: () => void
  showContextMenu: (x: number, y: number, type: 'task' | 'list' | 'widget', data: any) => void
  hideContextMenu: () => void
  t: (key: TranslationKey) => string
  loadSettings: () => Promise<void>
  saveSettings: (data: Partial<AppSettings>) => Promise<void>
}

export const useUiStore = create<UiState>((set, get) => ({
  filter: 'all',
  sort: 'created',
  searchQuery: '',
  accentColor: '#7c6af7',
  autoLockMinutes: 0,
  theme: 'dark',
  language: 'es',
  backupFrequencyDays: 7,
  syncUrl: '',
  syncUser: '',
  syncPass: '',
  focusSearchTrigger: 0,
  focusTaskInputTrigger: 0,
  contextMenu: null,
  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  triggerFocusSearch: () => set((s) => ({ focusSearchTrigger: s.focusSearchTrigger + 1 })),
  triggerFocusTaskInput: () => set((s) => ({ focusTaskInputTrigger: s.focusTaskInputTrigger + 1 })),
  showContextMenu: (x, y, type, data) => set({ contextMenu: { x, y, type, data } }),
  hideContextMenu: () => set({ contextMenu: null }),
  t: (key) => {
    const lang = get().language || 'es'
    return (translations as any)[lang][key] || key
  },
  loadSettings: async () => {
    const s = await window.api.getSettings()
    document.documentElement.style.setProperty('--accent', s.accentColor)
    document.documentElement.style.setProperty('--accent-glow', `${s.accentColor}99`) // ~60% alpha
    
    // Theme logic
    const applyTheme = (t: 'dark' | 'light' | 'system'): void => {
      const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.toggle('light', !isDark)
      document.documentElement.classList.toggle('dark', isDark)
    }
    applyTheme(s.theme)

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const { theme } = useUiStore.getState()
      if (theme === 'system') {
        document.documentElement.classList.toggle('light', !e.matches)
        document.documentElement.classList.toggle('dark', e.matches)
      }
    })

    set({
      accentColor: s.accentColor,
      autoLockMinutes: s.autoLockMinutes,
      theme: s.theme,
      language: s.language as Language,
      backupFrequencyDays: s.backupFrequencyDays,
      syncUrl: s.syncUrl,
      syncUser: s.syncUser,
      syncPass: s.syncPass
    })
  },
  saveSettings: async (data) => {
    const s = await window.api.setSettings(data)
    if (data.accentColor) {
      document.documentElement.style.setProperty('--accent', data.accentColor)
      document.documentElement.style.setProperty('--accent-glow', `${data.accentColor}99`)
    }
    
    if (data.theme) {
      const isDark = data.theme === 'dark' || (data.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.toggle('light', !isDark)
      document.documentElement.classList.toggle('dark', isDark)
    }

    set({
      accentColor: s.accentColor,
      autoLockMinutes: s.autoLockMinutes,
      theme: s.theme,
      language: s.language as Language,
      backupFrequencyDays: s.backupFrequencyDays,
      syncUrl: s.syncUrl,
      syncUser: s.syncUser,
      syncPass: s.syncPass
    })
  }
}))
