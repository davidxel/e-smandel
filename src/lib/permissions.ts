import type { UserRole } from '../types/roles'
import type { AuthUser } from '../types/schema'

export type AppRouteKey =
  | 'dashboard'
  | 'profil'
  | 'epoin'
  | 'eabsen'
  | 'ejurnal'
  | 'eprestasi'
  | 'kokurikuler_operasional'
  | 'kelas_saya'
  | 'manajemen_tugas'
  | 'tugas_saya'
  | 'laporan'
  | 'admin_siswa'
  | 'admin_guru'
  | 'admin_pelanggaran'
  | 'admin_kelas'
  | 'admin_jadwal_piket'
  | 'admin_pembimbing_lomba'
  | 'admin_walikelas'
  | 'admin_koordinator_kokurikuler'
  | 'admin_tugas'
  | 'mode_piket'
  | 'penebusan_poin'

const ROLE_ROUTE_MATRIX: Record<UserRole, AppRouteKey[]> = {
  super_admin: [
    'dashboard',
    'profil',
    'epoin',
    'eabsen',
    'ejurnal',
    'eprestasi',
    'kokurikuler_operasional',
    'kelas_saya',
    'manajemen_tugas',
    'tugas_saya',
    'laporan',
    'admin_siswa',
    'admin_guru',
    'admin_pelanggaran',
    'admin_kelas',
    'admin_jadwal_piket',
    'admin_pembimbing_lomba',
    'admin_walikelas',
    'admin_koordinator_kokurikuler',
    'admin_tugas',
  ],
  kepsek: ['dashboard', 'profil', 'laporan'],
  kesiswaan: [
    'dashboard',
    'profil',
    'epoin',
    'eabsen',
    'ejurnal',
    'eprestasi',
    'kelas_saya',
    'admin_tugas',
    'laporan',
    'admin_siswa',
    'admin_guru',
    'admin_pelanggaran',
    'admin_kelas',
    'admin_pembimbing_lomba',
    'admin_walikelas',
  ],
  kurikulum: [
    'dashboard',
    'profil',
    'kokurikuler_operasional',
    'ejurnal',
    'admin_jadwal_piket',
    'admin_walikelas',
    'admin_koordinator_kokurikuler',
  ],
  bk: ['dashboard', 'profil', 'epoin', 'laporan'],
  guru_piket: ['dashboard', 'profil', 'epoin', 'ejurnal'],
  guru_mapel: ['dashboard', 'profil', 'eabsen', 'ejurnal', 'kelas_saya', 'manajemen_tugas'],
  siswa: ['dashboard', 'profil', 'tugas_saya'],
}

export function isPiketActive(user: AuthUser): boolean {
  const today = new Date().getDay()
  const hasScheduleToday = (user.piketScheduleDays ?? []).includes(today)
  const onFlag = !!user.isPiket
  if (user.role === 'guru_piket') return true
  if (user.role === 'guru_mapel') return onFlag || hasScheduleToday
  return onFlag
}

export function canAccessRoute(user: AuthUser, key: AppRouteKey): boolean {
  const piketActive = isPiketActive(user)
  if (user.role === 'super_admin') return true
  if (user.role === 'bk' && (key === 'mode_piket' || key === 'penebusan_poin')) {
    return true
  }
  if (user.role === 'siswa' && key === 'penebusan_poin') return true
  if (key === 'eprestasi') {
    if (user.role === 'kesiswaan') return true
    if (user.role === 'guru_mapel') return !!user.isCompetitionMentor
    return false
  }
  if (key === 'kelas_saya') {
    return (
      user.role === 'guru_mapel' &&
      !!user.is_walikelas &&
      !!user.managed_class_id
    )
  }
  if (key === 'kokurikuler_operasional') {
    if (user.role === 'kurikulum') return true
    if (user.role === 'guru_mapel') return !!user.isKokurikulerCoordinator
    return false
  }
  if (key === 'mode_piket') {
    return piketActive || ROLE_ROUTE_MATRIX[user.role].includes('epoin')
  }
  if (key === 'penebusan_poin') return piketActive
  return ROLE_ROUTE_MATRIX[user.role].includes(key)
}

export function isAdminRouteKey(key: AppRouteKey): boolean {
  return (
    key === 'admin_siswa' ||
    key === 'admin_guru' ||
    key === 'admin_pelanggaran' ||
    key === 'admin_kelas' ||
    key === 'admin_jadwal_piket' ||
    key === 'admin_pembimbing_lomba' ||
    key === 'admin_walikelas' ||
    key === 'admin_koordinator_kokurikuler' ||
    key === 'admin_tugas'
  )
}
