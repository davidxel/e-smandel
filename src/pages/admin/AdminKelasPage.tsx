import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PaginatedTable } from '../../components/ui/PaginatedTable'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import type { ClassRoom } from '../../types/schema'

export function AdminKelasPage() {
  const classes = useDataStore((s) => s.classes)
  const addClass = useDataStore((s) => s.addClass)
  const updateClass = useDataStore((s) => s.updateClass)
  const deleteClass = useDataStore((s) => s.deleteClass)
  const showToast = useUiStore((s) => s.showToast)

  const [nama, setNama] = useState('')
  const [editing, setEditing] = useState<ClassRoom | null>(null)
  const [eNama, setENama] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    addClass(nama)
    showToast('Kelas ditambahkan.', 'success')
    setNama('')
  }

  const openEdit = (c: ClassRoom) => {
    setEditing(c)
    setENama(c.name)
  }

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    updateClass(editing.id, eNama)
    showToast('Kelas diperbarui.', 'success')
    setEditing(null)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">
          Master kelas
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Daftar nama kelas di SMAN 8 Mandau (untuk siswa &amp; absensi).
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="w-full flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Plus className="h-4 w-4 text-brand-navy" />
          Tambah kelas
        </h2>
        <div className="min-w-[12rem] flex-1">
          <label className="text-xs font-medium text-slate-600">
            Nama kelas
          </label>
          <input
            required
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: X IPA 3"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-dark"
        >
          Simpan
        </button>
      </form>

      {editing ? (
        <form
          onSubmit={saveEdit}
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-brand-gold/40 bg-amber-50/50 p-6"
        >
          <div className="min-w-[12rem] flex-1">
            <label className="text-xs font-medium">Edit nama kelas</label>
            <input
              required
              value={eNama}
              onChange={(e) => setENama(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
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
        </form>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <PaginatedTable
          rows={classes}
          pageSize={12}
          searchPlaceholder="Cari nama kelas…"
          searchFilter={(row, q) => {
            const c = row as ClassRoom
            return c.name.toLowerCase().includes(q)
          }}
        >
          {({ pageRows }) => (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Nama kelas</th>
                    <th className="px-3 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {(pageRows as ClassRoom[]).map((c) => (
                    <tr
                      key={c.id}
                      className="border-t border-slate-100 hover:bg-slate-50/80"
                    >
                      <td className="px-3 py-2 font-medium">{c.name}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="inline-flex rounded p-1.5 text-brand-navy hover:bg-brand-navy/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `Hapus kelas "${c.name}"? Pastikan tidak ada siswa yang masih memakai kelas ini.`,
                              )
                            ) {
                              deleteClass(c.id)
                              showToast('Kelas dihapus.', 'info')
                            }
                          }}
                          className="inline-flex rounded p-1.5 text-red-600 hover:bg-red-50"
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
