import type { UserRole } from '../types/roles'

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

export function canAccessRoute(role: UserRole, key: AppRouteKey): boolean {
  // #region agent log
  const matrixRow = ROLE_ROUTE_MATRIX[role]
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
        role,
        key,
        hasRow: Array.isArray(matrixRow),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
  return ROLE_ROUTE_MATRIX[role].includes(key)
}

export function isAdminRouteKey(key: AppRouteKey): boolean {
  return (
    key === 'admin_siswa' ||
    key === 'admin_guru' ||
    key === 'admin_pelanggaran' ||
    key === 'admin_kelas'
  )
}
