import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'

export function AdminKoordinatorKokurikulerPage() {
  const users = useDataStore((s) => s.users)
  const setKokurikulerCoordinator = useDataStore((s) => s.setKokurikulerCoordinator)
  const showToast = useUiStore((s) => s.showToast)

  const guruRows = users.filter((u) => u.role === 'guru_mapel')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">
          Penetapan Koordinator Projek Kokurikuler
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Tentukan guru yang bertugas sebagai koordinator projek kokurikuler.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Guru</th>
                <th className="px-3 py-2">NIP</th>
                <th className="px-3 py-2">Koordinator</th>
              </tr>
            </thead>
            <tbody>
              {guruRows.map((g) => (
                <tr key={g.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{g.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{g.nip}</td>
                  <td className="px-3 py-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!g.isKokurikulerCoordinator}
                        onChange={(e) => {
                          const res = setKokurikulerCoordinator(g.id, e.target.checked)
                          showToast(
                            res.ok
                              ? 'Koordinator projek kokurikuler diperbarui.'
                              : res.message ?? 'Gagal memperbarui koordinator.',
                            res.ok ? 'success' : 'error',
                          )
                        }}
                        className="h-4 w-4 accent-brand-navy"
                      />
                      <span>
                        {g.isKokurikulerCoordinator ? 'Aktif sebagai koordinator' : 'Tetapkan sebagai koordinator'}
                      </span>
                    </label>
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
