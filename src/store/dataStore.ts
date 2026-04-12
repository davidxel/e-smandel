import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  BOLOS_VIOLATION_SLUG,
  buildInitialAttendance,
  buildInitialClasses,
  buildInitialPointHistory,
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
  PointHistory,
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
}

type DataActions = {
  /** Sinkronkan sesi auth dari data terbaru */
  toAuthUser: (u: User) => AuthUser
  findUserForLogin: (credential: string, password: string) => User | null
  getUserById: (id: string) => User | undefined
  updateUser: (id: string, patch: Partial<Omit<User, 'id' | 'password'>> & { password?: string }) => void
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
  }) => { user: User; student: Student }
  updateStudent: (
    id: string,
    patch: Partial<
      Pick<Student, 'classId' | 'totalPoints' | 'statusPrestasi'> & {
        name?: string
        nisn?: string
        password?: string
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

      addStudent: ({ name, nisn, classId, password, totalPoints = 100 }) => {
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
          profilePhotoDataUrl: null,
        }
        const student: Student = {
          id: newId(),
          userId: user.id,
          classId,
          totalPoints,
          statusPrestasi: 'normal',
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
              totalPoints: 100,
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
                ? { ...x, totalPoints: Math.max(0, x.totalPoints - pts) }
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
    }),
    {
      name: 'e-smandel-data',
      version: 1,
      partialize: (s) => ({
        users: s.users,
        students: s.students,
        classes: s.classes,
        violations: s.violations,
        attendance: s.attendance,
        pointHistory: s.pointHistory,
      }),
    },
    ),
)
