import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Lock, Sparkles, User } from 'lucide-react'
import { SchoolLogo } from '../components/ui/SchoolLogo'
import { getCredentialForLogin } from '../lib/userDisplay'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'
import { ROLE_LABELS } from '../types/roles'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const user = useAuthStore((s) => s.user)
  const allUsers = useDataStore((s) => s.users)
  const showToast = useUiStore((s) => s.showToast)
  const [credential, setCredential] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/app" replace />

  const demoAccounts = allUsers.filter((u) => !u.id.startsWith('u-dummy'))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await login(credential, password)
    setLoading(false)
    if (res.ok) {
      showToast('Selamat datang di e-Smandel.', 'success')
      navigate('/app', { replace: true })
    } else {
      showToast(res.message ?? 'Gagal masuk.', 'error')
    }
  }

  const quickDemo = (cred: string, pwd: string) => {
    setCredential(cred)
    setPassword(pwd)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-navy-dark via-brand-navy to-brand-navy-muted px-4 py-10">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-gold/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center text-white">
          <SchoolLogo variant="hero" />
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            e-Smandel
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Sistem Informasi Disiplin &amp; Absensi
          </p>
          <p className="mt-1 text-xs text-brand-gold-light/90">
            SMAN 8 Mandau
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-2xl backdrop-blur-sm md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="cred"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                NIP / NISN
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="cred"
                  type="text"
                  autoComplete="username"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-slate-900 outline-none ring-brand-navy focus:border-brand-navy focus:ring-2"
                  placeholder="NIP (guru/staff) atau NISN (siswa)"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="pass"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Kata sandi
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="pass"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-slate-900 outline-none ring-brand-navy focus:border-brand-navy focus:ring-2"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-navy-dark disabled:opacity-60"
            >
              {loading ? 'Memproses…' : 'Masuk'}
            </button>
          </form>

          {import.meta.env.DEV ? (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
                Demo cepat (staff: demo123; siswa: siswa123)
              </p>
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {demoAccounts.map((u) => {
                  const defaultPwd = u.role === 'siswa' ? 'siswa123' : 'demo123'
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => quickDemo(getCredentialForLogin(u), defaultPwd)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm transition hover:border-brand-navy/30 hover:bg-white"
                    >
                      <span className="truncate font-medium text-slate-800">
                        {u.name}
                      </span>
                      <span className="shrink-0 rounded-full bg-brand-navy/10 px-2 py-0.5 text-[10px] font-medium text-brand-navy">
                        {ROLE_LABELS[u.role]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-center text-xs text-white/60">
          © {new Date().getFullYear()} SMAN 8 Mandau — Lingkungan percobaan
        </p>
        <p className="mx-auto mt-3 max-w-md text-center text-xs leading-relaxed text-white/65">
          Masuk memerlukan API + MySQL (lihat <span className="text-brand-gold-light/90">env.example</span>, lalu{' '}
          <span className="text-brand-gold-light/90">npm run dev</span>). Data NISN/NIP dan kontak diproses sesuai
          kebijakan institusi.
        </p>
      </div>
    </div>
  )
}
