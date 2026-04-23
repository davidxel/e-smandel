import { useMemo, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import type { CompetitionLevel, CompetitionStatus } from '../../types/schema'

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

export function AdminPembimbingLombaPage() {
  const actorId = useAuthStore((s) => s.user?.id ?? '')
  const users = useDataStore((s) => s.users)
  const students = useDataStore((s) => s.students)
  const classes = useDataStore((s) => s.classes)
  const competitions = useDataStore((s) => s.competitions)
  const getUserById = useDataStore((s) => s.getUserById)
  const upsertCompetition = useDataStore((s) => s.upsertCompetition)
  const deleteCompetition = useDataStore((s) => s.deleteCompetition)
  const showToast = useUiStore((s) => s.showToast)

  const [studentId, setStudentId] = useState('')
  const [competitionName, setCompetitionName] = useState('')
  const [mentorTeacherId, setMentorTeacherId] = useState('')
  const [quarantineDate, setQuarantineDate] = useState('')
  const [competitionStartDate, setCompetitionStartDate] = useState('')
  const [competitionEndDate, setCompetitionEndDate] = useState('')
  const [status, setStatus] = useState<CompetitionStatus>('karantina_lomba')
  const [level, setLevel] = useState<CompetitionLevel>('tingkat_sekolah')
  const [note, setNote] = useState('')

  const mentorRows = users.filter((u) => u.role === 'guru_mapel')
  const studentRows = useMemo(
    () =>
      students.map((s) => ({
        id: s.id,
        name: getUserById(s.userId)?.name ?? '—',
        className: classes.find((c) => c.id === s.classId)?.name ?? '—',
      })),
    [students, classes, getUserById],
  )

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const mergedName = note.trim() ? `${competitionName.trim()} (${note.trim()})` : competitionName
    const res = upsertCompetition({
      actorId,
      studentId,
      competitionName: mergedName,
      level,
      mentorTeacherId,
      quarantineDate,
      competitionStartDate,
      competitionEndDate,
      status,
    })
    showToast(res.ok ? 'Pembimbing lomba ditetapkan.' : res.message ?? 'Gagal menyimpan.', res.ok ? 'success' : 'error')
    if (res.ok) {
      setStudentId('')
      setCompetitionName('')
      setMentorTeacherId('')
      setQuarantineDate('')
      setCompetitionStartDate('')
      setCompetitionEndDate('')
      setStatus('karantina_lomba')
      setLevel('tingkat_sekolah')
      setNote('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Pemilihan Pembimbing Lomba</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pilih guru pembimbing per siswa dan lomba. Guru terpilih otomatis mendapatkan akses fitur Kegiatan Lomba.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"
      >
        <div>
          <label className="text-xs font-medium text-slate-600">Nama Guru</label>
          <select
            required
            value={mentorTeacherId}
            onChange={(e) => setMentorTeacherId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">— Pilih guru —</option>
            {mentorRows.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Nama Siswa</label>
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
          <label className="text-xs font-medium text-slate-600">Tanggal Karantina</label>
          <input
            required
            type="date"
            value={quarantineDate}
            onChange={(e) => setQuarantineDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Tanggal Lomba Mulai</label>
          <input
            required
            type="date"
            value={competitionStartDate}
            onChange={(e) => setCompetitionStartDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Tanggal Lomba Selesai</label>
          <input
            required
            type="date"
            value={competitionEndDate}
            onChange={(e) => setCompetitionEndDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Status Karantina / Lomba</label>
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
        <div>
          <label className="text-xs font-medium text-slate-600">Tingkat Lomba</label>
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
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-600">Fitur tambahan: Catatan Pendampingan</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Contoh: Fokus materi final, kebutuhan transport, dll."
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white"
          >
            Simpan Penugasan Pembimbing
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Daftar Penugasan Pembimbing Lomba</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Guru</th>
                <th className="px-3 py-2">Siswa</th>
                <th className="px-3 py-2">Lomba</th>
                <th className="px-3 py-2">Karantina</th>
                <th className="px-3 py-2">Mulai</th>
                <th className="px-3 py-2">Selesai</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Tingkat</th>
                <th className="px-3 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {competitions.map((c) => {
                const mentor = getUserById(c.mentorTeacherId)
                const st = students.find((s) => s.id === c.studentId)
                const su = st ? getUserById(st.userId) : null
                return (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{mentor?.name ?? '—'}</td>
                    <td className="px-3 py-2">{su?.name ?? '—'}</td>
                    <td className="px-3 py-2">{c.competitionName}</td>
                    <td className="px-3 py-2">{c.quarantineDate}</td>
                    <td className="px-3 py-2">{c.competitionStartDate}</td>
                    <td className="px-3 py-2">{c.competitionEndDate}</td>
                    <td className="px-3 py-2">{STATUS_LABEL[c.status]}</td>
                    <td className="px-3 py-2">{LEVEL_LABEL[c.level]}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => {
                          deleteCompetition(c.id)
                          showToast('Penugasan pembimbing dihapus.', 'info')
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
    </div>
  )
}
