import { ROLE_LABELS, type UserRole } from '../types/roles'
import type { AuthUser, Student, User } from '../types/schema'

/** Nilai yang dipakai untuk login: NIP (staff) atau NISN (siswa) */
export function getCredentialForLogin(u: User | AuthUser): string {
  if (u.role === 'siswa') return u.nisn?.trim() ?? ''
  return u.nip?.trim() ?? ''
}

export function formatStaffTitle(role: UserRole, jabatan: string | null): string {
  if (jabatan?.trim()) return jabatan.trim()
  return ROLE_LABELS[role]
}

export function getStudentClassLabel(
  student: Student | undefined,
  className: string | undefined,
): string {
  if (className) return className
  if (student?.classId) return student.classId
  return '—'
}
