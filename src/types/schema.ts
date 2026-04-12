import type { UserRole } from './roles'

/** Akun pengguna: staff memakai NIP, siswa memakai NISN untuk identitas & login */
export type User = {
  id: string
  name: string
  role: UserRole
  password: string
  /** NIP — wajib diisi untuk peran non-siswa (guru/staff) */
  nip: string | null
  /** NISN — wajib diisi untuk peran siswa */
  nisn: string | null
  /** Jabatan (staff) atau boleh kosong untuk siswa */
  jabatan: string | null
  profilePhotoDataUrl: string | null
}

/** Pengguna terautentikasi (tanpa kata sandi) */
export type AuthUser = Omit<User, 'password'>

export type PrestasiStatus = 'normal' | 'lomba' | 'karantina_lomba'

export type Student = {
  id: string
  userId: string
  classId: string
  totalPoints: number
  statusPrestasi: PrestasiStatus
}

export type ClassRoom = {
  id: string
  name: string
}

export type ViolationCategory = 'ringan' | 'sedang' | 'berat'

export type ViolationMaster = {
  id: string
  name: string
  points: number
  category: ViolationCategory
  /** `bolos` dipakai sistem absensi; tidak boleh dihapus */
  slug: string
}

export type AttendanceStatus = 'H' | 'S' | 'I' | 'A' | 'Bolos' | 'Dispensasi'

export type Attendance = {
  id: string
  studentId: string
  teacherId: string
  date: string
  period: number
  status: AttendanceStatus
}

/** Audit trail perubahan poin (siapa, kapan, alasan) */
export type PointHistory = {
  id: string
  studentId: string
  changerId: string
  pointsChanged: number
  reason: string
  timestamp: string
  source: 'absensi' | 'pelanggaran' | 'reward' | 'admin' | 'import'
}

export type DispensationType = 'sakit' | 'izin' | 'lomba' | 'lainnya'

export type Dispensation = {
  id: string
  studentId: string
  type: DispensationType
  startDate: string
  endDate: string
  description: string
}

/** @deprecated gunakan PointHistory */
export type PointLog = PointHistory
