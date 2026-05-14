import { NavLink } from 'react-router-dom'
import { NAV_ITEMS, NAV_SECTION_LABELS } from '../../lib/nav'
import { canAccessRoute, isPiketActive } from '../../lib/permissions'
import type { AuthUser } from '../../types/schema'

type SidebarProps = {
  user: AuthUser
  onNavigate?: () => void
  className?: string
}

export function Sidebar({ user, onNavigate, className = '' }: SidebarProps) {
  const sectionOrder: Array<NonNullable<(typeof NAV_ITEMS)[number]['section']>> = [
    'ringkasan',
    'manajemen_guru',
    'epoin_bk',
    'administrasi',
  ]
  const sectionedItems = sectionOrder
    .map((section) => ({
      section,
      items: NAV_ITEMS.filter(
        (item) => item.section === section && canAccessRoute(user, item.key),
      ),
    }))
    .filter((x) => x.items.length > 0)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
      isActive
        ? 'bg-white/15 text-white shadow-inner ring-1 ring-brand-gold/40'
        : 'text-white/80 hover:bg-white/10 hover:text-white',
    ].join(' ')

  const resolveLabel = (key: string, label: string) => {
    if (key === 'mode_piket' && isPiketActive(user)) return 'e-Piket'
    return label
  }

  return (
    <aside
      className={`flex w-64 shrink-0 flex-col border-r border-white/10 bg-brand-navy-dark text-white ${className}`}
    >
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {sectionedItems.map(({ section, items }) => (
          <div key={section}>
            <p className="mt-4 px-3 pt-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
              {NAV_SECTION_LABELS[section]}
            </p>
            {items.map(({ key, path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/app'}
                onClick={onNavigate}
                className={linkClass}
              >
                <Icon className="h-5 w-5 shrink-0 text-brand-gold-light opacity-90" />
                {resolveLabel(key, label)}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <p className="border-t border-white/10 px-4 py-3 text-xs text-white/50">
        Sistem Informasi Disiplin &amp; Absensi
      </p>
    </aside>
  )
}
