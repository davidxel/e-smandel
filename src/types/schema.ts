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
  /** Daftar kelas/rombel yang diajar (ditetapkan kurikulum) */
  taught_class_ids: string[]
  /** Flag dinamis: guru menjadi koordinator projek kokurikuler */
  isKokurikulerCoordinator: boolean
  profilePhotoDataUrl: string | null
}

/** Pengguna terautentikasi (tanpa kata sandi) */
export type AuthUser = Omit<User, 'password'>

export type PrestasiStatus = 'normal' | 'lomba' | 'karantina_lomba'

export type StudentDapodikProfile = {
  no: string
  namaLengkap: string
  nipd: string
  jk: string
  nisn: string
  tempatLahir: string
  tanggalLahir: string
  nik: string
  agama: string
  alamat: string
  rt: string
  rw: string
  dusun: string
  kelurahan: string
  kecamatan: string
  kodePos: string
  jenisTinggal: string
  alatTransportasi: string
  telepon: string
  hp: string
  email: string
  skhun: string
  penerimaKps: string
  nomorKps: string
  dataAyah: {
    nama: string
    tahunLahir: string
    pendidikan: string
    pekerjaan: string
    penghasilan: string
    nik: string
  }
  dataIbu: {
    nama: string
    tahunLahir: string
    pendidikan: string
    pekerjaan: string
    penghasilan: string
    nik: string
  }
  dataWali: {
    nama: string
    tahunLahir: string
    pendidikan: string
    pekerjaan: string
    penghasilan: string
    nik: string
  }
  rombelSaatIni: string
  nomorPesertaUjianNasional: string
  nomorSeriIjazah: string
  penerimaKip: string
  nomorKip: string
  namaDiKip: string
  nomorKks: string
  nomorRegistrasiAktaLahir: string
  bank: string
  nomorRekeningBank: string
  rekeningAtasNama: string
  layakPip: string
  alasanLayakPip: string
  kebutuhanKhusus: string
  sekolahAsal: string
  anakKeBerapa: string
  lintang: string
  bujur: string
  noKk: string
  beratBadan: string
  tinggiBadan: string
  lingkarKepala: string
  jumlahSaudaraKandung: string
  jarakRumahKeSekolahKm: string
}

export type StudentHealthConditionKey =
  | 'alergi'
  | 'tbc'
  | 'sakit_kuning'
  | 'hati'
  | 'jantung'
  | 'geger_otak'
  | 'typus'
  | 'maag'
  | 'mata'
  | 'epilepsi'
  | 'kecelakaan'

export type StudentHealthConditionRecord = {
  checked: boolean
  year: string
}

export type StudentHealthHistory = {
  conditions: Record<StudentHealthConditionKey, StudentHealthConditionRecord>
  otherConditionName: string
  otherConditionChecked: boolean
  otherConditionYear: string
}

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
  dapodikProfile?: StudentDapodikProfile | null
  /** Kolom tambahan impor Dapodik (indeks kolom 0-based → nilai sel), disinkron ke tabel `student_details`. */
  dapodikExtraColumns?: Record<string, string> | null
  healthHistory: StudentHealthHistory
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

export type EpoinRecommendationStatus = 'pending' | 'approved' | 'rejected'

export type EpoinRecommendation = {
  id: string
  studentId: string
  violationId: string
  recommenderId: string
  note: string
  status: EpoinRecommendationStatus
  processedBy: string | null
  processedAt: string | null
  agreementLetterFileDataUrl: string | null
  parentStatementFileDataUrl: string | null
  createdAt: string
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

/** Status tindak lanjut kasus (dashboard BK & ringkasan wali) */
export type CounselingCaseStatus = 'perlu_penanganan' | 'sedang_dibimbing' | 'selesai'

export type CounselingSessionType = 'individu' | 'kelompok'

export type SpLevel = 'SP1' | 'SP2' | 'SP3'

/** Log bimbingan konseling (tersimpan di MySQL, bukan workspace JSON) */
export type CounselingLog = {
  id: string
  studentId: string
  counselorId: string
  date: string
  sessionNo: number
  sessionType: CounselingSessionType
  analysis: string
  actionPlan: string
  status: CounselingCaseStatus
  attachmentUrl: string | null
  createdAt: string
}

export type SpRecord = {
  id: string
  studentId: string
  spLevel: SpLevel
  issueDate: string
  fileUrl: string
  issuedByUserId: string
  createdAt: string
}
