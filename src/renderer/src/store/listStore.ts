import { create } from 'zustand'
import { List } from '@shared/types'

interface ListState {
  lists: List[]
  activeListId: string | null
  setLists: (lists: List[]) => void
  addList: (list: List) => void
  updateListItem: (id: string, data: Partial<List>) => void
  removeList: (id: string) => void
  setActiveListId: (id: string | null) => void
}

export const useListStore = create<ListState>((set) => ({
  lists: [],
  activeListId: null,
  setLists: (lists) => set({ lists }),
  addList: (list) => set((s) => ({ lists: [...s.lists, list] })),
  updateListItem: (id, data) =>
    set((s) => ({ lists: s.lists.map((l) => (l.id === id ? { ...l, ...data } : l)) })),
  removeList: (id) =>
    set((s) => ({
      lists: s.lists.filter((l) => l.id !== id),
      activeListId: s.activeListId === id ? null : s.activeListId
    })),
  setActiveListId: (id) => set({ activeListId: id })
}))
