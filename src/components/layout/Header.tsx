import { LogOut, Menu } from 'lucide-react'
import { SchoolLogo } from '../ui/SchoolLogo'
import { ROLE_LABELS } from '../../types/roles'
import type { AuthUser } from '../../types/schema'

type HeaderProps = {
  user: AuthUser
  onMenuClick: () => void
  onLogout: () => void
}

export function Header({ user, onMenuClick, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-brand-navy px-4 text-white shadow-md md:px-6">
      <div className="flex min-w-0 items-center gap-3">
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
        <span className="hidden rounded-full border border-brand-gold/40 bg-brand-gold/15 px-3 py-1 text-xs font-medium text-brand-gold-light sm:inline">
          {ROLE_LABELS[user.role]}
        </span>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-white/10 px-3 text-sm font-medium text-white transition hover:bg-white/20"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  )
}
