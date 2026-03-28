import { create } from 'zustand'
import { AppSettings, FilterType, SortType } from '@shared/types'

interface UiState {
  filter: FilterType
  sort: SortType
  searchQuery: string
  accentColor: string
  autoLockMinutes: 0 | 5 | 15 | 30
  setFilter: (f: FilterType) => void
  setSort: (s: SortType) => void
  setSearchQuery: (q: string) => void
  loadSettings: () => Promise<void>
  saveSettings: (data: Partial<AppSettings>) => Promise<void>
}

export const useUiStore = create<UiState>((set) => ({
  filter: 'all',
  sort: 'created',
  searchQuery: '',
  accentColor: '#7c6af7',
  autoLockMinutes: 0,
  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  loadSettings: async () => {
    const s = await window.api.getSettings()
    document.documentElement.style.setProperty('--accent', s.accentColor)
    set({ accentColor: s.accentColor, autoLockMinutes: s.autoLockMinutes })
  },
  saveSettings: async (data) => {
    const s = await window.api.setSettings(data)
    if (data.accentColor) document.documentElement.style.setProperty('--accent', data.accentColor)
    set({ accentColor: s.accentColor, autoLockMinutes: s.autoLockMinutes })
  }
}))
