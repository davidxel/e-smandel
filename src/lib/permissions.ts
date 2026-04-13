import type { UserRole } from '../types/roles'
import type { AuthUser } from '../types/schema'

export type AppRouteKey =
  | 'dashboard'
  | 'profil'
  | 'epoin'
  | 'eabsen'
  | 'eprestasi'
  | 'laporan'
  | 'admin_siswa'
  | 'admin_guru'
  | 'admin_pelanggaran'
  | 'admin_kelas'
  | 'admin_jadwal_piket'
  | 'mode_piket'
  | 'penebusan_poin'

const ROLE_ROUTE_MATRIX: Record<UserRole, AppRouteKey[]> = {
  super_admin: [
    'dashboard',
    'profil',
    'epoin',
    'eabsen',
    'eprestasi',
    'laporan',
    'admin_siswa',
    'admin_guru',
    'admin_pelanggaran',
    'admin_kelas',
    'admin_jadwal_piket',
  ],
  kepsek: ['dashboard', 'profil', 'laporan'],
  kesiswaan: [
    'dashboard',
    'profil',
    'epoin',
    'eabsen',
    'eprestasi',
    'laporan',
    'admin_siswa',
    'admin_guru',
    'admin_pelanggaran',
    'admin_kelas',
  ],
  bk: ['dashboard', 'profil', 'epoin', 'laporan'],
  guru_piket: ['dashboard', 'profil', 'epoin'],
  guru_mapel: ['dashboard', 'profil', 'eabsen'],
  guru_pembimbing: ['dashboard', 'profil', 'eprestasi'],
  siswa: ['dashboard', 'profil'],
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
  // #region agent log
  const matrixRow = ROLE_ROUTE_MATRIX[user.role]
  const piketActive = isPiketActive(user)
  fetch('http://127.0.0.1:7923/ingest/5ca3b835-f44b-49b1-84e7-96e4128da844', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'd9b12b',
    },
    body: JSON.stringify({
      sessionId: 'd9b12b',
      hypothesisId: 'H1-H2',
      location: 'permissions.ts:canAccessRoute',
      message: 'canAccessRoute pre-check',
      data: {
        role: user.role,
        piketActive,
        key,
        hasRow: Array.isArray(matrixRow),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
  if (user.role === 'super_admin') return true
  if (user.role === 'bk' && (key === 'mode_piket' || key === 'penebusan_poin')) {
    return true
  }
  if (user.role === 'siswa' && key === 'penebusan_poin') return true
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
    key === 'admin_jadwal_piket'
  )
}
