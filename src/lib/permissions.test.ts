import { describe, expect, it } from 'vitest'
import { canAccessRoute, isPiketActive } from './permissions'
import type { AuthUser } from '../types/schema'

function baseUser(partial: Partial<AuthUser>): AuthUser {
  return {
    id: 'u-test',
    name: 'Test',
    role: 'guru_mapel',
    nip: '123',
    nisn: null,
    jabatan: 'Guru',
    isPiket: false,
    piketScheduleDays: [],
    isCompetitionMentor: false,
    is_walikelas: false,
    managed_class_id: null,
    isKokurikulerCoordinator: false,
    profilePhotoDataUrl: null,
    ...partial,
  }
}

describe('isPiketActive', () => {
  it('menganggap guru_piket selalu aktif', () => {
    const u = baseUser({ role: 'guru_piket', isPiket: false, piketScheduleDays: [] })
    expect(isPiketActive(u)).toBe(true)
  })

  it('guru_mapel aktif jika jadwal hari ini cocok', () => {
    const today = new Date().getDay()
    const u = baseUser({ role: 'guru_mapel', piketScheduleDays: [today], isPiket: false })
    expect(isPiketActive(u)).toBe(true)
  })
})

describe('canAccessRoute', () => {
  it('super_admin dapat semua rute', () => {
    const u = baseUser({ role: 'super_admin' })
    expect(canAccessRoute(u, 'admin_siswa')).toBe(true)
    expect(canAccessRoute(u, 'laporan')).toBe(true)
  })

  it('siswa hanya tugas_saya dan modul terbatas', () => {
    const u = baseUser({ role: 'siswa' })
    expect(canAccessRoute(u, 'tugas_saya')).toBe(true)
    expect(canAccessRoute(u, 'admin_siswa')).toBe(false)
  })

  it('kepsek tidak mengakses admin_siswa', () => {
    const u = baseUser({ role: 'kepsek' })
    expect(canAccessRoute(u, 'laporan')).toBe(true)
    expect(canAccessRoute(u, 'admin_siswa')).toBe(false)
  })

  it('eprestasi untuk guru_mapel hanya jika pembimbing lomba', () => {
    const no = baseUser({ role: 'guru_mapel', isCompetitionMentor: false })
    const yes = baseUser({ role: 'guru_mapel', isCompetitionMentor: true })
    expect(canAccessRoute(no, 'eprestasi')).toBe(false)
    expect(canAccessRoute(yes, 'eprestasi')).toBe(true)
  })
})
