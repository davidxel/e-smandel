export type UserRole =
  | 'super_admin'
  | 'kepsek'
  | 'kesiswaan'
  | 'bk'
  | 'guru_piket'
  | 'guru_mapel'
  | 'guru_pembimbing'
  | 'siswa'

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  kepsek: 'Kepala Sekolah',
  kesiswaan: 'Kesiswaan',
  bk: 'Bimbingan Konseling',
  guru_piket: 'Guru Piket',
  guru_mapel: 'Guru Mapel',
  guru_pembimbing: 'Guru Pembimbing',
  siswa: 'Siswa',
}
