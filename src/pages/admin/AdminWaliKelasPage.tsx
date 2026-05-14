import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'

export function AdminWaliKelasPage() {
  const users = useDataStore((s) => s.users)
  const classes = useDataStore((s) => s.classes)
  const setWaliKelasAssignment = useDataStore((s) => s.setWaliKelasAssignment)
  const setTeacherClassAssignments = useDataStore((s) => s.setTeacherClassAssignments)
  const showToast = useUiStore((s) => s.showToast)

  const guruRows = users.filter((u) => u.role === 'guru_mapel')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Penetapan Wali Kelas</h1>
        <p className="mt-1 text-sm text-slate-600">
          Penetapan oleh kurikulum: wali kelas dan rombel mapel. Menu Kelas Saya muncul untuk guru yang punya kelas diampu.
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
                <th className="px-3 py-2">Kelas Wali</th>
                <th className="px-3 py-2">Rombel Diampu (Mapel)</th>
              </tr>
            </thead>
            <tbody>
              {guruRows.map((g) => (
                <tr key={g.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{g.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{g.nip}</td>
                  <td className="px-3 py-2">{g.is_walikelas ? 'Aktif' : 'Belum ditetapkan'}</td>
                  <td className="px-3 py-2 align-top">
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
                  <td className="px-3 py-2 align-top">
                    <div className="grid max-h-40 grid-cols-1 gap-1 overflow-auto rounded-lg border border-slate-200 p-2">
                      {classes.map((c) => {
                        const checked = (g.taught_class_ids ?? []).includes(c.id)
                        return (
                          <label key={c.id} className="inline-flex items-center gap-2 text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const nextSet = new Set(g.taught_class_ids ?? [])
                                if (e.target.checked) nextSet.add(c.id)
                                else nextSet.delete(c.id)
                                const res = setTeacherClassAssignments(g.id, Array.from(nextSet))
                                showToast(
                                  res.ok ? 'Rombel mapel diperbarui.' : res.message ?? 'Gagal memperbarui rombel.',
                                  res.ok ? 'success' : 'error',
                                )
                              }}
                            />
                            {c.name}
                          </label>
                        )
                      })}
                    </div>
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
