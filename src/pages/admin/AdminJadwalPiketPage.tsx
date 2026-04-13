import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'

const DAY_OPTIONS = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: "Jum'at" },
  { value: 6, label: 'Sabtu' },
  { value: 0, label: 'Minggu' },
]

export function AdminJadwalPiketPage() {
  const users = useDataStore((s) => s.users)
  const setPiketSchedule = useDataStore((s) => s.setPiketSchedule)
  const showToast = useUiStore((s) => s.showToast)
  const guruRows = users.filter((u) => u.role === 'guru_mapel')

  const toggle = (userId: string, day: number) => {
    const target = guruRows.find((u) => u.id === userId)
    if (!target) return
    const next = target.piketScheduleDays.includes(day)
      ? target.piketScheduleDays.filter((d) => d !== day)
      : [...target.piketScheduleDays, day]
    setPiketSchedule(userId, next)
    showToast('Jadwal piket diperbarui.', 'success')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Manajemen Jadwal Piket</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tentukan hari tugas piket untuk Guru Mapel. Sistem akan mengaktifkan modul e-Poin sesuai jadwal.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Guru</th>
                <th className="px-3 py-2">Role</th>
                {DAY_OPTIONS.map((d) => (
                  <th key={d.value} className="px-3 py-2 text-center">{d.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guruRows.map((g) => (
                <tr key={g.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{g.name}</td>
                  <td className="px-3 py-2">{g.role}</td>
                  {DAY_OPTIONS.map((d) => {
                    const checked = g.piketScheduleDays.includes(d.value)
                    return (
                      <td key={d.value} className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(g.id, d.value)}
                          className="h-4 w-4 accent-brand-navy"
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
