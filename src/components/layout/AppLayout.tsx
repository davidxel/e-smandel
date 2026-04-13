import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
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

  if (!user) return null

  const handleLogout = () => {
    logout()
    showToast('Anda telah keluar.', 'info')
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar user={user} />
      </div>

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
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
