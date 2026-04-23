import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PaginatedTable } from '../../components/ui/PaginatedTable'
import { BOLOS_VIOLATION_SLUG } from '../../data/initialSeed'
import { pullWorkspaceFromServer } from '../../lib/pullWorkspace'
import { flushWorkspacePushNow } from '../../lib/workspaceSync'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import type { ViolationCategory, ViolationMaster } from '../../types/schema'

const CAT_LABEL: Record<ViolationCategory, string> = {
  ringan: 'Ringan',
  sedang: 'Sedang',
  berat: 'Berat',
}

export function AdminPelanggaranPage() {
  const violations = useDataStore((s) => s.violations)
  const addViolation = useDataStore((s) => s.addViolation)
  const updateViolation = useDataStore((s) => s.updateViolation)
  const deleteViolation = useDataStore((s) => s.deleteViolation)
  const showToast = useUiStore((s) => s.showToast)

  const [nama, setNama] = useState('')
  const [poin, setPoin] = useState(5)
  const [cat, setCat] = useState<ViolationCategory>('ringan')

  const [editing, setEditing] = useState<ViolationMaster | null>(null)
  const [eNama, setENama] = useState('')
  const [ePoin, setEPoin] = useState(0)
  const [eCat, setECat] = useState<ViolationCategory>('ringan')

  useEffect(() => {
    void pullWorkspaceFromServer()
  }, [])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    addViolation({ name: nama, points: poin, category: cat })
    flushWorkspacePushNow()
    showToast('Pelanggaran ditambahkan.', 'success')
    setNama('')
    setPoin(5)
    setCat('ringan')
  }

  const openEdit = (v: ViolationMaster) => {
    setEditing(v)
    setENama(v.name)
    setEPoin(v.points)
    setECat(v.category)
  }

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    updateViolation(editing.id, {
      name: eNama,
      points: ePoin,
      category: eCat,
    })
    flushWorkspacePushNow()
    showToast('Data diperbarui.', 'success')
    setEditing(null)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">
          Master pelanggaran
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Kategori Ringan/Sedang/Berat dan bobot poin. Entri &quot;Bolos&quot;
          dipakai otomatis oleh absensi.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
      >
        <h2 className="sm:col-span-2 lg:col-span-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Plus className="h-4 w-4 text-brand-navy" />
          Tambah pelanggaran
        </h2>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-slate-600">Nama</label>
          <input
            required
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Poin</label>
          <input
            type="number"
            min={1}
            value={poin}
            onChange={(e) => setPoin(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Kategori</label>
          <select
            value={cat}
            onChange={(e) =>
              setCat(e.target.value as ViolationCategory)
            }
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {(Object.keys(CAT_LABEL) as ViolationCategory[]).map((k) => (
              <option key={k} value={k}>
                {CAT_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="rounded-xl bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-dark"
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
          <h3 className="text-sm font-semibold text-slate-800">Edit</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="text-xs font-medium">Nama</label>
              <input
                required
                value={eNama}
                onChange={(e) => setENama(e.target.value)}
                disabled={editing.slug === BOLOS_VIOLATION_SLUG}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Poin</label>
              <input
                type="number"
                min={1}
                value={ePoin}
                onChange={(e) => setEPoin(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Kategori</label>
              <select
                value={eCat}
                onChange={(e) =>
                  setECat(e.target.value as ViolationCategory)
                }
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                {(Object.keys(CAT_LABEL) as ViolationCategory[]).map((k) => (
                  <option key={k} value={k}>
                    {CAT_LABEL[k]}
                  </option>
                ))}
              </select>
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
          rows={violations}
          pageSize={10}
          searchPlaceholder="Cari nama atau kategori…"
          searchFilter={(row, q) => {
            const v = row as ViolationMaster
            const hay = `${v.name} ${CAT_LABEL[v.category]} ${v.slug}`
              .toLowerCase()
            return hay.includes(q)
          }}
        >
          {({ pageRows }) => (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Nama</th>
                    <th className="px-3 py-2">Kategori</th>
                    <th className="px-3 py-2">Poin</th>
                    <th className="px-3 py-2">Slug</th>
                    <th className="px-3 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {(pageRows as ViolationMaster[]).map((v) => (
                    <tr
                      key={v.id}
                      className="border-t border-slate-100 hover:bg-slate-50/80"
                    >
                      <td className="px-3 py-2 font-medium">{v.name}</td>
                      <td className="px-3 py-2">{CAT_LABEL[v.category]}</td>
                      <td className="px-3 py-2 tabular-nums">{v.points}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-500">
                        {v.slug}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(v)}
                          className="inline-flex rounded p-1.5 text-brand-navy hover:bg-brand-navy/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={v.slug === BOLOS_VIOLATION_SLUG}
                          onClick={() => {
                            if (confirm(`Hapus "${v.name}"?`)) {
                              deleteViolation(v.id)
                              flushWorkspacePushNow()
                              showToast('Dihapus.', 'info')
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
