import { Link } from 'react-router-dom'
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, Settings, UserCircle2 } from 'lucide-react'
import { SchoolLogo } from '../ui/SchoolLogo'
import { ROLE_LABELS } from '../../types/roles'
import type { AuthUser } from '../../types/schema'

type HeaderProps = {
  user: AuthUser
  onMenuClick: () => void
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  onLogout: () => void
}

export function Header({
  user,
  onMenuClick,
  sidebarCollapsed,
  onToggleSidebar,
  onLogout,
}: HeaderProps) {
  const initials = user.name
    .split(' ')
    .map((x) => x[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-brand-navy px-4 text-white shadow-md md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
          aria-label={sidebarCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 md:hidden"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 items-center gap-3">
          <SchoolLogo variant="header" />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wider text-white/70">
              SMAN 8 Mandau
            </p>
            <p className="truncate text-sm font-semibold">e-Smandel</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden min-w-0 text-right sm:block">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-brand-gold-light">
            {ROLE_LABELS[user.role]}
          </p>
        </div>
        <details className="relative">
          <summary className="inline-flex h-10 w-10 list-none items-center justify-center overflow-hidden rounded-full border border-brand-gold/40 bg-white/10 text-xs font-semibold text-white transition hover:bg-white/20">
            {user.profilePhotoDataUrl ? (
              <img src={user.profilePhotoDataUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span>{initials || <UserCircle2 className="h-5 w-5" />}</span>
            )}
          </summary>
          <div className="absolute right-0 top-12 z-40 w-64 rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xl">
            <div className="border-b border-slate-100 px-2 pb-2">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
            </div>
            <div className="mt-2 grid gap-1">
              <Link
                to="/app/profil"
                className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-100"
              >
                <Settings className="h-4 w-4" />
                Pengaturan Identitas
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </div>
        </details>
      </div>
    </header>
  )
}
