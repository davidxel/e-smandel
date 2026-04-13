import { useMemo, useState } from 'react'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'
import type { CompetitionLevel, CompetitionStatus } from '../types/schema'

const LEVEL_LABEL: Record<CompetitionLevel, string> = {
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
  const students = useDataStore((s) => s.students)
  const users = useDataStore((s) => s.users)
  const classes = useDataStore((s) => s.classes)
  const getUserById = useDataStore((s) => s.getUserById)
  const competitions = useDataStore((s) => s.competitions)
  const competitionStatusHistory = useDataStore((s) => s.competitionStatusHistory)
  const upsertCompetition = useDataStore((s) => s.upsertCompetition)
  const deleteCompetition = useDataStore((s) => s.deleteCompetition)
  const showToast = useUiStore((s) => s.showToast)
  const [studentId, setStudentId] = useState('')
  const [competitionName, setCompetitionName] = useState('')
  const [level, setLevel] = useState<CompetitionLevel>('tingkat_sekolah')
  const [mentorTeacherId, setMentorTeacherId] = useState('')
  const [status, setStatus] = useState<CompetitionStatus>('karantina_lomba')
  const [historyStudentId, setHistoryStudentId] = useState('')

  const mentorRows = users.filter(
    (u) => u.role === 'guru_pembimbing' || u.role === 'guru_mapel',
  )

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
  const selectedHistoryStudentId = historyStudentId || studentRows[0]?.id || ''
  const historyRows = competitionStatusHistory
    .filter((h) => h.studentId === selectedHistoryStudentId)
    .slice(0, 40)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const res = upsertCompetition({
      studentId,
      competitionName,
      level,
      mentorTeacherId,
      status,
    })
    showToast(
      res.ok
        ? 'Kegiatan lomba disimpan. Status absensi siswa otomatis diamankan.'
        : res.message ?? 'Gagal menyimpan kegiatan lomba.',
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
          Atur lomba yang diikuti siswa, guru pembimbing, dan status karantina/sedang
          lomba agar absensi otomatis terlindungi (Dispensasi).
        </p>
      </div>

      <form
        onSubmit={submit}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"
      >
        <div>
          <label className="text-xs font-medium text-slate-600">Siswa</label>
          <select
            required
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">— Pilih siswa —</option>
            {studentRows.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.className})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Nama Lomba</label>
          <input
            required
            value={competitionName}
            onChange={(e) => setCompetitionName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Contoh: Olimpiade Matematika"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Jenis Lomba</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as CompetitionLevel)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {(Object.keys(LEVEL_LABEL) as CompetitionLevel[]).map((k) => (
              <option key={k} value={k}>
                {LEVEL_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Guru Pembimbing</label>
          <select
            required
            value={mentorTeacherId}
            onChange={(e) => setMentorTeacherId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">— Pilih guru pembimbing —</option>
            {mentorRows.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CompetitionStatus)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {(Object.keys(STATUS_LABEL) as CompetitionStatus[]).map((k) => (
              <option key={k} value={k}>
                {STATUS_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white"
          >
            Simpan Kegiatan Lomba
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">
          Daftar Kegiatan Lomba Aktif
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Siswa</th>
                <th className="px-3 py-2">Kelas</th>
                <th className="px-3 py-2">Lomba</th>
                <th className="px-3 py-2">Jenis</th>
                <th className="px-3 py-2">Guru Pembimbing</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {competitions.map((c) => {
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
                    <td className="px-3 py-2">{STATUS_LABEL[c.status]}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => {
                          deleteCompetition(c.id)
                          showToast('Kegiatan lomba dihapus.', 'info')
                        }}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                )
              })}
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
