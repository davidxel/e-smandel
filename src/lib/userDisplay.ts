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

export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D+/g, '')
  if (!digits) return ''
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('62')) return digits
  return digits
}

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const num = toWhatsAppNumber(phone)
  if (!num) return null
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`
}

export function buildSmsUrl(phone: string, message: string): string | null {
  const num = toWhatsAppNumber(phone)
  if (!num) return null
  return `sms:${num}?body=${encodeURIComponent(message)}`
}
