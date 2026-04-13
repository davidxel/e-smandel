import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  BOLOS_VIOLATION_SLUG,
  buildInitialAttendance,
  buildInitialClasses,
  buildInitialCompetitions,
  buildInitialCompetitionStatusHistory,
  buildInitialPointHistory,
  buildInitialPointRedemptions,
  buildInitialPointRedemptionRequests,
  buildInitialStudents,
  buildInitialUsers,
  buildInitialViolations,
  buildPlaceholderStudentUsers,
} from '../data/initialSeed'
import { newId } from '../lib/ids'
import type { UserRole } from '../types/roles'
import type {
  Attendance,
  AttendanceStatus,
  AuthUser,
  ClassRoom,
  CompetitionEntry,
  CompetitionLevel,
  CompetitionStatusHistory,
  CompetitionStatus,
  PointHistory,
  PointRedemption,
  PointRedemptionRequest,
  Student,
  User,
  ViolationMaster,
} from '../types/schema'

export type DataState = {
  users: User[]
  students: Student[]
  classes: ClassRoom[]
  violations: ViolationMaster[]
  attendance: Attendance[]
  pointHistory: PointHistory[]
  pointRedemptions: PointRedemption[]
  pointRedemptionRequests: PointRedemptionRequest[]
  competitions: CompetitionEntry[]
  competitionStatusHistory: CompetitionStatusHistory[]
}

type DataActions = {
  /** Sinkronkan sesi auth dari data terbaru */
  toAuthUser: (u: User) => AuthUser
  findUserForLogin: (credential: string, password: string) => User | null
  getUserById: (id: string) => User | undefined
  updateUser: (id: string, patch: Partial<Omit<User, 'id' | 'password'>> & { password?: string }) => void
  updateSensitiveUserByActor: (
    actorId: string,
    targetUserId: string,
    patch: Pick<User, 'name' | 'nip' | 'nisn'>,
  ) => { ok: boolean; message?: string }
  setPiketSchedule: (userId: string, days: number[]) => void
  addStaffUser: (input: {
    name: string
    nip: string
    role: UserRole
    jabatan: string
    password: string
  }) => User
  deleteUser: (id: string) => void

  getClassById: (id: string) => ClassRoom | undefined
  addClass: (name: string) => ClassRoom
  updateClass: (id: string, name: string) => void
  deleteClass: (id: string) => void

  getStudentByUserId: (userId: string) => Student | undefined
  getStudentById: (id: string) => Student | undefined
  addStudent: (input: {
    name: string
    nisn: string
    classId: string
    password: string
    totalPoints?: number
    parentName?: string
    parentPhone?: string
    studentPhone?: string
    gender?: 'L' | 'P'
  }) => { user: User; student: Student }
  updateStudent: (
    id: string,
    patch: Partial<
      Pick<Student, 'classId' | 'totalPoints' | 'statusPrestasi'> & {
        name?: string
        nisn?: string
        password?: string
        parentName?: string
        parentPhone?: string
        studentPhone?: string
        gender?: 'L' | 'P'
      }
    >,
  ) => void
  deleteStudent: (id: string) => void
  importStudentsFromRows: (
    rows: { nisn: string; name: string; className: string }[],
  ) => { created: number; errors: string[] }

  addViolation: (input: Omit<ViolationMaster, 'id' | 'slug'> & { slug?: string }) => ViolationMaster
  updateViolation: (id: string, patch: Partial<ViolationMaster>) => void
  deleteViolation: (id: string) => void

  getBolosViolation: () => ViolationMaster | undefined
  setAttendanceStatus: (input: {
    studentId: string
    teacherId: string
    date: string
    period: number
    status: AttendanceStatus
  }) => void
  getAttendanceKey: (
    studentId: string,
    date: string,
    period: number,
  ) => Attendance | undefined
  applyQuickViolation: (input: {
    studentId: string
    teacherId: string
    violationId: string
  }) => { ok: boolean; message?: string }
  redeemStudentPoints: (input: {
    studentId: string
    teacherId: string
    activityType: string
    pointsRestored: number
    proofPhotoDataUrl: string
  }) => { ok: boolean; message?: string }
  createRedemptionRequest: (input: {
    studentUserId: string
    activityType: string
    requestedPoints: number
    supervisorTeacherId: string
  }) => { ok: boolean; message?: string }
  approveRedemptionRequest: (input: {
    requestId: string
    approverId: string
    approvedPoints: number
    proofPhotoDataUrl: string
  }) => { ok: boolean; message?: string }
  addAchievementPoints: (input: {
    studentId: string
    teacherId: string
    points: number
    reason: string
  }) => { ok: boolean; message?: string }
  upsertCompetition: (input: {
    studentId: string
    competitionName: string
    level: CompetitionLevel
    mentorTeacherId: string
    status: CompetitionStatus
  }) => { ok: boolean; message?: string }
  deleteCompetition: (id: string) => void
}

