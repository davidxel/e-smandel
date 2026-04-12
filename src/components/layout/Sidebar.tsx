import { NavLink } from 'react-router-dom'
import { ADMIN_SECTION_LABEL, NAV_ITEMS } from '../../lib/nav'
import { canAccessRoute } from '../../lib/permissions'
import type { UserRole } from '../../types/roles'

type SidebarProps = {
  role: UserRole
  onNavigate?: () => void
  className?: string
}

export function Sidebar({ role, onNavigate, className = '' }: SidebarProps) {
  const mainItems = NAV_ITEMS.filter(
    (item) =>
      item.section === 'main' && canAccessRoute(role, item.key),
  )
  const adminItems = NAV_ITEMS.filter(
    (item) =>
      item.section === 'admin' && canAccessRoute(role, item.key),
  )

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
      isActive
        ? 'bg-white/15 text-white shadow-inner ring-1 ring-brand-gold/40'
        : 'text-white/80 hover:bg-white/10 hover:text-white',
    ].join(' ')

  return (
    <aside
      className={`flex w-64 shrink-0 flex-col border-r border-white/10 bg-brand-navy-dark text-white ${className}`}
    >
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {mainItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/app'}
            onClick={onNavigate}
            className={linkClass}
          >
            <Icon className="h-5 w-5 shrink-0 text-brand-gold-light opacity-90" />
            {label}
          </NavLink>
        ))}

        {adminItems.length > 0 ? (
          <>
            <p className="mt-4 px-3 pt-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
              {ADMIN_SECTION_LABEL}
            </p>
            {adminItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={onNavigate}
                className={linkClass}
              >
                <Icon className="h-5 w-5 shrink-0 text-brand-gold-light opacity-90" />
                {label}
              </NavLink>
            ))}
          </>
        ) : null}
      </nav>
      <p className="border-t border-white/10 px-4 py-3 text-xs text-white/50">
        Sistem Informasi Disiplin &amp; Absensi
      </p>
    </aside>
  )
}
