import { useMemo, useState } from 'react'
import { ModuleTabBar } from '../../components/ui/ModuleTabBar'
import { PaginatedTable } from '../../components/ui/PaginatedTable'
import { useDataStore } from '../../store/dataStore'
import type { PointHistory } from '../../types/schema'

const SOURCE_LABELS: Record<PointHistory['source'], string> = {
  absensi: 'Absensi',
  pelanggaran: 'Pelanggaran',
  prestasi: 'Prestasi',
  reward: 'Reward',
  admin: 'Admin',
  import: 'Impor',
  penebusan: 'Penebusan',
}

type AuditTab = 'semua' | 'pelanggaran' | 'penebusan'

const TABS: { id: AuditTab; label: string }[] = [
  { id: 'semua', label: 'Semua perubahan' },
  { id: 'pelanggaran', label: 'Pelanggaran & admin' },
  { id: 'penebusan', label: 'Penebusan' },
]

export function AdminAuditPoinPage() {
  const pointHistory = useDataStore((s) => s.pointHistory)
  const users = useDataStore((s) => s.users)
  const students = useDataStore((s) => s.students)
  const [tab, setTab] = useState<AuditTab>('semua')

  const rows = useMemo(() => {
    const sorted = [...pointHistory].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    if (tab === 'semua') return sorted
    if (tab === 'penebusan') return sorted.filter((h) => h.source === 'penebusan')
    return sorted.filter((h) => h.source !== 'penebusan')
  }, [pointHistory, tab])

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? id.slice(0, 8)
  const studentLabel = (studentId: string) => {
    const st = students.find((s) => s.id === studentId)
    if (!st) return studentId.slice(0, 8)
    const u = users.find((x) => x.id === st.userId)
    return u?.name ?? studentId.slice(0, 8)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Audit trail poin</h1>
        <p className="mt-1 text-sm text-slate-600">
          Riwayat global perubahan poin: siapa yang mengubah, kapan, berapa poin, alasan, dan sumber data.
        </p>
        <div className="mt-4">
          <ModuleTabBar tabs={TABS} value={tab} onChange={setTab} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <PaginatedTable
          rows={rows}
          pageSize={15}
          searchPlaceholder="Cari nama siswa, pengubah, atau alasan…"
          searchFilter={(row, q) => {
            const h = row as PointHistory
            const hay = `${studentLabel(h.studentId)} ${userName(h.changerId)} ${h.reason} ${h.source}`
              .toLowerCase()
            return hay.includes(q)
          }}
        >
          {({ pageRows }) => (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Waktu</th>
                    <th className="px-3 py-2">Siswa</th>
                    <th className="px-3 py-2">Δ Poin</th>
                    <th className="px-3 py-2">Diubah oleh</th>
                    <th className="px-3 py-2">Sumber</th>
                    <th className="px-3 py-2">Alasan</th>
                  </tr>
                </thead>
                <tbody>
                  {(pageRows as PointHistory[]).map((h) => (
                    <tr key={h.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                        {new Date(h.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-800">{studentLabel(h.studentId)}</td>
                      <td
                        className={`px-3 py-2 font-semibold tabular-nums ${
                          h.pointsChanged >= 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {h.pointsChanged > 0 ? '+' : ''}
                        {h.pointsChanged}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{userName(h.changerId)}</td>
                      <td className="px-3 py-2 text-slate-600">{SOURCE_LABELS[h.source] ?? h.source}</td>
                      <td className="max-w-md px-3 py-2 text-slate-700">{h.reason.trim() || '—'}</td>
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
