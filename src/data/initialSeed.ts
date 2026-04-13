import type { UserRole } from '../types/roles'
import type {
  Attendance,
  ClassRoom,
  CompetitionEntry,
  CompetitionStatusHistory,
  PointHistory,
  PointRedemption,
  PointRedemptionRequest,
  Student,
  User,
  ViolationMaster,
} from '../types/schema'

export const GURU_STAFF_ROLES: UserRole[] = [
  'kepsek',
  'bk',
  'guru_piket',
  'guru_mapel',
  'guru_pembimbing',
]

export const BOLOS_VIOLATION_SLUG = 'bolos'

export function buildInitialClasses(): ClassRoom[] {
  return [
    { id: 'cls-x-ipa-1', name: 'X IPA 1' },
    { id: 'cls-x-ipa-2', name: 'X IPA 2' },
    { id: 'cls-xi-ips-2', name: 'XI IPS 2' },
    { id: 'cls-xii-ipa-1', name: 'XII IPA 1' },
  ]
}

export function buildInitialViolations(): ViolationMaster[] {
  return [
    {
      id: 'v-bolos',
      name: 'Bolos (tanpa keterangan)',
      points: 10,
      category: 'sedang',
      slug: BOLOS_VIOLATION_SLUG,
    },
    {
      id: 'v-terlambat',
      name: 'Terlambat masuk sekolah',
      points: 2,
      category: 'ringan',
      slug: 'terlambat',
    },
    {
      id: 'v-atribut',
      name: 'Atribut tidak lengkap',
      points: 3,
      category: 'ringan',
      slug: 'atribut',
    },
    {
      id: 'v-handphone',
      name: 'Membawa HP tanpa izin',
      points: 15,
      category: 'berat',
      slug: 'handphone',
    },
  ]
}

export function buildInitialUsers(): User[] {
  return [
    {
      id: 'u1',
      name: 'Admin Sistem',
      role: 'super_admin',
      password: 'demo123',
      nip: 'SA000001',
      nisn: null,
      jabatan: 'Pengelola Sistem',
      isPiket: false,
      piketScheduleDays: [],
      profilePhotoDataUrl: null,
    },
    {
      id: 'u2',
      name: 'Dr. Ahmad Wijaya, M.Pd.',
      role: 'kepsek',
      password: 'demo123',
      nip: '196001011980031001',
      nisn: null,
      jabatan: 'Kepala Sekolah',
      isPiket: false,
      piketScheduleDays: [],
      profilePhotoDataUrl: null,
    },
    {
      id: 'u3',
      name: 'Siti Rahayu, S.Pd.',
      role: 'kesiswaan',
      password: 'demo123',
      nip: '198502152010012002',
      nisn: null,
      jabatan: 'Kepala Urusan Kesiswaan',
      isPiket: false,
      piketScheduleDays: [],
      profilePhotoDataUrl: null,
    },
    {
      id: 'u4',
      name: 'Budi Santoso, S.Psi.',
      role: 'bk',
      password: 'demo123',
      nip: '198803102012031003',
      nisn: null,
      jabatan: 'Guru BK',
      isPiket: false,
      piketScheduleDays: [],
      profilePhotoDataUrl: null,
    },
    {
      id: 'u5',
      name: 'Dewi Lestari, S.Pd.',
      role: 'guru_piket',
      password: 'demo123',
      nip: '199001202014042004',
      nisn: null,
      jabatan: 'Guru Piket',
      isPiket: true,
      piketScheduleDays: [1, 2, 3, 4, 5],
      profilePhotoDataUrl: null,
    },
    {
      id: 'u6',
      name: 'Rina Kartika, S.Pd.',
      role: 'guru_mapel',
      password: 'demo123',
      nip: '199204052016052005',
      nisn: null,
      jabatan: 'Guru Mapel Matematika',
      isPiket: false,
      piketScheduleDays: [2],
      profilePhotoDataUrl: null,
    },
    {
      id: 'u7',
      name: 'Eko Prasetyo, S.Pd.',
      role: 'guru_pembimbing',
      password: 'demo123',
      nip: '198712012011062006',
      nisn: null,
      jabatan: 'Guru Pembimbing OSIS',
      isPiket: false,
      piketScheduleDays: [],
      profilePhotoDataUrl: null,
    },
    {
      id: 'u8',
      name: 'Andi Pratama',
      role: 'siswa',
      password: 'demo123',
      nip: null,
      nisn: '0012345678',
      jabatan: null,
      isPiket: false,
      piketScheduleDays: [],
      profilePhotoDataUrl: null,
    },
  ]
}

export function buildInitialStudents(): Student[] {
  return [
    {
      id: 's1',
      userId: 'u8',
      classId: 'cls-x-ipa-1',
      totalPoints: 0,
      statusPrestasi: 'normal',
      parentName: 'Bapak Pratama',
      parentPhone: '081234567890',
      studentPhone: '081298765432',
      gender: 'L',
    },
    {
      id: 's2',
      userId: 'u-dummy-1',
      classId: 'cls-x-ipa-1',
      totalPoints: 0,
      statusPrestasi: 'lomba',
      parentName: 'Ibu Santoso',
      parentPhone: '081355500001',
      studentPhone: '081355500002',
      gender: 'L',
    },
    {
      id: 's3',
      userId: 'u-dummy-2',
      classId: 'cls-xi-ips-2',
      totalPoints: 0,
      statusPrestasi: 'normal',
      parentName: 'Ibu Dewi',
      parentPhone: '081366600001',
      studentPhone: '081366600002',
      gender: 'P',
    },
  ]
}

/** User dummy agar siswa s2/s3 tampil di absensi — tanpa akun login */
export function buildPlaceholderStudentUsers(): User[] {
  return [
    {
      id: 'u-dummy-1',
      name: 'Budi Santoso (Siswa)',
      role: 'siswa',
      password: 'x',
      nip: null,
      nisn: '0087654321',
      jabatan: null,
      isPiket: false,
      piketScheduleDays: [],
      profilePhotoDataUrl: null,
    },
    {
      id: 'u-dummy-2',
      name: 'Citra Dewi',
      role: 'siswa',
      password: 'x',
      nip: null,
      nisn: '0099887766',
      jabatan: null,
      isPiket: false,
      piketScheduleDays: [],
      profilePhotoDataUrl: null,
    },
  ]
}

export function buildInitialAttendance(): Attendance[] {
  return []
}

export function buildInitialPointHistory(): PointHistory[] {
  return []
}

export function buildInitialPointRedemptions(): PointRedemption[] {
  return []
}

export function buildInitialPointRedemptionRequests(): PointRedemptionRequest[] {
  return []
}

export function buildInitialCompetitions(): CompetitionEntry[] {
  return []
}

export function buildInitialCompetitionStatusHistory(): CompetitionStatusHistory[] {
  return []
}
