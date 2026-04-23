import { useMemo, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'
import type { CompetitionStatus } from '../types/schema'

const LEVEL_LABEL = {
  tingkat_sekolah: 'Tingkat Sekolah',
  tingkat_kota: 'Tingkat Kota',
  tingkat_provinsi_nasional: 'Tingkat Provinsi (Nasional)',
  tingkat_internasional: 'Tingkat Internasional',
}

const STATUS_LABEL: Record<CompetitionStatus, string> = {
  karantina_lomba: 'Karantina (persiapan lomba)',
  sedang_lomba: 'Sedang Berlomba',
  selesai: 'Selesai',
}

export function KegiatanLombaPage() {
  const authUser = useAuthStore((s) => s.user)
  const students = useDataStore((s) => s.students)
  const classes = useDataStore((s) => s.classes)
  const getUserById = useDataStore((s) => s.getUserById)
  const competitions = useDataStore((s) => s.competitions)
  const competitionStatusHistory = useDataStore((s) => s.competitionStatusHistory)
  const updateCompetitionStatus = useDataStore((s) => s.updateCompetitionStatus)
  const showToast = useUiStore((s) => s.showToast)
  const [historyStudentId, setHistoryStudentId] = useState('')
  const [statusDraft, setStatusDraft] = useState<Record<string, CompetitionStatus>>({})

  const actorId = authUser?.id ?? ''
  const canManage =
    authUser?.role === 'super_admin' ||
    authUser?.role === 'kesiswaan' ||
    (authUser?.role === 'guru_mapel' && !!authUser.isCompetitionMentor)

  const studentRows = useMemo(
    () =>
      students.map((s) => ({
        id: s.id,
        name: getUserById(s.userId)?.name ?? '—',
        className: classes.find((c) => c.id === s.classId)?.name ?? '—',
        statusPrestasi: s.statusPrestasi,
      })),
    [students, classes, getUserById],
  )
  const scopedCompetitions =
    authUser?.role === 'guru_mapel' ? competitions.filter((c) => c.mentorTeacherId === actorId) : competitions
  const selectedHistoryStudentId =
    historyStudentId || scopedCompetitions[0]?.studentId || studentRows[0]?.id || ''
  const historyRows = competitionStatusHistory
    .filter((h) => h.studentId === selectedHistoryStudentId)
    .slice(0, 40)

  const saveStatus = (competitionId: string, fallback: CompetitionStatus) => {
    const nextStatus = statusDraft[competitionId] ?? fallback
    const res = updateCompetitionStatus({ actorId, competitionId, status: nextStatus })
    showToast(
      res.ok ? 'Status lomba diperbarui.' : res.message ?? 'Gagal memperbarui status.',
      res.ok ? 'success' : 'error',
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">
          Kegiatan Lomba
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Guru pembimbing terpilih dapat mengatur status lomba siswa agar absensi otomatis terlindungi (Dispensasi).
        </p>
      </div>

      {!canManage ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Fitur tidak bisa diakses karena Anda bukan pembimbing lomba.
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">
          Daftar Kegiatan Lomba
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Siswa</th>
                <th className="px-3 py-2">Kelas</th>
                <th className="px-3 py-2">Lomba</th>
                <th className="px-3 py-2">Tingkat</th>
                <th className="px-3 py-2">Guru Pembimbing</th>
                <th className="px-3 py-2">Karantina</th>
                <th className="px-3 py-2">Periode Lomba</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {scopedCompetitions.map((c) => {
                const st = students.find((s) => s.id === c.studentId)
                const su = st ? getUserById(st.userId) : undefined
                const className = st
                  ? classes.find((x) => x.id === st.classId)?.name
                  : undefined
                const mentor = getUserById(c.mentorTeacherId)
                return (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{su?.name ?? c.studentId}</td>
                    <td className="px-3 py-2">{className ?? '—'}</td>
                    <td className="px-3 py-2">{c.competitionName}</td>
                    <td className="px-3 py-2">{LEVEL_LABEL[c.level]}</td>
                    <td className="px-3 py-2">{mentor?.name ?? '—'}</td>
                    <td className="px-3 py-2">{c.quarantineDate || '—'}</td>
                    <td className="px-3 py-2">
                      {c.competitionStartDate} s.d. {c.competitionEndDate}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        disabled={!canManage}
                        value={statusDraft[c.id] ?? c.status}
                        onChange={(e) =>
                          setStatusDraft((prev) => ({
                            ...prev,
                            [c.id]: e.target.value as CompetitionStatus,
                          }))
                        }
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                      >
                        {(Object.keys(STATUS_LABEL) as CompetitionStatus[]).map((k) => (
                          <option key={k} value={k}>
                            {STATUS_LABEL[k]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        disabled={!canManage}
                        onClick={() => saveStatus(c.id, c.status)}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs disabled:opacity-40"
                      >
                        Simpan Status
                      </button>
                    </td>
                  </tr>
                )
              })}
              {scopedCompetitions.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-xs text-slate-500" colSpan={9}>
                    Belum ada penugasan lomba untuk akun ini.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">
          Riwayat Status Lomba per Siswa
        </h2>
        <div className="mt-3 max-w-sm">
          <label className="text-xs font-medium text-slate-600">Pilih siswa</label>
          <select
            value={selectedHistoryStudentId}
            onChange={(e) => setHistoryStudentId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {studentRows.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.className})
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Waktu</th>
                <th className="px-3 py-2">Dari</th>
                <th className="px-3 py-2">Ke</th>
                <th className="px-3 py-2">Guru Pengubah</th>
                <th className="px-3 py-2">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((h) => (
                <tr key={h.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-xs">
                    {new Date(h.changedAt).toLocaleString('id-ID')}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {h.fromStatus ? STATUS_LABEL[h.fromStatus] : 'Awal'}
                  </td>
                  <td className="px-3 py-2 text-xs">{STATUS_LABEL[h.toStatus]}</td>
                  <td className="px-3 py-2 text-xs">
                    {getUserById(h.changedByTeacherId)?.name ?? h.changedByTeacherId}
                  </td>
                  <td className="px-3 py-2 text-xs">{h.note}</td>
                </tr>
              ))}
              {historyRows.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-xs text-slate-500" colSpan={5}>
                    Belum ada riwayat perubahan status lomba untuk siswa ini.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
