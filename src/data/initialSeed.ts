import type { UserRole } from '../types/roles'
import type {
  Assignment,
  Attendance,
  ClassRoom,
  CompetitionEntry,
  CompetitionStatusHistory,
  TeachingJournal,
  PointHistory,
  PointRedemption,
  PointRedemptionRequest,
  GuestVisit,
  KbmLog,
  LateArrival,
  Student,
  StudentAssignment,
  User,
  ViolationMaster,
} from '../types/schema'

export const GURU_STAFF_ROLES: UserRole[] = [
  'kepsek',
  'kurikulum',
  'bk',
  'guru_piket',
  'guru_mapel',
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
      isCompetitionMentor: false,
      is_walikelas: false,
      managed_class_id: null,
      isKokurikulerCoordinator: false,
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
      isCompetitionMentor: false,
      is_walikelas: false,
      managed_class_id: null,
      isKokurikulerCoordinator: false,
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
      isCompetitionMentor: false,
      is_walikelas: false,
      managed_class_id: null,
      isKokurikulerCoordinator: false,
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
      isCompetitionMentor: false,
      is_walikelas: false,
      managed_class_id: null,
      isKokurikulerCoordinator: false,
      profilePhotoDataUrl: null,
    },
    {
      id: 'u5',
      name: 'Nina Kurniawati, M.Pd.',
      role: 'kurikulum',
      password: 'demo123',
      nip: '198909102013022010',
      nisn: null,
      jabatan: 'Wakil Kurikulum',
      isPiket: false,
      piketScheduleDays: [],
      isCompetitionMentor: false,
      is_walikelas: false,
      managed_class_id: null,
      isKokurikulerCoordinator: false,
      profilePhotoDataUrl: null,
    },
    {
      id: 'u6',
      name: 'Rina Kartika, S.Pd.',
      role: 'guru_mapel',
      password: 'demo123',
      nip: '199204052016052005',
      nisn: null,
      jabatan: 'Guru Matematika',
      isPiket: false,
      piketScheduleDays: [2],
      isCompetitionMentor: false,
      is_walikelas: true,
      managed_class_id: 'cls-x-ipa-1',
      isKokurikulerCoordinator: false,
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
      isCompetitionMentor: false,
      is_walikelas: false,
      managed_class_id: null,
      isKokurikulerCoordinator: false,
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
      isCompetitionMentor: false,
      is_walikelas: false,
      managed_class_id: null,
      isKokurikulerCoordinator: false,
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
      isCompetitionMentor: false,
      is_walikelas: false,
      managed_class_id: null,
      isKokurikulerCoordinator: false,
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

export function buildInitialAssignments(): Assignment[] {
  return []
}

export function buildInitialStudentAssignments(): StudentAssignment[] {
  return []
}

export function buildInitialTeachingJournals(): TeachingJournal[] {
  return []
}

export function buildInitialLateArrivals(): LateArrival[] {
  return []
}

export function buildInitialGuestVisits(): GuestVisit[] {
  return []
}

export function buildInitialKbmLogs(): KbmLog[] {
  return []
}
