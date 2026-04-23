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
  /** Flag dinamis: user sedang bertugas piket hari ini */
  isPiket: boolean
  /** Jadwal piket berbasis hari: 0=Mingu ... 6=Sabtu */
  piketScheduleDays: number[]
  /** Flag dinamis: guru ditugaskan sebagai pembimbing lomba */
  isCompetitionMentor: boolean
  /** Flag dinamis: guru menjadi wali kelas */
  is_walikelas: boolean
  /** Kelas yang diampu sebagai wali kelas */
  managed_class_id: string | null
  /** Flag dinamis: guru menjadi koordinator projek kokurikuler */
  isKokurikulerCoordinator: boolean
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
  parentName: string
  parentPhone: string
  studentPhone: string
  gender: 'L' | 'P'
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
  source:
    | 'absensi'
    | 'pelanggaran'
    | 'prestasi'
    | 'reward'
    | 'admin'
    | 'import'
    | 'penebusan'
}

export type PointRedemption = {
  id: string
  studentId: string
  teacherId: string
  activityType: string
  pointsRestored: number
  proofPhotoDataUrl: string
  timestamp: string
}

export type PointRedemptionRequestStatus = 'pending' | 'approved' | 'rejected'

export type PointRedemptionRequest = {
  id: string
  studentId: string
  supervisorTeacherId: string
  activityType: string
  requestedPoints: number
  status: PointRedemptionRequestStatus
  requestedAt: string
  approvedAt: string | null
  approvedBy: string | null
  proofPhotoDataUrl: string | null
}

export type CompetitionLevel =
  | 'tingkat_sekolah'
  | 'tingkat_kota'
  | 'tingkat_provinsi_nasional'
  | 'tingkat_internasional'

export type CompetitionStatus = 'karantina_lomba' | 'sedang_lomba' | 'selesai'

export type CompetitionEntry = {
  id: string
  studentId: string
  competitionName: string
  level: CompetitionLevel
  mentorTeacherId: string
  quarantineDate: string
  competitionStartDate: string
  competitionEndDate: string
  status: CompetitionStatus
  updatedAt: string
}

export type CompetitionStatusHistory = {
  id: string
  studentId: string
  competitionId: string
  fromStatus: CompetitionStatus | null
  toStatus: CompetitionStatus
  changedByTeacherId: string
  changedAt: string
  note: string
}

export type WaliKelasNote = {
  id: string
  teacherId: string
  studentId: string
  note: string
  updatedAt: string
}

export type KokurikulerProjectStatus = 'rencana' | 'berjalan' | 'selesai'

export type KokurikulerProject = {
  id: string
  title: string
  description: string
  coordinatorTeacherId: string
  classId: string
  studentIds: string[]
  startDate: string
  endDate: string
  status: KokurikulerProjectStatus
  updatedAt: string
}

export type Assignment = {
  id: string
  teacherId: string
  classId: string
  subject: string
  title: string
  description: string
  dueDate: string
  createdAt: string
}

export type StudentAssignmentStatus =
  | 'belum_mengerjakan'
  | 'sudah_mengerjakan'
  | 'terlambat'

export type StudentAssignment = {
  id: string
  assignmentId: string
  studentId: string
  status: StudentAssignmentStatus
  teacherNote: string
  updatedAt: string
}

export type TeachingJournal = {
  id: string
  teacherId: string
  classId: string
  meetingNumber: number
  date: string
  text: string
  updatedAt: string
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

export type LateArrival = {
  id: string
  /** hari/tanggal ISO (YYYY-MM-DD) */
  date: string
  studentId: string
  /** sinkron dari user.nisn milik siswa */
  nisn: string
  /** snapshot nama saat input (untuk audit) */
  studentName: string
  /** snapshot nama kelas saat input (untuk audit) */
  className: string
  reason: string
  createdByUserId: string
  createdAt: string
  /** optional tindak lanjut: pelanggaran tambahan yang mengurangi poin */
  followUpViolationId: string | null
}

export type GuestVisit = {
  id: string
  /** hari/tanggal ISO (YYYY-MM-DD) */
  date: string
  name: string
  position: string
  purpose: string
  createdByUserId: string
  createdAt: string
}

export type KbmLog = {
  id: string
  /** hari/tanggal ISO (YYYY-MM-DD) */
  date: string
  period: number
  teacherId: string
  teacherName: string
  classId: string
  className: string
  note: string
  createdByUserId: string
  createdAt: string
}

/** @deprecated gunakan PointHistory */
export type PointLog = PointHistory
