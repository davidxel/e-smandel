export type UserRole =
  | 'super_admin'
  | 'kepsek'
  | 'kesiswaan'
  | 'kurikulum'
  | 'bk'
  | 'guru_piket'
  | 'guru_mapel'
  | 'siswa'

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  kepsek: 'Kepala Sekolah',
  kesiswaan: 'Kesiswaan',
  kurikulum: 'Kurikulum',
  bk: 'Bimbingan Konseling',
  guru_piket: 'Guru Piket',
  guru_mapel: 'Guru',
  siswa: 'Siswa',
}