function buildFreshState(): DataState {
  const classes = buildInitialClasses()
  return {
    users: [...buildInitialUsers(), ...buildPlaceholderStudentUsers()],
    students: buildInitialStudents(),
    classes,
    violations: buildInitialViolations(),
    attendance: buildInitialAttendance(),
    pointHistory: buildInitialPointHistory(),
    pointRedemptions: buildInitialPointRedemptions(),
    pointRedemptionRequests: buildInitialPointRedemptionRequests(),
    competitions: buildInitialCompetitions(),
    competitionStatusHistory: buildInitialCompetitionStatusHistory(),
  }
}

export const useDataStore = create<DataState & DataActions>()(
  persist(
    (set, get) => ({
      ...buildFreshState(),

      toAuthUser: (u) => {
        const { password: _p, ...rest } = u
        return rest
      },

      findUserForLogin: (credential, password) => {
        const c = credential.trim()
        return (
          get().users.find(
            (u) =>
              u.password === password &&
              (u.nip?.trim() === c || u.nisn?.trim() === c),
          ) ?? null
        )
      },

      getUserById: (id) => get().users.find((u) => u.id === id),

      updateUser: (id, patch) => {
        set((s) => ({
          users: s.users.map((u) =>
            u.id === id
              ? {
                  ...u,
                  ...patch,
                  password: patch.password ?? u.password,
                }
              : u,
          ),
        }))
      },
      updateSensitiveUserByActor: (actorId, targetUserId, patch) => {
        const actor = get().getUserById(actorId)
        const target = get().getUserById(targetUserId)
        if (!actor || !target) return { ok: false, message: 'Pengguna tidak ditemukan.' }
        if (actor.id !== target.id && actor.role !== 'super_admin') {
          return { ok: false, message: 'Tidak diizinkan mengubah data sensitif user lain.' }
        }
        const nextName = patch.name.trim()
        if (!nextName) return { ok: false, message: 'Nama wajib diisi.' }
        if (target.role === 'siswa') {
          const nextNisn = (patch.nisn ?? '').trim()
          if (!nextNisn) return { ok: false, message: 'NISN wajib diisi.' }
          const duplicate = get().users.find((u) => u.id !== target.id && u.nisn?.trim() === nextNisn)
          if (duplicate) return { ok: false, message: 'NISN sudah digunakan.' }
          get().updateUser(target.id, { name: nextName, nisn: nextNisn })
          return { ok: true }
        }
        const nextNip = (patch.nip ?? '').trim()
        if (!nextNip) return { ok: false, message: 'NIP wajib diisi.' }
        const duplicate = get().users.find((u) => u.id !== target.id && u.nip?.trim() === nextNip)
        if (duplicate) return { ok: false, message: 'NIP sudah digunakan.' }
        get().updateUser(target.id, { name: nextName, nip: nextNip })
        return { ok: true }
      },
      setPiketSchedule: (userId, days) => {
        const normalized = Array.from(new Set(days.filter((d) => d >= 0 && d <= 6))).sort()
        const today = new Date().getDay()
        set((s) => ({
          users: s.users.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  piketScheduleDays: normalized,
                  isPiket: normalized.includes(today),
                }
              : u,
          ),
        }))
      },

      addStaffUser: ({ name, nip, role, jabatan, password }) => {
        if (role === 'siswa' || role === 'super_admin') {
          throw new Error('Gunakan form siswa atau tidak diizinkan.')
        }
        const user: User = {
          id: newId(),
          name,
          role,
          password,
          nip: nip.trim(),
          nisn: null,
          jabatan: jabatan.trim() || null,
          isPiket: role === 'guru_piket',
          piketScheduleDays: role === 'guru_piket' ? [1, 2, 3, 4, 5] : [],
          profilePhotoDataUrl: null,
        }
        set((s) => ({ users: [...s.users, user] }))
        return user
      },

      deleteUser: (id) => {
        set((s) => ({
          users: s.users.filter((u) => u.id !== id),
          students: s.students.filter((st) => st.userId !== id),
        }))
      },

      getClassById: (id) => get().classes.find((c) => c.id === id),

      addClass: (name) => {
        const trimmed = name.trim()
        const cls: ClassRoom = { id: newId(), name: trimmed }
        set((s) => ({ classes: [...s.classes, cls] }))
        return cls
      },

      updateClass: (id, name) => {
        set((s) => ({
          classes: s.classes.map((c) =>
            c.id === id ? { ...c, name: name.trim() } : c,
          ),
        }))
      },

      deleteClass: (id) => {
        set((s) => ({
          classes: s.classes.filter((c) => c.id !== id),
          students: s.students.map((st) =>
            st.classId === id ? { ...st, classId: '' } : st,
          ),
        }))
      },

      getStudentByUserId: (userId) =>
        get().students.find((st) => st.userId === userId),

      getStudentById: (id) => get().students.find((st) => st.id === id),

      addStudent: ({
        name,
        nisn,
        classId,
        password,
        totalPoints = 0,
        parentName = '',
        parentPhone = '',
        studentPhone = '',
        gender = 'L',
      }) => {
        const n = nisn.trim()
        if (get().users.some((u) => u.nisn?.trim() === n)) {
          throw new Error('NISN sudah terdaftar.')
        }
        const user: User = {
          id: newId(),
          name: name.trim(),
          role: 'siswa',
          password,
          nip: null,
          nisn: n,
          jabatan: null,
          isPiket: false,
          piketScheduleDays: [],
          profilePhotoDataUrl: null,
        }
        const student: Student = {
          id: newId(),
          userId: user.id,
          classId,
          totalPoints,
          statusPrestasi: 'normal',
          parentName: parentName.trim(),
          parentPhone: parentPhone.trim(),
          studentPhone: studentPhone.trim(),
          gender,
        }
        set((s) => ({
          users: [...s.users, user],
          students: [...s.students, student],
        }))
        return { user, student }
      },

      updateStudent: (id, patch) => {
        const st = get().getStudentById(id)
        if (!st) return
        set((s) => {
          const nextStudents = s.students.map((x) =>
            x.id === id
              ? {
                  ...x,
                  ...(patch.classId !== undefined && { classId: patch.classId }),
                  ...(patch.totalPoints !== undefined && {
                    totalPoints: patch.totalPoints,
                  }),
                  ...(patch.statusPrestasi !== undefined && {
                    statusPrestasi: patch.statusPrestasi,
                  }),
                  ...(patch.parentName !== undefined && {
                    parentName: patch.parentName.trim(),
                  }),
                  ...(patch.parentPhone !== undefined && {
                    parentPhone: patch.parentPhone.trim(),
                  }),
                  ...(patch.studentPhone !== undefined && {
                    studentPhone: patch.studentPhone.trim(),
                  }),
                  ...(patch.gender !== undefined && {
                    gender: patch.gender,
                  }),
                }
              : x,
          )
          let nextUsers = s.users
          if (patch.name || patch.nisn || patch.password) {
            nextUsers = s.users.map((u) => {
              if (u.id !== st.userId) return u
              return {
                ...u,
                ...(patch.name !== undefined && { name: patch.name.trim() }),
                ...(patch.nisn !== undefined && { nisn: patch.nisn.trim() }),
                ...(patch.password !== undefined && {
                  password: patch.password,
                }),
              }
            })
          }
          return { students: nextStudents, users: nextUsers }
        })
      },

      deleteStudent: (id) => {
        const st = get().getStudentById(id)
        if (!st) return
        set((s) => ({
          students: s.students.filter((x) => x.id !== id),
          users: s.users.filter((u) => u.id !== st.userId),
        }))
      },

      importStudentsFromRows: (rows) => {
        const errors: string[] = []
        let created = 0
        const state = get()
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          const nisn = row.nisn?.trim() ?? ''
          const name = row.name?.trim() ?? ''
          const className = row.className?.trim() ?? ''
          if (!nisn || !name) {
            errors.push(`Baris ${i + 2}: NISN dan Nama wajib diisi.`)
            continue
          }
          const cls = state.classes.find(
            (c) => c.name.toLowerCase() === className.toLowerCase(),
          )
          if (!cls) {
            errors.push(
              `Baris ${i + 2}: Kelas "${className || '(kosong)'}" tidak ditemukan.`,
            )
            continue
          }
          if (get().users.some((u) => u.nisn?.trim() === nisn)) {
            errors.push(`Baris ${i + 2}: NISN ${nisn} sudah ada.`)
            continue
          }
          try {
            get().addStudent({
              name,
              nisn,
              classId: cls.id,
              password: 'siswa123',
              totalPoints: 0,
              parentName: '',
              parentPhone: '',
              studentPhone: '',
              gender: 'L',
            })
            created += 1
          } catch (e) {
            errors.push(`Baris ${i + 2}: ${String(e)}`)
          }
        }
        return { created, errors }
      },

      addViolation: (input) => {
        const slug =
          input.slug?.trim().toLowerCase().replace(/\s+/g, '-') ||
          input.name.trim().toLowerCase().replace(/\s+/g, '-')
        const v: ViolationMaster = {
          id: newId(),
          name: input.name.trim(),
          points: input.points,
          category: input.category,
          slug,
        }
        set((s) => ({ violations: [...s.violations, v] }))
        return v
      },

      updateViolation: (id, patch) => {
        set((s) => ({
          violations: s.violations.map((v) => {
            if (v.id !== id) return v
            const next = { ...v, ...patch }
            if (v.slug === BOLOS_VIOLATION_SLUG) {
              next.slug = BOLOS_VIOLATION_SLUG
            }
            return next
          }),
        }))
      },

      deleteViolation: (id) => {
        const v = get().violations.find((x) => x.id === id)
        if (v?.slug === BOLOS_VIOLATION_SLUG) return
        set((s) => ({
          violations: s.violations.filter((x) => x.id !== id),
        }))
      },

      getBolosViolation: () =>
        get().violations.find((v) => v.slug === BOLOS_VIOLATION_SLUG),

      getAttendanceKey: (studentId, date, period) =>
        get().attendance.find(
          (a) =>
            a.studentId === studentId &&
            a.date === date &&
            a.period === period,
        ),

      setAttendanceStatus: ({
        studentId,
        teacherId,
        date,
        period,
        status,
      }) => {
        const st = get().getStudentById(studentId)
        if (!st) return

        const prev = get().getAttendanceKey(studentId, date, period)
        const prevStatus = prev?.status

        set((s) => {
          let attendance = [...s.attendance]
          const idx = attendance.findIndex(
            (a) =>
              a.studentId === studentId &&
              a.date === date &&
              a.period === period,
          )
          const record: Attendance = {
            id: prev?.id ?? newId(),
            studentId,
            teacherId,
            date,
            period,
            status,
          }
          if (idx >= 0) attendance[idx] = record
          else attendance = [...attendance, record]

          let students = s.students
          let pointHistory = s.pointHistory

          const becameBolos = prevStatus !== 'Bolos' && status === 'Bolos'
          if (becameBolos) {
            const viol = s.violations.find(
              (v) => v.slug === BOLOS_VIOLATION_SLUG,
            )
            const pts = viol?.points ?? 10
            const reason = viol
              ? `Absensi: ${viol.name} (−${pts} poin)`
              : `Absensi: Bolos (−${pts} poin)`

            students = s.students.map((x) =>
              x.id === studentId
                ? { ...x, totalPoints: x.totalPoints - pts }
                : x,
            )
            const ph: PointHistory = {
              id: newId(),
              studentId,
              changerId: teacherId,
              pointsChanged: -pts,
              reason,
              timestamp: new Date().toISOString(),
              source: 'absensi',
            }
            pointHistory = [ph, ...s.pointHistory]
          }

          return { attendance, students, pointHistory }
        })
      },
      applyQuickViolation: ({ studentId, teacherId, violationId }) => {
        const st = get().getStudentById(studentId)
        const viol = get().violations.find((v) => v.id === violationId)
        if (!st || !viol) return { ok: false, message: 'Data siswa/pelanggaran tidak ditemukan.' }
        const pts = Math.max(1, viol.points)
        set((s) => {
          const students = s.students.map((x) =>
            x.id === studentId
              ? { ...x, totalPoints: x.totalPoints - pts }
              : x,
          )
          const ph: PointHistory = {
            id: newId(),
            studentId,
            changerId: teacherId,
            pointsChanged: -pts,
            reason: `Piket cepat: ${viol.name} (−${pts} poin)`,
            timestamp: new Date().toISOString(),
            source: 'pelanggaran',
          }
          return { students, pointHistory: [ph, ...s.pointHistory] }
        })
        return { ok: true }
      },
      redeemStudentPoints: ({
        studentId,
        teacherId,
        activityType,
        pointsRestored,
        proofPhotoDataUrl,
      }) => {
        const st = get().getStudentById(studentId)
        if (!st) return { ok: false, message: 'Siswa tidak ditemukan.' }
        const cleanActivity = activityType.trim()
        if (!cleanActivity) return { ok: false, message: 'Jenis kegiatan wajib diisi.' }
        if (!proofPhotoDataUrl.startsWith('data:image/')) {
          return { ok: false, message: 'Bukti foto tidak valid.' }
        }
        if (st.totalPoints >= 0) {
          return {
            ok: false,
            message:
              'Penebusan tidak bisa diproses karena siswa tidak memiliki poin pelanggaran (nilai belum minus).',
          }
        }
        const add = Math.max(1, Math.min(100, Math.floor(pointsRestored)))
        const applied = Math.min(add, Math.abs(st.totalPoints))
        if (applied <= 0) {
          return { ok: false, message: 'Tidak ada poin minus yang bisa ditebus.' }
        }
        set((s) => {
          const students = s.students.map((x) =>
            x.id === studentId ? { ...x, totalPoints: x.totalPoints + applied } : x,
          )
          const redemption: PointRedemption = {
            id: newId(),
            studentId,
            teacherId,
            activityType: cleanActivity,
            pointsRestored: applied,
            proofPhotoDataUrl,
            timestamp: new Date().toISOString(),
          }
          const ph: PointHistory = {
            id: newId(),
            studentId,
            changerId: teacherId,
            pointsChanged: applied,
            reason: `Penebusan Poin: ${cleanActivity} (+${applied} poin)`,
            timestamp: redemption.timestamp,
            source: 'penebusan',
          }
          return {
            students,
            pointRedemptions: [redemption, ...s.pointRedemptions],
            pointHistory: [ph, ...s.pointHistory],
          }
        })
        return { ok: true, message: `Poin siswa bertambah ${applied}.` }
      },
      createRedemptionRequest: ({
        studentUserId,
        activityType,
        requestedPoints,
        supervisorTeacherId,
      }) => {
        const st = get().getStudentByUserId(studentUserId)
        if (!st) return { ok: false, message: 'Akun siswa tidak valid.' }
        const teacher = get().getUserById(supervisorTeacherId)
        if (!teacher || teacher.role === 'siswa') {
          return { ok: false, message: 'Guru pengawas tidak valid.' }
        }
        const cleanActivity = activityType.trim()
        if (!cleanActivity) return { ok: false, message: 'Kegiatan wajib diisi.' }
        if (st.totalPoints >= 0) {
          return {
            ok: false,
            message:
              'Pengajuan penebusan tidak tersedia karena poin Anda tidak sedang minus.',
          }
        }
        const points = Math.max(1, Math.min(100, Math.floor(requestedPoints)))
        const appliedRequested = Math.min(points, Math.abs(st.totalPoints))
        const req: PointRedemptionRequest = {
          id: newId(),
          studentId: st.id,
          supervisorTeacherId,
          activityType: cleanActivity,
          requestedPoints: appliedRequested,
          status: 'pending',
          requestedAt: new Date().toISOString(),
          approvedAt: null,
          approvedBy: null,
          proofPhotoDataUrl: null,
        }
        set((s) => ({
          pointRedemptionRequests: [req, ...s.pointRedemptionRequests],
        }))
        return { ok: true }
      },
      approveRedemptionRequest: ({
        requestId,
        approverId,
        approvedPoints,
        proofPhotoDataUrl,
      }) => {
        const req = get().pointRedemptionRequests.find((x) => x.id === requestId)
        if (!req) return { ok: false, message: 'Pengajuan tidak ditemukan.' }
        if (req.status !== 'pending') {
          return { ok: false, message: 'Pengajuan sudah diproses.' }
        }
        if (!proofPhotoDataUrl.startsWith('data:image/')) {
          return { ok: false, message: 'Bukti foto tidak valid.' }
        }
        const approver = get().getUserById(approverId)
        if (!approver) return { ok: false, message: 'Akun approver tidak ditemukan.' }
        const canApprove =
          approver.role === 'super_admin' || req.supervisorTeacherId === approverId
        if (!canApprove) {
          return { ok: false, message: 'Hanya guru pengawas terpilih yang dapat approve.' }
        }
        const st = get().getStudentById(req.studentId)
        if (!st) return { ok: false, message: 'Data siswa tidak ditemukan.' }
        if (st.totalPoints >= 0) {
          return { ok: false, message: 'Siswa tidak memiliki poin minus untuk ditebus.' }
        }
        const add = Math.max(1, Math.min(100, Math.floor(approvedPoints)))
        const applied = Math.min(add, Math.abs(st.totalPoints))
        if (applied <= 0) {
          return { ok: false, message: 'Tidak ada poin minus yang bisa ditebus.' }
        }
        const now = new Date().toISOString()
        set((s) => {
          const students = s.students.map((x) =>
            x.id === st.id ? { ...x, totalPoints: x.totalPoints + applied } : x,
          )
          const pointRedemptionRequests = s.pointRedemptionRequests.map((x) =>
            x.id === requestId
              ? {
                  ...x,
                  status: 'approved' as const,
                  approvedAt: now,
                  approvedBy: approverId,
                  proofPhotoDataUrl,
                }
              : x,
          )
          const redemption: PointRedemption = {
            id: newId(),
            studentId: st.id,
            teacherId: approverId,
            activityType: req.activityType,
            pointsRestored: applied,
            proofPhotoDataUrl,
            timestamp: now,
          }
          const ph: PointHistory = {
            id: newId(),
            studentId: st.id,
            changerId: approverId,
            pointsChanged: applied,
            reason: `Penebusan Poin (approve): ${req.activityType} (+${applied} poin)`,
            timestamp: now,
            source: 'penebusan',
          }
          return {
            students,
            pointRedemptionRequests,
            pointRedemptions: [redemption, ...s.pointRedemptions],
            pointHistory: [ph, ...s.pointHistory],
          }
        })
        return { ok: true, message: `Pengajuan disetujui. Poin +${applied}.` }
      },
      addAchievementPoints: ({ studentId, teacherId, points, reason }) => {
        const st = get().getStudentById(studentId)
        if (!st) return { ok: false, message: 'Siswa tidak ditemukan.' }
        const add = Math.max(1, Math.floor(points))
        const cleanReason = reason.trim() || 'Prestasi siswa'
        set((s) => {
          const students = s.students.map((x) =>
            x.id === studentId ? { ...x, totalPoints: x.totalPoints + add } : x,
          )
          const ph: PointHistory = {
            id: newId(),
            studentId,
            changerId: teacherId,
            pointsChanged: add,
            reason: `Prestasi: ${cleanReason} (+${add} poin)`,
            timestamp: new Date().toISOString(),
            source: 'prestasi',
          }
          return { students, pointHistory: [ph, ...s.pointHistory] }
        })
        return { ok: true }
      },
      upsertCompetition: ({
        studentId,
        competitionName,
        level,
        mentorTeacherId,
        status,
      }) => {
        const st = get().getStudentById(studentId)
        if (!st) return { ok: false, message: 'Siswa tidak ditemukan.' }
        const teacher = get().getUserById(mentorTeacherId)
        if (!teacher || teacher.role === 'siswa') {
          return { ok: false, message: 'Guru pembimbing tidak valid.' }
        }
        const name = competitionName.trim()
        if (!name) return { ok: false, message: 'Nama lomba wajib diisi.' }
        const entry: CompetitionEntry = {
          id: `${studentId}::${name.toLowerCase()}`,
          studentId,
          competitionName: name,
          level,
          mentorTeacherId,
          status,
          updatedAt: new Date().toISOString(),
        }
        set((s) => {
          const prevEntry = s.competitions.find((x) => x.id === entry.id)
          const competitions = [
            entry,
            ...s.competitions.filter((x) => x.id !== entry.id),
          ]
          const mappedStatus =
            (status === 'karantina_lomba'
              ? 'karantina_lomba'
              : status === 'sedang_lomba'
                ? 'lomba'
                : 'normal') as Student['statusPrestasi']
          const students = s.students.map((x) =>
            x.id === studentId ? { ...x, statusPrestasi: mappedStatus } : x,
          )
          const statusChanged = !prevEntry || prevEntry.status !== status
          const competitionStatusHistory = statusChanged
            ? [
                {
                  id: newId(),
                  studentId,
                  competitionId: entry.id,
                  fromStatus: prevEntry?.status ?? null,
                  toStatus: status,
                  changedByTeacherId: mentorTeacherId,
                  changedAt: entry.updatedAt,
                  note: prevEntry
                    ? `Status diubah dari ${prevEntry.status} ke ${status}`
                    : `Status awal ${status}`,
                },
                ...s.competitionStatusHistory,
              ]
            : s.competitionStatusHistory
          return { competitions, students, competitionStatusHistory }
        })
        return { ok: true }
      },
      deleteCompetition: (id) => {
        const target = get().competitions.find((x) => x.id === id)
        set((s) => ({
          competitions: s.competitions.filter((x) => x.id !== id),
          students: target
            ? s.students.map((st) =>
                st.id === target.studentId ? { ...st, statusPrestasi: 'normal' } : st,
              )
            : s.students,
        }))
      },
    }),
    {
      name: 'e-smandel-data',
      version: 5,
      merge: (persisted, current) => {
        const merged = {
          ...(current as DataState & DataActions),
          ...((persisted as Partial<DataState>) ?? {}),
        } as DataState & DataActions
        return {
          ...merged,
          users: (merged.users ?? []).map((u) => ({
            ...u,
            isPiket: !!u.isPiket,
            piketScheduleDays: u.piketScheduleDays ?? [],
          })),
          pointRedemptions: merged.pointRedemptions ?? [],
          pointRedemptionRequests: merged.pointRedemptionRequests ?? [],
          competitions: merged.competitions ?? [],
          competitionStatusHistory: merged.competitionStatusHistory ?? [],
          students: (merged.students ?? []).map((st) => ({
            ...st,
            parentName: st.parentName ?? '',
            parentPhone: st.parentPhone ?? '',
            studentPhone: st.studentPhone ?? '',
            gender: st.gender ?? 'L',
          })),
        }
      },
      partialize: (s) => ({
        users: s.users,
        students: s.students,
        classes: s.classes,
        violations: s.violations,
        attendance: s.attendance,
        pointHistory: s.pointHistory,
        pointRedemptions: s.pointRedemptions,
        pointRedemptionRequests: s.pointRedemptionRequests,
        competitions: s.competitions,
        competitionStatusHistory: s.competitionStatusHistory,
      }),
    },
    ),
)
