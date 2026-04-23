import { useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { canAccessRoute, type AppRouteKey } from './lib/permissions'
import { useAuthStore } from './store/authStore'
import { AdminGuruPage } from './pages/admin/AdminGuruPage'
import { AdminKelasPage } from './pages/admin/AdminKelasPage'
import { AdminJadwalPiketPage } from './pages/admin/AdminJadwalPiketPage'
import { AdminPembimbingLombaPage } from './pages/admin/AdminPembimbingLombaPage'
import { AdminWaliKelasPage } from './pages/admin/AdminWaliKelasPage'
import { AdminKoordinatorKokurikulerPage } from './pages/admin/AdminKoordinatorKokurikulerPage'
import { AdminPelanggaranPage } from './pages/admin/AdminPelanggaranPage'
import { AdminSiswaPage } from './pages/admin/AdminSiswaPage'
import { DashboardPage } from './pages/DashboardPage'
import { EAbsenPage } from './pages/EAbsenPage'
import { EJurnalPage } from './pages/EJurnalPage'
import { LoginPage } from './pages/LoginPage'
import { ModePiketPage } from './pages/ModePiketPage'
import { PenebusanPoinPage } from './pages/PenebusanPoinPage'
import { ProfilePage } from './pages/ProfilePage'
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage'
import { KegiatanLombaPage } from './pages/KegiatanLombaPage'
import { KokurikulerOperasionalPage } from './pages/KokurikulerOperasionalPage'
import { KelasSayaPage } from './pages/KelasSayaPage'
import { ManajemenTugasPage } from './pages/ManajemenTugasPage'
import { TugasSayaPage } from './pages/TugasSayaPage'
import { ToastHost } from './components/ui/ToastHost'
import { useUiStore } from './store/uiStore'
import { AdminTugasPage } from './pages/admin/AdminTugasPage'

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
  const showToast = useUiStore((s) => s.showToast)
  const allowed = user ? canAccessRoute(user, routeKey) : false
  useEffect(() => {
    if (
      user &&
      !allowed &&
      routeKey === 'eprestasi' &&
      user.role === 'guru_mapel'
    ) {
      showToast('Fitur tidak bisa diakses karena Anda bukan pembimbing lomba.', 'error')
    }
    if (
      user &&
      !allowed &&
      routeKey === 'kokurikuler_operasional' &&
      user.role === 'guru_mapel'
    ) {
      showToast('Fitur tidak bisa diakses karena Anda bukan koordinator kokurikuler.', 'error')
    }
  }, [allowed, routeKey, showToast, user])
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
            path="e-jurnal"
            element={
              <RequireModule routeKey="ejurnal">
                <EJurnalPage />
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
            path="kokurikuler"
            element={
              <RequireModule routeKey="kokurikuler_operasional">
                <KokurikulerOperasionalPage />
              </RequireModule>
            }
          />
          <Route
            path="kelas-saya"
            element={
              <RequireModule routeKey="kelas_saya">
                <KelasSayaPage />
              </RequireModule>
            }
          />
          <Route
            path="manajemen-tugas"
            element={
              <RequireModule routeKey="manajemen_tugas">
                <ManajemenTugasPage />
              </RequireModule>
            }
          />
          <Route
            path="tugas-saya"
            element={
              <RequireModule routeKey="tugas_saya">
                <TugasSayaPage />
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
            path="admin/pembimbing-lomba"
            element={
              <RequireModule routeKey="admin_pembimbing_lomba">
                <AdminPembimbingLombaPage />
              </RequireModule>
            }
          />
          <Route
            path="admin/wali-kelas"
            element={
              <RequireModule routeKey="admin_walikelas">
                <AdminWaliKelasPage />
              </RequireModule>
            }
          />
          <Route
            path="admin/koordinator-kokurikuler"
            element={
              <RequireModule routeKey="admin_koordinator_kokurikuler">
                <AdminKoordinatorKokurikulerPage />
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
          <Route
            path="admin/tugas"
            element={
              <RequireModule routeKey="admin_tugas">
                <AdminTugasPage />
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
