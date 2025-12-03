import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark' | 'system'

export interface Toast {
  id: string
  title: string
  description?: string
  intent?: 'info' | 'success' | 'warning' | 'danger'
  duration?: number
}

export interface UIState {
  theme: ThemePreference
  isSidebarCollapsed: boolean
  toasts: Toast[]
  setTheme: (theme: ThemePreference) => void
  toggleSidebar: () => void
  pushToast: (toast: Toast) => void
  dismissToast: (id: string) => void
  clearToasts: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      isSidebarCollapsed: false,
      toasts: [],
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () =>
        set({ isSidebarCollapsed: !get().isSidebarCollapsed }),
      pushToast: (toast) => set({ toasts: [...get().toasts, toast] }),
      dismissToast: (id) =>
        set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
      clearToasts: () => set({ toasts: [] }),
    }),
    {
      name: 'proximity.ui.v1',
      partialize: (state) => ({
        theme: state.theme,
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return
        }

        state.toasts = []
      },
    },
  ),
)

