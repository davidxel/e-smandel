import { describe, expect, it } from 'vitest'
import { canSaveWorkspaceOnServer } from './serverPolicy'

describe('canSaveWorkspaceOnServer', () => {
  it('menolak siswa dan kepsek', () => {
    expect(canSaveWorkspaceOnServer('siswa')).toBe(false)
    expect(canSaveWorkspaceOnServer('kepsek')).toBe(false)
  })

  it('mengizinkan kesiswaan dan guru', () => {
    expect(canSaveWorkspaceOnServer('kesiswaan')).toBe(true)
    expect(canSaveWorkspaceOnServer('guru_mapel')).toBe(true)
    expect(canSaveWorkspaceOnServer('super_admin')).toBe(true)
  })
})
