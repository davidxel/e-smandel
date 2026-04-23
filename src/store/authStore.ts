import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiRequest, setAccessToken, getAccessToken } from '../lib/api'
import { pullWorkspaceFromServer } from '../lib/pullWorkspace'
import type { AuthUser } from '../types/schema'
import { useDataStore } from './dataStore'

type AuthState = {
  user: AuthUser | null
  login: (credential: string, password: string) => Promise<{ ok: boolean; message?: string }>
  logout: () => void
  /** Setelah profil / data pengguna diubah di dataStore */
  refreshSessionUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      login: async (credential, password) => {
        try {
          const res = await apiRequest('/api/auth/login', {
            method: 'POST',
            json: { credential, password },
          })
          if (!res.ok) {
            let message: string | undefined
            try {
              const j = (await res.json()) as { message?: string }
              message = j.message
            } catch {
              /* ignore */
            }
            return {
              ok: false,
              message: message ?? 'NIP/NISN atau kata sandi salah.',
            }
          }
          const body = (await res.json()) as { token: string; user: AuthUser }
          setAccessToken(body.token)
          set({ user: body.user })
          await pullWorkspaceFromServer()
          return { ok: true }
        } catch {
          return {
            ok: false,
            message:
              'Tidak dapat menghubungi server API. Jalankan `npm run dev` (Vite + API) atau setel proxy / VITE_API_BASE.',
          }
        }
      },
      logout: () => {
        setAccessToken(null)
        set({ user: null })
      },
      refreshSessionUser: async () => {
        const id = get().user?.id
        if (!id) return
        const token = getAccessToken()
        if (token) {
          const r = await apiRequest('/api/auth/me', { method: 'GET' })
          if (r.ok) {
            const user = (await r.json()) as AuthUser
            set({ user })
            return
          }
        }
        const u = useDataStore.getState().getUserById(id)
        if (u) set({ user: useDataStore.getState().toAuthUser(u) })
      },
    }),
    {
      name: 'e-smandel-auth',
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (finishedState, error) => {
        if (error) return
        queueMicrotask(async () => {
          const token = getAccessToken()
          if (!token) {
            if (finishedState?.user) useAuthStore.setState({ user: null })
            return
          }
          const r = await apiRequest('/api/auth/me', { method: 'GET' })
          if (!r.ok) {
            setAccessToken(null)
            useAuthStore.setState({ user: null })
            return
          }
          const user = (await r.json()) as AuthUser
          useAuthStore.setState({ user })
          await pullWorkspaceFromServer()
        })
      },
    },
  ),
)
