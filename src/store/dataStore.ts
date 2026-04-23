import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BOLOS_VIOLATION_SLUG } from '../data/initialSeed'
import { newId } from '../lib/ids'
import { buildFreshWorkspaceData, syncCompetitionMentorFlags } from '../lib/workspaceState'
import type { UserRole } from '../types/roles'
import type { DataState } from '../types/dataState'
import type {
  Assignment,
  Attendance,
  AttendanceStatus,
  AuthUser,
  ClassRoom,
  CompetitionEntry,
  KokurikulerProject,
  KokurikulerProjectStatus,
  CompetitionLevel,
  CompetitionStatus,
  GuestVisit,
  KbmLog,
  LateArrival,
  PointHistory,
  PointRedemption,
  PointRedemptionRequest,
  Student,
  StudentAssignmentStatus,
  TeachingJournal,
  User,
  ViolationMaster,
} from '../types/schema'

export type { DataState } from '../types/dataState'

type DataActions = {
  /** Sinkronkan sesi auth dari data terbaru */
  toAuthUser: (u: User) => AuthUser
  getUserById: (id: string) => User | undefined
  updateUser: (id: string, patch: Partial<Omit<User, 'id' | 'password'>> & { password?: string }) => void
  updateSensitiveUserByActor: (
    actorId: string,
    targetUserId: string,
    patch: Pick<User, 'name' | 'nip' | 'nisn'>,
  ) => { ok: boolean; message?: string }
  setPiketSchedule: (userId: string, days: number[]) => void
  setWaliKelasAssignment: (userId: string, classId: string | null) => { ok: boolean; message?: string }
  setKokurikulerCoordinator: (userId: string, enabled: boolean) => { ok: boolean; message?: string }
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
  createAssignment: (input: {
    teacherId: string
    classId: string
    subject: string
    title: string
    description: string
    dueDate: string
  }) => { ok: boolean; message?: string; assignmentId?: string }
  updateAssignment: (
    id: string,
    patch: Partial<
      Pick<Assignment, 'teacherId' | 'classId' | 'subject' | 'title' | 'description' | 'dueDate'>
    >,
  ) => { ok: boolean; message?: string }
  deleteAssignment: (id: string) => void
  upsertTeachingJournal: (input: {
    teacherId: string
    classId: string
    meetingNumber: number
    date: string
    text: string
  }) => { ok: boolean; message?: string; id?: string }
  updateStudentAssignment: (input: {
    assignmentId: string
    studentId: string
    status?: StudentAssignmentStatus
    teacherNote?: string
  }) => { ok: boolean; message?: string }
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
  ) => { created: number; errors: string[]; createdUserIds: string[] }

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
  updateAttendanceByWaliKelas: (input: {
    actorId: string
    studentId: string
    date: string
    period: number
    status: 'S' | 'I'
  }) => { ok: boolean; message?: string }
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

  addLateArrival: (input: {
    date: string
    studentId: string
    reason: string
    createdByUserId: string
    /** optional tindak lanjut: pelanggaran tambahan */
    followUpViolationId?: string | null
  }) => { ok: boolean; message?: string; id?: string }

  addGuestVisit: (input: {
    date: string
    name: string
    position: string
    purpose: string
    createdByUserId: string
  }) => { ok: boolean; message?: string; id?: string }

  addKbmLog: (input: {
    date: string
    period: number
    teacherId: string
    classId: string
    note?: string
    createdByUserId: string
  }) => { ok: boolean; message?: string; id?: string }
  upsertCompetition: (input: {
    actorId: string
    studentId: string
    competitionName: string
    level: CompetitionLevel
    mentorTeacherId: string
    quarantineDate: string
    competitionStartDate: string
    competitionEndDate: string
    status: CompetitionStatus
  }) => { ok: boolean; message?: string }
  updateCompetitionStatus: (input: {
    actorId: string
    competitionId: string
    status: CompetitionStatus
  }) => { ok: boolean; message?: string }
  deleteCompetition: (id: string) => void
  upsertWaliKelasNote: (input: {
    actorId: string
    studentId: string
    note: string
  }) => { ok: boolean; message?: string }
  upsertKokurikulerProject: (input: {
    actorId: string
    title: string
    description: string
    coordinatorTeacherId: string
    classId: string
    studentIds: string[]
    startDate: string
    endDate: string
  }) => { ok: boolean; message?: string }
  updateKokurikulerProjectStatus: (input: {
    actorId: string
    projectId: string
    status: KokurikulerProjectStatus
  }) => { ok: boolean; message?: string }
  deleteKokurikulerProject: (id: string) => void
}

