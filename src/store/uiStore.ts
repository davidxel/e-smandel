import { create } from 'zustand'

type UiState = {
  toast: { message: string; variant: 'success' | 'error' | 'info' } | null
  showToast: (
    message: string,
    variant?: 'success' | 'error' | 'info',
  ) => void
  clearToast: () => void
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export const useUiStore = create<UiState>((set) => ({
  toast: null,
  showToast: (message, variant = 'info') => {
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: { message, variant } })
    toastTimer = setTimeout(() => {
      set({ toast: null })
      toastTimer = null
    }, 3200)
  },
  clearToast: () => set({ toast: null }),
}))
