import { useState } from 'react'
import { Pencil, Plus, Trash2, KeyRound } from 'lucide-react'
import { apiSetPassword } from '../../lib/api'
import { flushWorkspacePushNowAsync } from '../../lib/workspaceSync'
import { PaginatedTable } from '../../components/ui/PaginatedTable'
import { ModuleTabBar } from '../../components/ui/ModuleTabBar'
import { GURU_STAFF_ROLES } from '../../data/initialSeed'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import { ROLE_LABELS, type UserRole } from '../../types/roles'
import type { User } from '../../types/schema'

const ROLE_OPTIONS = GURU_STAFF_ROLES

type AdminGuruTab = 'kelola' | 'daftar'

const ADMIN_GURU_TABS: { id: AdminGuruTab; label: string }[] = [
  { id: 'kelola', label: 'Tambah / edit akun' },
  { id: 'daftar', label: 'Daftar akun' },
]

export function AdminGuruPage() {
  const users = useDataStore((s) => s.users)
  const addStaffUser = useDataStore((s) => s.addStaffUser)
  const updateUser = useDataStore((s) => s.updateUser)
  const deleteUser = useDataStore((s) => s.deleteUser)
  const showToast = useUiStore((s) => s.showToast)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const me = useAuthStore((s) => s.user)

  const [nama, setNama] = useState('')
  const [nip, setNip] = useState('')
  const [role, setRole] = useState<UserRole>('guru_mapel')
  const [jabatan, setJabatan] = useState('')
  const [pass, setPass] = useState('demo1234')

  const [editing, setEditing] = useState<User | null>(null)
  const [eNama, setENama] = useState('')
  const [eNip, setENip] = useState('')
  const [eRole, setERole] = useState<UserRole>('guru_mapel')
  const [eJabatan, setEJabatan] = useState('')
  const [ePass, setEPass] = useState('')
  const [eIsMentor, setEIsMentor] = useState(false)
  const [eIsCoordinator, setEIsCoordinator] = useState(false)
  const [moduleTab, setModuleTab] = useState<AdminGuruTab>('kelola')

  const staffRows = users.filter((u) => ROLE_OPTIONS.includes(u.role))

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const plain = pass || 'demo1234'
      const newUser = addStaffUser({
        name: nama,
        nip,
        role,
        jabatan,
        password: plain,
      })
      await flushWorkspacePushNowAsync()
      const syncPw = await apiSetPassword(newUser.id, plain)
      if (!syncPw.ok) {
        showToast(syncPw.message ?? 'Akun ditambahkan lokal; gagal menyimpan hash kata sandi ke server.', 'error')
      } else {
        showToast('Akun guru/staff ditambahkan.', 'success')
      }
      setNama('')
      setNip('')
      setJabatan('')
      setPass('demo1234')
    } catch (err) {
      showToast(String(err), 'error')
    }
  }

  const openEdit = (u: User) => {
    setEditing(u)
    setENama(u.name)
    setENip(u.nip ?? '')
    setERole(u.role as UserRole)
    setEJabatan(u.jabatan ?? '')
    setEPass('')
    setEIsMentor(!!u.isCompetitionMentor)
    setEIsCoordinator(!!u.isKokurikulerCoordinator)
    setModuleTab('kelola')
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    updateUser(editing.id, {
      name: eNama.trim(),
      nip: eNip.trim(),
      role: eRole,
      jabatan: eJabatan.trim() || null,
      ...(me?.role === 'super_admin' && eRole === 'guru_mapel'
        ? {
            isCompetitionMentor: eIsMentor,
            isKokurikulerCoordinator: eIsCoordinator,
          }
        : {}),
    })
    await flushWorkspacePushNowAsync()
    if (ePass.trim()) {
      const syncPw = await apiSetPassword(editing.id, ePass.trim())
      if (!syncPw.ok) {
        showToast(syncPw.message ?? 'Gagal memperbarui kata sandi di server.', 'error')
        return
      }
    }
    showToast('Data pengguna diperbarui.', 'success')
    setEditing(null)
  }

  const quickResetPassword = async (u: User) => {
    const next = `Smandel${Math.floor(100000 + Math.random() * 900000)}`
    const syncPw = await apiSetPassword(u.id, next)
    if (!syncPw.ok) {
      showToast(syncPw.message ?? 'Gagal reset kata sandi di server.', 'error')
      return
    }
    showToast(
      `Kata sandi sementara untuk ${u.name.trim()}: ${next} — salin dan berikan ke pengguna secara aman.`,
      'success',
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">
          Akun guru &amp; staff
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola Kepsek, Kurikulum, BK, Guru Piket, dan Guru.
        </p>
        <div className="mt-4">
          <ModuleTabBar tabs={ADMIN_GURU_TABS} value={moduleTab} onChange={setModuleTab} />
        </div>
      </div>

      {moduleTab === 'kelola' ? (
        <>
      <form
        onSubmit={handleAdd}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-3"
      >
        <h2 className="sm:col-span-2 lg:col-span-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Plus className="h-4 w-4 text-brand-navy" />
          Tambah akun
        </h2>
        <div>
          <label className="text-xs font-medium text-slate-600">Nama</label>
          <input
            required
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">NIP</label>
          <input
            required
            value={nip}
            onChange={(e) => setNip(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Peran</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Jabatan</label>
          <input
            value={jabatan}
            onChange={(e) => setJabatan(e.target.value)}
            placeholder="Contoh: Guru IPA"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">
            Kata sandi awal
          </label>
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-navy py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-dark"
          >
            Simpan
          </button>
        </div>
      </form>

      {editing ? (
        <form
          onSubmit={saveEdit}
          className="space-y-4 rounded-2xl border border-brand-gold/40 bg-amber-50/50 p-6"
        >
          <h3 className="text-sm font-semibold text-slate-800">Edit akun</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium">Nama</label>
              <input
                required
                value={eNama}
                onChange={(e) => setENama(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">NIP</label>
              <input
                required
                value={eNip}
                onChange={(e) => setENip(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Peran</label>
              <select
                value={eRole}
                onChange={(e) => setERole(e.target.value as UserRole)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Jabatan</label>
              <input
                value={eJabatan}
                onChange={(e) => setEJabatan(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            {me?.role === 'super_admin' && eRole === 'guru_mapel' ? (
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={eIsMentor}
                    onChange={(e) => setEIsMentor(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Pembimbing lomba
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={eIsCoordinator}
                    onChange={(e) => setEIsCoordinator(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Koordinator kokurikuler
                </label>
                <p className="text-[11px] text-slate-500">
                  Wali kelas diatur lewat menu Penetapan Wali Kelas.
                </p>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <label className="text-xs font-medium">
                Kata sandi baru (opsional)
              </label>
              <input
                type="password"
                value={ePass}
                onChange={(e) => setEPass(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Kosongkan jika tidak diubah"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white"
            >
              Simpan
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border bg-white px-4 py-2 text-sm"
            >
              Batal
            </button>
          </div>
        </form>
      ) : null}
        </>
      ) : null}

      {moduleTab === 'daftar' ? (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <PaginatedTable
          rows={staffRows}
          pageSize={10}
          searchPlaceholder="Cari nama, NIP, atau peran…"
          searchFilter={(row, q) => {
            const u = row as User
            const hay = `${u.name} ${u.nip} ${ROLE_LABELS[u.role]} ${u.jabatan ?? ''}`
              .toLowerCase()
            return hay.includes(q)
          }}
        >
          {({ pageRows }) => (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Nama</th>
                    <th className="px-3 py-2">NIP</th>
                    <th className="px-3 py-2">Peran</th>
                    <th className="px-3 py-2">Jabatan</th>
                    <th className="px-3 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {(pageRows as User[]).map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-slate-100 hover:bg-slate-50/80"
                    >
                      <td className="px-3 py-2 font-medium">{u.name}</td>
                      <td className="px-3 py-2 font-mono text-xs">{u.nip}</td>
                      <td className="px-3 py-2">{ROLE_LABELS[u.role]}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {u.jabatan ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          title="Reset kata sandi cepat"
                          onClick={() => void quickResetPassword(u)}
                          className="inline-flex rounded p-1.5 text-slate-600 hover:bg-slate-100"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="inline-flex rounded p-1.5 text-brand-navy hover:bg-brand-navy/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={u.id === currentUserId}
                          onClick={() => {
                            if (
                              confirm(
                                `Hapus akun ${u.name}? Tindakan tidak dapat dibatalkan.`,
                              )
                            ) {
                              deleteUser(u.id)
                              showToast('Akun dihapus.', 'info')
                            }
                          }}
                          className="inline-flex rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PaginatedTable>
      </div>
      ) : null}
    </div>
  )
}