export const useDataStore = create<DataState & DataActions>()(
  persist(
    (set, get) => ({
      ...buildFreshWorkspaceData(),

      toAuthUser: (u) => {
        const { password: _p, ...rest } = u
        return rest
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
      setWaliKelasAssignment: (userId, classId) => {
        const teacher = get().getUserById(userId)
        if (!teacher || teacher.role !== 'guru_mapel') {
          return { ok: false, message: 'Hanya role Guru yang dapat menjadi wali kelas.' }
        }
        if (classId && !get().classes.some((c) => c.id === classId)) {
          return { ok: false, message: 'Kelas tidak ditemukan.' }
        }
        set((s) => ({
          users: s.users.map((u) => {
            if (u.role !== 'guru_mapel') return u
            if (u.id === userId) {
              return {
                ...u,
                is_walikelas: !!classId,
                managed_class_id: classId,
              }
            }
            if (classId && u.managed_class_id === classId) {
              return { ...u, is_walikelas: false, managed_class_id: null }
            }
            return u
          }),
        }))
        return { ok: true }
      },
      setKokurikulerCoordinator: (userId, enabled) => {
        const teacher = get().getUserById(userId)
        if (!teacher || teacher.role !== 'guru_mapel') {
          return { ok: false, message: 'Koordinator kokurikuler hanya bisa ditetapkan ke role Guru.' }
        }
        set((s) => ({
          users: s.users.map((u) =>
            u.id === userId ? { ...u, isKokurikulerCoordinator: enabled } : u,
          ),
        }))
        return { ok: true }
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
          isCompetitionMentor: false,
          is_walikelas: false,
          managed_class_id: null,
          isKokurikulerCoordinator: false,
          profilePhotoDataUrl: null,
        }
        set((s) => ({ users: [...s.users, user] }))
        return user
      },

      deleteUser: (id) => {
        set((s) => {
          const users = s.users.filter((u) => u.id !== id)
          const students = s.students.filter((st) => st.userId !== id)
          const studentIds = new Set(students.map((st) => st.id))
          const competitions = s.competitions.filter(
            (c) => c.mentorTeacherId !== id && students.some((st) => st.id === c.studentId),
          )
          const assignments = s.assignments.filter((assignment) => assignment.teacherId !== id)
          const assignmentIds = new Set(assignments.map((assignment) => assignment.id))
          return {
            users: syncCompetitionMentorFlags(users, competitions),
            students,
            competitions,
            assignments,
            studentAssignments: s.studentAssignments.filter(
              (item) => assignmentIds.has(item.assignmentId) && studentIds.has(item.studentId),
            ),
            waliKelasNotes: s.waliKelasNotes.filter(
              (n) => n.teacherId !== id && students.some((st) => st.id === n.studentId),
            ),
          }
        })
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
          assignments: s.assignments.filter((assignment) => assignment.classId !== id),
          studentAssignments: s.studentAssignments.filter((item) => {
            const assignment = s.assignments.find((entry) => entry.id === item.assignmentId)
            return assignment?.classId !== id
          }),
          students: s.students.map((st) =>
            st.classId === id ? { ...st, classId: '' } : st,
          ),
          users: s.users.map((u) =>
            u.managed_class_id === id
              ? { ...u, is_walikelas: false, managed_class_id: null }
              : u,
          ),
        }))
      },

      getStudentByUserId: (userId) =>
        get().students.find((st) => st.userId === userId),

      getStudentById: (id) => get().students.find((st) => st.id === id),

      createAssignment: ({ teacherId, classId, subject, title, description, dueDate }) => {
        const teacher = get().getUserById(teacherId)
        if (!teacher || (teacher.role !== 'guru_mapel' && teacher.role !== 'super_admin')) {
          return { ok: false, message: 'Hanya guru atau super admin yang dapat membuat tugas.' }
        }
        if (!get().classes.some((c) => c.id === classId)) {
          return { ok: false, message: 'Kelas tidak ditemukan.' }
        }
        const cleanTitle = title.trim()
        const cleanSubject = subject.trim()
        if (!cleanTitle || !cleanSubject || !dueDate) {
          return { ok: false, message: 'Mapel, judul, dan tenggat wajib diisi.' }
        }
        const assignmentId = newId()
        const now = new Date().toISOString()
        const assignment: Assignment = {
          id: assignmentId,
          teacherId,
          classId,
          subject: cleanSubject,
          title: cleanTitle,
          description: description.trim(),
          dueDate,
          createdAt: now,
        }
        const classStudents = get().students.filter((student) => student.classId === classId)
        set((s) => ({
          assignments: [assignment, ...s.assignments],
          studentAssignments: [
            ...classStudents.map((student) => ({
              id: newId(),
              assignmentId,
              studentId: student.id,
              status: 'belum_mengerjakan' as const,
              teacherNote: '',
              updatedAt: now,
            })),
            ...s.studentAssignments,
          ],
        }))
        return { ok: true, assignmentId }
      },

      updateAssignment: (id, patch) => {
        const current = get().assignments.find((item) => item.id === id)
        if (!current) return { ok: false, message: 'Tugas tidak ditemukan.' }
        const nextTeacherId = patch.teacherId ?? current.teacherId
        const teacher = get().getUserById(nextTeacherId)
        if (!teacher || (teacher.role !== 'guru_mapel' && teacher.role !== 'super_admin')) {
          return { ok: false, message: 'Guru penanggung jawab tidak valid.' }
        }
        const nextClassId = patch.classId ?? current.classId
        if (!get().classes.some((c) => c.id === nextClassId)) {
          return { ok: false, message: 'Kelas tidak ditemukan.' }
        }
        const nextTitle = (patch.title ?? current.title).trim()
        const nextSubject = (patch.subject ?? current.subject).trim()
        const nextDueDate = patch.dueDate ?? current.dueDate
        if (!nextTitle || !nextSubject || !nextDueDate) {
          return { ok: false, message: 'Mapel, judul, dan tenggat wajib diisi.' }
        }
        set((s) => {
          const assignments = s.assignments.map((item) =>
            item.id === id
              ? {
                  ...item,
                  teacherId: nextTeacherId,
                  classId: nextClassId,
                  subject: nextSubject,
                  title: nextTitle,
                  description: patch.description !== undefined ? patch.description.trim() : item.description,
                  dueDate: nextDueDate,
                }
              : item,
          )
          const classStudentIds = new Set(
            s.students.filter((student) => student.classId === nextClassId).map((student) => student.id),
          )
          const existingEntries = s.studentAssignments.filter((item) => item.assignmentId === id)
          const existingStudentIds = new Set(existingEntries.map((item) => item.studentId))
          const keptEntries = s.studentAssignments.filter(
            (item) => item.assignmentId !== id || classStudentIds.has(item.studentId),
          )
          const newEntries = Array.from(classStudentIds)
            .filter((studentId) => !existingStudentIds.has(studentId))
            .map((studentId) => ({
              id: newId(),
              assignmentId: id,
              studentId,
              status: 'belum_mengerjakan' as const,
              teacherNote: '',
              updatedAt: new Date().toISOString(),
            }))
          return {
            assignments,
            studentAssignments: [...newEntries, ...keptEntries],
          }
        })
        return { ok: true }
      },

      deleteAssignment: (id) => {
        set((s) => ({
          assignments: s.assignments.filter((item) => item.id !== id),
          studentAssignments: s.studentAssignments.filter((item) => item.assignmentId !== id),
        }))
      },

      upsertTeachingJournal: ({ teacherId, classId, meetingNumber, date, text }) => {
        const teacher = get().getUserById(teacherId)
        if (!teacher) return { ok: false, message: 'Pengguna tidak valid.' }
        if (teacher.role === 'kepsek' || teacher.role === 'bk' || teacher.role === 'siswa') {
          return { ok: false, message: 'Role tidak diizinkan membuat jurnal mengajar.' }
        }
        if (!get().classes.some((c) => c.id === classId)) {
          return { ok: false, message: 'Kelas tidak ditemukan.' }
        }
        if (!date) return { ok: false, message: 'Tanggal wajib diisi.' }
        const meeting = Math.floor(meetingNumber)
        if (!Number.isFinite(meeting) || meeting <= 0) {
          return { ok: false, message: 'Pertemuan ke berapa harus angka positif.' }
        }
        const cleanText = text.trim()
        if (!cleanText) return { ok: false, message: 'Teks jurnal wajib diisi.' }

        const now = new Date().toISOString()
        set((s) => {
          const existing = s.teachingJournals.find(
            (j) => j.teacherId === teacherId && j.classId === classId && j.date === date,
          )
          if (existing) {
            return {
              teachingJournals: s.teachingJournals.map((j) =>
                j.id === existing.id
                  ? {
                      ...j,
                      meetingNumber: meeting,
                      text: cleanText,
                      updatedAt: now,
                    }
                  : j,
              ),
            }
          }

          const entry: TeachingJournal = {
            id: newId(),
            teacherId,
            classId,
            meetingNumber: meeting,
            date,
            text: cleanText,
            updatedAt: now,
          }
          return { teachingJournals: [entry, ...s.teachingJournals] }
        })

        return { ok: true }
      },

      updateStudentAssignment: ({ assignmentId, studentId, status, teacherNote }) => {
        const target = get().studentAssignments.find(
          (item) => item.assignmentId === assignmentId && item.studentId === studentId,
        )
        if (!target) return { ok: false, message: 'Progress tugas siswa tidak ditemukan.' }
        set((s) => ({
          studentAssignments: s.studentAssignments.map((item) =>
            item.id === target.id
              ? {
                  ...item,
                  ...(status !== undefined && { status }),
                  ...(teacherNote !== undefined && { teacherNote: teacherNote.trim() }),
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        }))
        return { ok: true }
      },

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
          isCompetitionMentor: false,
          is_walikelas: false,
          managed_class_id: null,
          isKokurikulerCoordinator: false,
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
          waliKelasNotes: s.waliKelasNotes.filter((n) => n.studentId !== id),
          studentAssignments: s.studentAssignments.filter((item) => item.studentId !== id),
        }))
      },

      importStudentsFromRows: (rows) => {
        const errors: string[] = []
        const createdUserIds: string[] = []
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
            const { user } = get().addStudent({
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
            createdUserIds.push(user.id)
            created += 1
          } catch (e) {
            errors.push(`Baris ${i + 2}: ${String(e)}`)
          }
        }
        return { created, errors, createdUserIds }
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
      updateAttendanceByWaliKelas: ({ actorId, studentId, date, period, status }) => {
        const actor = get().getUserById(actorId)
        const st = get().getStudentById(studentId)
        if (!actor || !st) return { ok: false, message: 'Data tidak ditemukan.' }
        if (status !== 'S' && status !== 'I') {
          return { ok: false, message: 'Wali kelas hanya bisa mengubah ke Sakit/Izin.' }
        }
        if (
          actor.role !== 'guru_mapel' ||
          !actor.is_walikelas ||
          !actor.managed_class_id ||
          st.classId !== actor.managed_class_id
        ) {
          return { ok: false, message: 'Anda bukan wali kelas siswa ini.' }
        }
        get().setAttendanceStatus({
          studentId,
          teacherId: actorId,
          date,
          period,
          status,
        })
        return { ok: true }
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

      addLateArrival: ({ date, studentId, reason, createdByUserId, followUpViolationId }) => {
        const st = get().getStudentById(studentId)
        if (!st) return { ok: false, message: 'Siswa tidak ditemukan.' }
        const stUser = get().getUserById(st.userId)
        const nisn = stUser?.nisn?.trim()
        if (!nisn) return { ok: false, message: 'NISN siswa belum terisi (sinkron login).' }
        const className = get().classes.find((c) => c.id === st.classId)?.name ?? st.classId

        const terlambat = get().violations.find((v) => v.slug === 'terlambat')
        if (!terlambat) return { ok: false, message: 'Master pelanggaran "terlambat" tidak ditemukan.' }
        const cleanReason = reason.trim()
        if (!cleanReason) return { ok: false, message: 'Alasan/keterangan wajib diisi.' }

        const now = new Date().toISOString()
        const id = newId()
        const followUpId = followUpViolationId ?? null

        set((s) => {
          let students = s.students
          let pointHistory = s.pointHistory

          const applyDeduction = (violationId: string, labelPrefix: string) => {
            const viol = s.violations.find((v) => v.id === violationId)
            if (!viol) return
            const pts = Math.max(1, viol.points)
            students = students.map((x) =>
              x.id === studentId ? { ...x, totalPoints: x.totalPoints - pts } : x,
            )
            const ph: PointHistory = {
              id: newId(),
              studentId,
              changerId: createdByUserId,
              pointsChanged: -pts,
              reason: `${labelPrefix}: ${viol.name} (−${pts} poin) — ${cleanReason}`,
              timestamp: now,
              source: 'pelanggaran',
            }
            pointHistory = [ph, ...pointHistory]
          }

          // Sinkron e-poin: keterlambatan selalu memotong poin via master "terlambat"
          applyDeduction(terlambat.id, `Keterlambatan ${date}`)

          // Tindak lanjut opsional: pelanggaran tambahan yang juga mengurangi poin
          if (followUpId) applyDeduction(followUpId, `Tindak lanjut ${date}`)

          const entry: LateArrival = {
            id,
            date,
            studentId,
            nisn,
            studentName: stUser?.name ?? '—',
            className,
            reason: cleanReason,
            createdByUserId,
            createdAt: now,
            followUpViolationId: followUpId,
          }
          return {
            students,
            pointHistory,
            lateArrivals: [entry, ...s.lateArrivals],
          }
        })
        return { ok: true, id }
      },

      addGuestVisit: ({ date, name, position, purpose, createdByUserId }) => {
        const cleanName = name.trim()
        if (!cleanName) return { ok: false, message: 'Nama tamu wajib diisi.' }
        const cleanPos = position.trim()
        if (!cleanPos) return { ok: false, message: 'Jabatan wajib diisi.' }
        const cleanPurpose = purpose.trim()
        if (!cleanPurpose) return { ok: false, message: 'Maksud kunjungan wajib diisi.' }
        const now = new Date().toISOString()
        const entry: GuestVisit = {
          id: newId(),
          date,
          name: cleanName,
          position: cleanPos,
          purpose: cleanPurpose,
          createdByUserId,
          createdAt: now,
        }
        set((s) => ({ guestVisits: [entry, ...s.guestVisits] }))
        return { ok: true, id: entry.id }
      },

      addKbmLog: ({ date, period, teacherId, classId, note, createdByUserId }) => {
        const p = Math.floor(period)
        if (!Number.isFinite(p) || p <= 0) return { ok: false, message: 'Jam ke- harus angka positif.' }
        const teacher = get().getUserById(teacherId)
        if (!teacher) return { ok: false, message: 'Guru tidak valid.' }
        const cls = get().classes.find((c) => c.id === classId)
        if (!cls) return { ok: false, message: 'Kelas tidak ditemukan.' }
        const cleanNote = (note ?? '').trim()
        const now = new Date().toISOString()
        const entry: KbmLog = {
          id: newId(),
          date,
          period: p,
          teacherId,
          teacherName: teacher.name,
          classId,
          className: cls.name,
          note: cleanNote,
          createdByUserId,
          createdAt: now,
        }
        set((s) => ({ kbmLogs: [entry, ...s.kbmLogs] }))
        return { ok: true, id: entry.id }
      },
      upsertCompetition: ({
        actorId,
        studentId,
        competitionName,
        level,
        mentorTeacherId,
        quarantineDate,
        competitionStartDate,
        competitionEndDate,
        status,
      }) => {
        const actor = get().getUserById(actorId)
        if (!actor) return { ok: false, message: 'Pengguna tidak valid.' }
        if (actor.role !== 'super_admin' && actor.role !== 'kesiswaan') {
          return { ok: false, message: 'Hanya Super Admin/Kesiswaan yang dapat menugaskan pembimbing.' }
        }
        const st = get().getStudentById(studentId)
        if (!st) return { ok: false, message: 'Siswa tidak ditemukan.' }
        const teacher = get().getUserById(mentorTeacherId)
        if (!teacher || teacher.role !== 'guru_mapel') {
          return { ok: false, message: 'Guru pembimbing harus dari role Guru.' }
        }
        const name = competitionName.trim()
        if (!name) return { ok: false, message: 'Nama lomba wajib diisi.' }
        if (!quarantineDate || !competitionStartDate || !competitionEndDate) {
          return { ok: false, message: 'Tanggal karantina dan periode lomba wajib diisi.' }
        }
        if (competitionEndDate < competitionStartDate) {
          return { ok: false, message: 'Tanggal selesai lomba tidak boleh sebelum tanggal mulai.' }
        }
        const entry: CompetitionEntry = {
          id: `${studentId}::${name.toLowerCase()}`,
          studentId,
          competitionName: name,
          level,
          mentorTeacherId,
          quarantineDate,
          competitionStartDate,
          competitionEndDate,
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
                  changedByTeacherId: actorId,
                  changedAt: entry.updatedAt,
                  note: prevEntry
                    ? `Status diubah dari ${prevEntry.status} ke ${status}`
                    : `Status awal ${status}`,
                },
                ...s.competitionStatusHistory,
              ]
            : s.competitionStatusHistory
          return {
            competitions,
            students,
            competitionStatusHistory,
            users: syncCompetitionMentorFlags(s.users, competitions),
          }
        })
        return { ok: true }
      },
      updateCompetitionStatus: ({ actorId, competitionId, status }) => {
        const actor = get().getUserById(actorId)
        if (!actor) return { ok: false, message: 'Pengguna tidak valid.' }
        const target = get().competitions.find((x) => x.id === competitionId)
        if (!target) return { ok: false, message: 'Data lomba tidak ditemukan.' }
        const canEdit =
          actor.role === 'super_admin' ||
          actor.role === 'kesiswaan' ||
          (actor.role === 'guru_mapel' &&
            actor.isCompetitionMentor &&
            target.mentorTeacherId === actor.id)
        if (!canEdit) {
          return { ok: false, message: 'Tidak diizinkan mengubah status lomba ini.' }
        }
        const now = new Date().toISOString()
        set((s) => {
          const prev = s.competitions.find((x) => x.id === competitionId)
          if (!prev) return {}
          const competitions = s.competitions.map((x) =>
            x.id === competitionId ? { ...x, status, updatedAt: now } : x,
          )
          const mappedStatus =
            (status === 'karantina_lomba'
              ? 'karantina_lomba'
              : status === 'sedang_lomba'
                ? 'lomba'
                : 'normal') as Student['statusPrestasi']
          const students = s.students.map((x) =>
            x.id === prev.studentId ? { ...x, statusPrestasi: mappedStatus } : x,
          )
          const competitionStatusHistory =
            prev.status !== status
              ? [
                  {
                    id: newId(),
                    studentId: prev.studentId,
                    competitionId,
                    fromStatus: prev.status,
                    toStatus: status,
                    changedByTeacherId: actorId,
                    changedAt: now,
                    note: `Status diubah dari ${prev.status} ke ${status}`,
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
        set((s) => {
          const competitions = s.competitions.filter((x) => x.id !== id)
          return {
            competitions,
            users: syncCompetitionMentorFlags(s.users, competitions),
            students: target
              ? s.students.map((st) =>
                  st.id === target.studentId ? { ...st, statusPrestasi: 'normal' } : st,
                )
              : s.students,
          }
        })
      },
      upsertWaliKelasNote: ({ actorId, studentId, note }) => {
        const actor = get().getUserById(actorId)
        const st = get().getStudentById(studentId)
        if (!actor || !st) return { ok: false, message: 'Data tidak ditemukan.' }
        if (
          actor.role !== 'guru_mapel' ||
          !actor.is_walikelas ||
          !actor.managed_class_id ||
          st.classId !== actor.managed_class_id
        ) {
          return { ok: false, message: 'Tidak diizinkan memperbarui catatan pembinaan.' }
        }
        const clean = note.trim()
        if (!clean) return { ok: false, message: 'Catatan pembinaan tidak boleh kosong.' }
        const now = new Date().toISOString()
        set((s) => {
          const existing = s.waliKelasNotes.find(
            (x) => x.teacherId === actorId && x.studentId === studentId,
          )
          if (existing) {
            return {
              waliKelasNotes: s.waliKelasNotes.map((x) =>
                x.id === existing.id ? { ...x, note: clean, updatedAt: now } : x,
              ),
            }
          }
          return {
            waliKelasNotes: [
              { id: newId(), teacherId: actorId, studentId, note: clean, updatedAt: now },
              ...s.waliKelasNotes,
            ],
          }
        })
        return { ok: true }
      },
      upsertKokurikulerProject: ({
        actorId,
        title,
        description,
        coordinatorTeacherId,
        classId,
        studentIds,
        startDate,
        endDate,
      }) => {
        const actor = get().getUserById(actorId)
        if (!actor) return { ok: false, message: 'Pengguna tidak valid.' }
        if (actor.role !== 'super_admin' && actor.role !== 'kurikulum') {
          return { ok: false, message: 'Hanya Super Admin/Kurikulum yang dapat membuat projek.' }
        }
        const coordinator = get().getUserById(coordinatorTeacherId)
        if (!coordinator || coordinator.role !== 'guru_mapel' || !coordinator.isKokurikulerCoordinator) {
          return { ok: false, message: 'Koordinator projek belum ditetapkan.' }
        }
        if (!get().classes.some((c) => c.id === classId)) {
          return { ok: false, message: 'Kelas tidak ditemukan.' }
        }
        const selectedStudentIds = Array.from(new Set(studentIds))
        if (selectedStudentIds.length === 0) {
          return { ok: false, message: 'Minimal pilih 1 siswa peserta.' }
        }
        const cleanTitle = title.trim()
        if (!cleanTitle) return { ok: false, message: 'Judul projek wajib diisi.' }
        if (!startDate || !endDate || endDate < startDate) {
          return { ok: false, message: 'Periode projek tidak valid.' }
        }
        const now = new Date().toISOString()
        const id = `${classId}::${cleanTitle.toLowerCase().replace(/\s+/g, '-')}`
        const project: KokurikulerProject = {
          id,
          title: cleanTitle,
          description: description.trim(),
          coordinatorTeacherId,
          classId,
          studentIds: selectedStudentIds,
          startDate,
          endDate,
          status: 'rencana',
          updatedAt: now,
        }
        set((s) => ({
          kokurikulerProjects: [
            project,
            ...s.kokurikulerProjects.filter((x) => x.id !== project.id),
          ],
        }))
        return { ok: true }
      },
      updateKokurikulerProjectStatus: ({ actorId, projectId, status }) => {
        const actor = get().getUserById(actorId)
        const target = get().kokurikulerProjects.find((x) => x.id === projectId)
        if (!actor || !target) return { ok: false, message: 'Data projek tidak ditemukan.' }
        const canEdit =
          actor.role === 'super_admin' ||
          actor.role === 'kurikulum' ||
          (actor.role === 'guru_mapel' &&
            actor.isKokurikulerCoordinator &&
            target.coordinatorTeacherId === actor.id)
        if (!canEdit) return { ok: false, message: 'Tidak diizinkan mengubah status projek.' }
        set((s) => ({
          kokurikulerProjects: s.kokurikulerProjects.map((x) =>
            x.id === projectId ? { ...x, status, updatedAt: new Date().toISOString() } : x,
          ),
        }))
        return { ok: true }
      },
      deleteKokurikulerProject: (id) => {
        set((s) => ({
          kokurikulerProjects: s.kokurikulerProjects.filter((x) => x.id !== id),
        }))
      },
    }),
    {
      name: 'e-smandel-data',
      version: 13,
      merge: (persisted, current) => {
        const merged = {
          ...(current as DataState & DataActions),
          ...((persisted as Partial<DataState>) ?? {}),
        } as DataState & DataActions
        return {
          ...merged,
          users: syncCompetitionMentorFlags(
            (merged.users ?? [])
              .filter((u) => {
                const legacyRole = (u as unknown as { role: string }).role
                return u.id !== 'u7' && legacyRole !== 'guru_pembimbing'
              })
              .map((u) => {
                const legacyRole = (u as unknown as { role: string }).role
                return {
                  ...u,
                  role: legacyRole === 'guru_pembimbing' ? 'guru_mapel' : u.role,
                  isPiket: !!u.isPiket,
                  piketScheduleDays: u.piketScheduleDays ?? [],
                  isCompetitionMentor: !!u.isCompetitionMentor,
                  is_walikelas: !!u.is_walikelas,
                  managed_class_id: u.managed_class_id ?? null,
                  isKokurikulerCoordinator: !!u.isKokurikulerCoordinator,
                }
              }),
            (merged.competitions ?? []).map((c) => ({
              ...c,
              quarantineDate: c.quarantineDate ?? c.updatedAt?.slice(0, 10) ?? '',
              competitionStartDate: c.competitionStartDate ?? c.updatedAt?.slice(0, 10) ?? '',
              competitionEndDate: c.competitionEndDate ?? c.updatedAt?.slice(0, 10) ?? '',
            })),
          ),
          assignments: merged.assignments ?? [],
          studentAssignments: merged.studentAssignments ?? [],
          teachingJournals: merged.teachingJournals ?? [],
          pointRedemptions: merged.pointRedemptions ?? [],
          pointRedemptionRequests: merged.pointRedemptionRequests ?? [],
          competitions: (merged.competitions ?? []).map((c) => ({
            ...c,
            quarantineDate: c.quarantineDate ?? c.updatedAt?.slice(0, 10) ?? '',
            competitionStartDate: c.competitionStartDate ?? c.updatedAt?.slice(0, 10) ?? '',
            competitionEndDate: c.competitionEndDate ?? c.updatedAt?.slice(0, 10) ?? '',
          })),
          competitionStatusHistory: merged.competitionStatusHistory ?? [],
          waliKelasNotes: merged.waliKelasNotes ?? [],
          kokurikulerProjects: merged.kokurikulerProjects ?? [],
          lateArrivals: merged.lateArrivals ?? [],
          guestVisits: merged.guestVisits ?? [],
          kbmLogs: merged.kbmLogs ?? [],
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
        users: s.users.map((u) => ({ ...u, password: '' })),
        students: s.students,
        classes: s.classes,
        assignments: s.assignments,
        studentAssignments: s.studentAssignments,
        teachingJournals: s.teachingJournals,
        violations: s.violations,
        attendance: s.attendance,
        pointHistory: s.pointHistory,
        pointRedemptions: s.pointRedemptions,
        pointRedemptionRequests: s.pointRedemptionRequests,
        lateArrivals: s.lateArrivals,
        guestVisits: s.guestVisits,
        kbmLogs: s.kbmLogs,
        competitions: s.competitions,
        competitionStatusHistory: s.competitionStatusHistory,
        waliKelasNotes: s.waliKelasNotes,
        kokurikulerProjects: s.kokurikulerProjects,
      }),
    },
    ),
)
