import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '../types/schema'
import { useDataStore } from './dataStore'

type AuthState = {
  user: AuthUser | null
  login: (credential: string, password: string) => { ok: boolean; message?: string }
  logout: () => void
  /** Setelah profil / data pengguna diubah di dataStore */
  refreshSessionUser: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      login: (credential, password) => {
        const u = useDataStore.getState().findUserForLogin(credential, password)
        if (!u) {
          return {
            ok: false,
            message: 'NIP/NISN atau kata sandi salah.',
          }
        }
        set({ user: useDataStore.getState().toAuthUser(u) })
        return { ok: true }
      },
      logout: () => set({ user: null }),
      refreshSessionUser: () => {
        const id = get().user?.id
        if (!id) return
        const u = useDataStore.getState().getUserById(id)
        if (u) set({ user: useDataStore.getState().toAuthUser(u) })
      },
    }),
    { name: 'e-smandel-auth', partialize: (s) => ({ user: s.user }) },
  ),
)
