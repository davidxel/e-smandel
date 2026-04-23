import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'

export function AdminWaliKelasPage() {
  const users = useDataStore((s) => s.users)
  const classes = useDataStore((s) => s.classes)
  const setWaliKelasAssignment = useDataStore((s) => s.setWaliKelasAssignment)
  const showToast = useUiStore((s) => s.showToast)

  const guruRows = users.filter((u) => u.role === 'guru_mapel')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Penetapan Wali Kelas</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tetapkan guru sebagai wali kelas. Menu Kelas Saya akan muncul otomatis untuk guru terpilih.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Guru</th>
                <th className="px-3 py-2">NIP</th>
                <th className="px-3 py-2">Status Wali Kelas</th>
                <th className="px-3 py-2">Kelas Diampu</th>
              </tr>
            </thead>
            <tbody>
              {guruRows.map((g) => (
                <tr key={g.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{g.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{g.nip}</td>
                  <td className="px-3 py-2">{g.is_walikelas ? 'Aktif' : 'Belum ditetapkan'}</td>
                  <td className="px-3 py-2">
                    <select
                      value={g.managed_class_id ?? ''}
                      onChange={(e) => {
                        const next = e.target.value || null
                        const res = setWaliKelasAssignment(g.id, next)
                        showToast(
                          res.ok ? 'Penetapan wali kelas diperbarui.' : res.message ?? 'Gagal memperbarui.',
                          res.ok ? 'success' : 'error',
                        )
                      }}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="">— Tidak menjadi wali kelas —</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
