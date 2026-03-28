import { create } from 'zustand'

interface AuthState {
  isUnlocked: boolean
  hasPin: boolean
  failedAttempts: number
  cooldownUntil: number | null
  setUnlocked: (v: boolean) => void
  setHasPin: (v: boolean) => void
  incrementFailed: () => void
  resetFailed: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isUnlocked: false,
  hasPin: false,
  failedAttempts: 0,
  cooldownUntil: null,
  setUnlocked: (v) =>
    set({ isUnlocked: v, ...(v ? { failedAttempts: 0, cooldownUntil: null } : {}) }),
  setHasPin: (v) => set({ hasPin: v }),
  incrementFailed: () => {
    const attempts = get().failedAttempts + 1
    if (attempts >= 5) {
      set({ failedAttempts: attempts, cooldownUntil: Date.now() + 30_000 })
    } else {
      set({ failedAttempts: attempts })
    }
  },
  resetFailed: () => set({ failedAttempts: 0, cooldownUntil: null })
}))
