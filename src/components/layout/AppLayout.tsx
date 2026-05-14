import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { PanelLeftOpen } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUiStore } from '../../store/uiStore'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const showToast = useUiStore((s) => s.showToast)
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false)

  if (!user) return null

  const handleLogout = () => {
    logout()
    showToast('Anda telah keluar.', 'info')
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <a
        href="#main-content"
        className="sr-only left-4 top-4 z-[60] rounded-lg bg-brand-navy px-3 py-2 text-sm font-medium text-white shadow focus:not-sr-only focus:absolute focus:outline-none focus:ring-2 focus:ring-brand-gold"
      >
        Lompat ke isi utama
      </a>
      {/* Desktop sidebar */}
      <div
        className={[
          'relative hidden md:block shrink-0 transition-[width] duration-200 ease-out',
          desktopSidebarCollapsed ? 'w-0' : 'w-64',
        ].join(' ')}
      >
        <div
          className={[
            'absolute left-0 top-0 h-full w-64 transform transition-transform duration-200 ease-out',
            desktopSidebarCollapsed ? '-translate-x-full' : 'translate-x-0',
          ].join(' ')}
        >
          <Sidebar user={user} className="h-full" />
        </div>
      </div>

      {desktopSidebarCollapsed ? (
        <button
          type="button"
          onClick={() => setDesktopSidebarCollapsed(false)}
          className="fixed left-2 top-20 z-30 hidden md:inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-brand-navy text-white shadow-md hover:bg-brand-navy-dark"
          aria-label="Tampilkan sidebar"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      ) : null}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-black/50 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          aria-label="Tutup menu"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`absolute left-0 top-0 h-full w-[min(85vw,18rem)] transform shadow-xl transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <Sidebar
            user={user}
            onNavigate={() => setMobileOpen(false)}
            className="h-full"
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          user={user}
          onMenuClick={() => setMobileOpen(true)}
          sidebarCollapsed={desktopSidebarCollapsed}
          onToggleSidebar={() => setDesktopSidebarCollapsed((v) => !v)}
          onLogout={handleLogout}
        />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-auto p-4 md:p-6 outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
