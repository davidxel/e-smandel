import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AlertTriangle, Eye, EyeOff, Lock, Sparkles, User } from 'lucide-react'
import { SchoolLogo } from '../components/ui/SchoolLogo'
import { apiUrl } from '../lib/api'
import { getCredentialForLogin } from '../lib/userDisplay'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'
import { ROLE_LABELS } from '../types/roles'
import type { LoginAppearance } from '../types/loginAppearance'
import { defaultLoginAppearance } from '../types/loginAppearance'

type LoginContextResponse = {
  databaseOk: boolean
  databaseMessage?: string
  appearance: LoginAppearance
}

function backdropStyle(appearance: LoginAppearance): CSSProperties | undefined {
  if (appearance.background.kind === 'gradient_custom') {
    const { from, via, to } = appearance.background
    return {
      background: `linear-gradient(to bottom right, ${from}, ${via}, ${to})`,
    }
  }
  if (appearance.background.kind === 'image') {
    const { dataUrl, overlay } = appearance.background
    return {
      backgroundImage: `linear-gradient(rgba(15,23,42,${overlay}), rgba(15,23,42,${overlay})), url(${JSON.stringify(dataUrl)})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }
  return undefined
}

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const user = useAuthStore((s) => s.user)
  const allUsers = useDataStore((s) => s.users)
  const showToast = useUiStore((s) => s.showToast)
  const [credential, setCredential] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [appearance, setAppearance] = useState<LoginAppearance>(() => defaultLoginAppearance())
  const [databaseOk, setDatabaseOk] = useState(true)
  const [databaseMessage, setDatabaseMessage] = useState<string | undefined>(undefined)
  const [apiUnreachable, setApiUnreachable] = useState(false)
  const [contextLoading, setContextLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(apiUrl('/api/public/login-context'), {
          method: 'GET',
          credentials: 'same-origin',
        })
        if (!res.ok) {
          if (!cancelled) {
            setAppearance(defaultLoginAppearance())
            setDatabaseOk(false)
            setDatabaseMessage(
              `Layanan API mengembalikan status ${res.status}. Basis data atau rute publik tidak tersedia.`,
            )
            setApiUnreachable(false)
          }
          return
        }
        const body = (await res.json()) as LoginContextResponse
        if (cancelled) return
        setAppearance(body.appearance ?? defaultLoginAppearance())
        setDatabaseOk(body.databaseOk !== false)
        setDatabaseMessage(body.databaseMessage)
        setApiUnreachable(false)
      } catch {
        if (!cancelled) {
          setAppearance(defaultLoginAppearance())
          setDatabaseOk(false)
          setDatabaseMessage(
            'Tidak dapat menghubungi server API (jaringan, CORS, atau backend belum dijalankan). Periksa npm run dev pada API dan proxy Vite.',
          )
          setApiUnreachable(true)
        }
      } finally {
        if (!cancelled) setContextLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (user) return <Navigate to="/app" replace />

  const demoAccounts = allUsers.filter((u) => !u.id.startsWith('u-dummy'))
  const bg = appearance.background
  const useDefaultGradient = bg.kind === 'default'
  const customBackdrop = backdropStyle(appearance)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!databaseOk) {
      showToast('Basis data tidak siap — login tidak dapat diproses.', 'error')
      return
    }
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
    <div
      className={[
        'relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10',
        useDefaultGradient
          ? 'bg-gradient-to-br from-brand-navy-dark via-brand-navy to-brand-navy-muted'
          : 'bg-slate-900',
      ].join(' ')}
      style={customBackdrop}
    >
      {useDefaultGradient ? (
        <>
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-gold/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl"
            aria-hidden
          />
        </>
      ) : bg.kind === 'image' ? (
        <div className="pointer-events-none absolute inset-0 bg-black/10" aria-hidden />
      ) : (
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/5 blur-3xl"
          aria-hidden
        />
      )}

      <div className="relative z-10 w-full max-w-md">
        {!databaseOk || apiUnreachable ? (
          <div
            className="mb-4 flex gap-3 rounded-xl border border-amber-300/80 bg-amber-50/95 p-4 text-sm text-amber-950 shadow-lg backdrop-blur-sm"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
            <div>
              <p className="font-semibold text-amber-900">
                {apiUnreachable ? 'Server API tidak merespons' : 'Basis data tidak tersedia'}
              </p>
              <p className="mt-1 leading-relaxed text-amber-900/90">
                {databaseMessage ??
                  'Pastikan MySQL berjalan, file .env benar, dan migrasi basis data sudah dijalankan.'}
              </p>
              <p className="mt-2 text-xs text-amber-800/90">
                Tampilan halaman memakai bawaan aplikasi hingga koneksi berhasil. Login tidak akan
                berhasil sebelum basis data terhubung.
              </p>
            </div>
          </div>
        ) : null}

        {contextLoading ? (
          <p className="mb-6 text-center text-sm text-white/80">Memeriksa koneksi…</p>
        ) : null}

        <div className="mb-8 text-center text-white">
          <SchoolLogo
            variant="hero"
            srcOverride={appearance.logoDataUrl}
            altOverride={appearance.logoAlt}
          />
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{appearance.title}</h1>
          <p className="mt-2 text-sm text-white/80">{appearance.subtitle}</p>
          <p className="mt-1 text-xs text-brand-gold-light/90">{appearance.schoolLine}</p>
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
                  disabled={!databaseOk}
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
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-slate-900 outline-none ring-brand-navy focus:border-brand-navy focus:ring-2"
                  placeholder="••••••••"
                  required
                  disabled={!databaseOk}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !databaseOk}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-navy-dark disabled:opacity-60"
            >
              {loading ? 'Memproses…' : !databaseOk ? 'Login tidak tersedia' : 'Masuk'}
            </button>
          </form>

          {import.meta.env.DEV ? (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
                Demo cepat (staff: demo1234; siswa: siswa123)
              </p>
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {demoAccounts.map((u) => {
                  const defaultPwd = u.role === 'siswa' ? 'siswa123' : 'demo1234'
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

        <p className="mt-6 text-center text-xs text-white/60">{appearance.footerLine}</p>
        <p className="mx-auto mt-3 max-w-md text-center text-xs leading-relaxed text-white/65">
          {appearance.infoLine}
        </p>
      </div>
    </div>
  )
}
