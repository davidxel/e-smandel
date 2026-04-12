import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PaginatedTable } from '../../components/ui/PaginatedTable'
import { GURU_STAFF_ROLES } from '../../data/initialSeed'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import { ROLE_LABELS, type UserRole } from '../../types/roles'
import type { User } from '../../types/schema'

const ROLE_OPTIONS = GURU_STAFF_ROLES

export function AdminGuruPage() {
  const users = useDataStore((s) => s.users)
  const addStaffUser = useDataStore((s) => s.addStaffUser)
  const updateUser = useDataStore((s) => s.updateUser)
  const deleteUser = useDataStore((s) => s.deleteUser)
  const showToast = useUiStore((s) => s.showToast)
  const currentUserId = useAuthStore((s) => s.user?.id)

  const [nama, setNama] = useState('')
  const [nip, setNip] = useState('')
  const [role, setRole] = useState<UserRole>('guru_mapel')
  const [jabatan, setJabatan] = useState('')
  const [pass, setPass] = useState('demo123')

  const [editing, setEditing] = useState<User | null>(null)
  const [eNama, setENama] = useState('')
  const [eNip, setENip] = useState('')
  const [eRole, setERole] = useState<UserRole>('guru_mapel')
  const [eJabatan, setEJabatan] = useState('')
  const [ePass, setEPass] = useState('')

  const staffRows = users.filter((u) => ROLE_OPTIONS.includes(u.role))

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      addStaffUser({
        name: nama,
        nip,
        role,
        jabatan,
        password: pass || 'demo123',
      })
      showToast('Akun guru/staff ditambahkan.', 'success')
      setNama('')
      setNip('')
      setJabatan('')
      setPass('demo123')
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
  }

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    updateUser(editing.id, {
      name: eNama,
      nip: eNip.trim(),
      role: eRole,
      jabatan: eJabatan.trim() || null,
      ...(ePass.trim() ? { password: ePass.trim() } : {}),
    })
    showToast('Data pengguna diperbarui.', 'success')
    setEditing(null)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">
          Akun guru &amp; staff
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola Kepsek, BK, Guru Piket, Guru Mapel, dan Guru Pembimbing.
        </p>
      </div>

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
            placeholder="Contoh: Guru Mapel IPA"
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
    </div>
  )
}
