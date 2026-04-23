import type { UserRole } from '../types/roles'

/** Peran yang boleh menulis snapshot workspace ke server (GET penuh tetap mengikuti model SPA). */
export function canSaveWorkspaceOnServer(role: UserRole): boolean {
  return role !== 'siswa' && role !== 'kepsek'
}
