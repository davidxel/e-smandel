import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { canAccessRoute, type AppRouteKey } from './lib/permissions'
import { useAuthStore } from './store/authStore'
import { AdminGuruPage } from './pages/admin/AdminGuruPage'
import { AdminKelasPage } from './pages/admin/AdminKelasPage'
import { AdminJadwalPiketPage } from './pages/admin/AdminJadwalPiketPage'
import { AdminPelanggaranPage } from './pages/admin/AdminPelanggaranPage'
import { AdminSiswaPage } from './pages/admin/AdminSiswaPage'
import { DashboardPage } from './pages/DashboardPage'
import { EAbsenPage } from './pages/EAbsenPage'
import { LoginPage } from './pages/LoginPage'
import { ModePiketPage } from './pages/ModePiketPage'
import { PenebusanPoinPage } from './pages/PenebusanPoinPage'
import { ProfilePage } from './pages/ProfilePage'
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage'
import { KegiatanLombaPage } from './pages/KegiatanLombaPage'
import { ToastHost } from './components/ui/ToastHost'

function ProtectedLayout() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/" replace />
  return <AppLayout />
}

function RequireModule({
  routeKey,
  children,
}: {
  routeKey: AppRouteKey
  children: ReactNode
}) {
  const user = useAuthStore((s) => s.user)
  const loc = useLocation()
  const allowed = user ? canAccessRoute(user, routeKey) : false
  // #region agent log
  fetch('http://127.0.0.1:7923/ingest/5ca3b835-f44b-49b1-84e7-96e4128da844', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'd9b12b',
    },
    body: JSON.stringify({
      sessionId: 'd9b12b',
      hypothesisId: 'H1-H4-H5',
      location: 'App.tsx:RequireModule',
      message: 'RequireModule gate',
      data: {
        routeKey,
        pathname: loc.pathname,
        userPresent: !!user,
        role: user?.role,
        allowed,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
  if (!user) return <Navigate to="/" replace />
  if (!allowed) return <Navigate to="/app" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/app" element={<ProtectedLayout />}>
          <Route index element={<DashboardPage />} />
          <Route
            path="profil"
            element={
              <RequireModule routeKey="profil">
                <ProfilePage />
              </RequireModule>
            }
          />
          <Route
            path="e-poin"
            element={
              <RequireModule routeKey="mode_piket">
                <ModePiketPage />
              </RequireModule>
            }
          />
          <Route
            path="mode-piket"
            element={<Navigate to="/app/e-poin" replace />}
          />
          <Route
            path="e-absen"
            element={
              <RequireModule routeKey="eabsen">
                <EAbsenPage />
              </RequireModule>
            }
          />
          <Route
            path="eprestasi"
            element={
              <RequireModule routeKey="eprestasi">
                <KegiatanLombaPage />
              </RequireModule>
            }
          />
          <Route
            path="laporan"
            element={
              <RequireModule routeKey="laporan">
                <ModulePlaceholderPage
                  title="Laporan"
                  description="Ekspor PDF Surat Peringatan (BK) dan Rekap Absen (Kepsek) akan tersedia di sini."
                />
              </RequireModule>
            }
          />
          <Route
            path="penebusan-poin"
            element={
              <RequireModule routeKey="penebusan_poin">
                <PenebusanPoinPage />
              </RequireModule>
            }
          />
          <Route
            path="admin/siswa"
            element={
              <RequireModule routeKey="admin_siswa">
                <AdminSiswaPage />
              </RequireModule>
            }
          />
          <Route
            path="admin/guru"
            element={
              <RequireModule routeKey="admin_guru">
                <AdminGuruPage />
              </RequireModule>
            }
          />
          <Route
            path="admin/pelanggaran"
            element={
              <RequireModule routeKey="admin_pelanggaran">
                <AdminPelanggaranPage />
              </RequireModule>
            }
          />
          <Route
            path="admin/jadwal-piket"
            element={
              <RequireModule routeKey="admin_jadwal_piket">
                <AdminJadwalPiketPage />
              </RequireModule>
            }
          />
          <Route
            path="admin/kelas"
            element={
              <RequireModule routeKey="admin_kelas">
                <AdminKelasPage />
              </RequireModule>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastHost />
    </>
  )
}
