import { useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'

function formatDateTime(ts: string) {
  return new Date(ts).toLocaleString('id-ID')
}

export function KelasSayaPage() {
  const user = useAuthStore((s) => s.user)
  const students = useDataStore((s) => s.students)
  const users = useDataStore((s) => s.users)
  const classes = useDataStore((s) => s.classes)
  const attendance = useDataStore((s) => s.attendance)
  const pointHistory = useDataStore((s) => s.pointHistory)
  const pointRedemptions = useDataStore((s) => s.pointRedemptions)
  const competitions = useDataStore((s) => s.competitions)
  const waliKelasNotes = useDataStore((s) => s.waliKelasNotes)
  const updateAttendanceByWaliKelas = useDataStore((s) => s.updateAttendanceByWaliKelas)
  const upsertWaliKelasNote = useDataStore((s) => s.upsertWaliKelasNote)
  const showToast = useUiStore((s) => s.showToast)

  const actorId = user?.id ?? ''
  const managedClassId = user?.managed_class_id ?? null
  const today = new Date().toISOString().slice(0, 10)

  const classStudents = useMemo(
    () => students.filter((s) => managedClassId && s.classId === managedClassId),
    [students, managedClassId],
  )

  const rows = classStudents.map((st) => {
    const profile = users.find((u) => u.id === st.userId)
    const todayAttendance = attendance
      .filter((a) => a.studentId === st.id && a.date === today)
      .sort((a, b) => b.period - a.period)[0]
    return {
      student: st,
      name: profile?.name ?? '—',
      nisn: profile?.nisn ?? '—',
      todayStatus: todayAttendance?.status ?? 'Belum dicatat',
      todayPeriod: todayAttendance?.period ?? null,
    }
  })

  const [selectedStudentId, setSelectedStudentId] = useState(rows[0]?.student.id ?? '')
  const [noteDraft, setNoteDraft] = useState('')
  const [attendancePatch, setAttendancePatch] = useState<'S' | 'I'>('S')

  const selected = rows.find((r) => r.student.id === selectedStudentId)
  const selectedStudent = selected?.student
  const selectedStudentName = selected?.name ?? '—'
  const selectedNote = selectedStudent
    ? waliKelasNotes.find((n) => n.teacherId === actorId && n.studentId === selectedStudent.id)
    : undefined

  const detailPointHistory = selectedStudent
    ? pointHistory.filter((x) => x.studentId === selectedStudent.id).slice(0, 30)
    : []
  const detailRedemptions = selectedStudent
    ? pointRedemptions.filter((x) => x.studentId === selectedStudent.id).slice(0, 30)
    : []
  const detailAttendance = selectedStudent
    ? attendance
        .filter((x) => x.studentId === selectedStudent.id)
        .sort((a, b) =>
          `${b.date}-${String(b.period).padStart(2, '0')}`.localeCompare(
            `${a.date}-${String(a.period).padStart(2, '0')}`,
          ),
        )
        .slice(0, 40)
    : []
  const detailCompetitions = selectedStudent
    ? competitions.filter((x) => x.studentId === selectedStudent.id).slice(0, 20)
    : []

  const saveNote = () => {
    if (!selectedStudent) return
    const res = upsertWaliKelasNote({
      actorId,
      studentId: selectedStudent.id,
      note: noteDraft || selectedNote?.note || '',
    })
    showToast(
      res.ok ? 'Catatan pembinaan wali kelas disimpan.' : res.message ?? 'Gagal menyimpan catatan.',
      res.ok ? 'success' : 'error',
    )
  }

  const patchAttendance = () => {
    if (!selectedStudent) return
    const period = selected?.todayPeriod ?? 1
    const res = updateAttendanceByWaliKelas({
      actorId,
      studentId: selectedStudent.id,
      date: today,
      period,
      status: attendancePatch,
    })
    showToast(
      res.ok ? 'Status absensi diperbarui oleh wali kelas.' : res.message ?? 'Gagal memperbarui absensi.',
      res.ok ? 'success' : 'error',
    )
  }

  const printPdf = () => {
    if (!selectedStudent) return
    const doc = new jsPDF()
    const cls = classes.find((c) => c.id === selectedStudent.classId)
    doc.setFontSize(14)
    doc.text('Rekap Perkembangan Siswa', 14, 14)
    doc.setFontSize(10)
    doc.text(`Nama: ${selectedStudentName}`, 14, 24)
    doc.text(`Kelas: ${cls?.name ?? '-'}`, 14, 30)
    doc.text(`Poin Saat Ini: ${selectedStudent.totalPoints}`, 14, 36)
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 42)
    let y = 52
    doc.text('Ringkasan Absensi (10 terbaru):', 14, y)
    y += 6
    detailAttendance.slice(0, 10).forEach((a) => {
      doc.text(`- ${a.date} jam ${a.period}: ${a.status}`, 16, y)
      y += 6
    })
    y += 2
    doc.text('Ringkasan Poin (10 terbaru):', 14, y)
    y += 6
    detailPointHistory.slice(0, 10).forEach((p) => {
      doc.text(`- ${formatDateTime(p.timestamp)} | ${p.pointsChanged} | ${p.reason}`, 16, y, {
        maxWidth: 175,
      })
      y += 6
    })
    doc.save(`rekap-perkembangan-${selectedStudentName.replace(/\s+/g, '-').toLowerCase()}.pdf`)
  }

  if (!user || user.role !== 'guru_mapel' || !user.is_walikelas || !managedClassId) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        Fitur Kelas Saya hanya untuk guru yang ditetapkan sebagai wali kelas.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Kelas Saya</h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitoring siswa kelas wali: read-only untuk data terintegrasi, edit hanya catatan pembinaan dan penyesuaian absensi S/I.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Daftar Siswa Kelas Saya</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">NISN</th>
                <th className="px-3 py-2">Total Poin</th>
                <th className="px-3 py-2">Status Hari Ini</th>
                <th className="px-3 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.student.id}
                  className={`border-t border-slate-100 ${r.student.totalPoints < 50 ? 'bg-red-50' : ''}`}
                >
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2">{r.nisn}</td>
                  <td className={`px-3 py-2 font-semibold ${r.student.totalPoints < 50 ? 'text-red-700' : ''}`}>
                    {r.student.totalPoints}
                  </td>
                  <td className="px-3 py-2">
                    {r.todayStatus}
                    {r.todayPeriod ? ` (Jam ${r.todayPeriod})` : ''}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(r.student.id)
                        const note = waliKelasNotes.find(
                          (n) => n.teacherId === actorId && n.studentId === r.student.id,
                        )
                        setNoteDraft(note?.note ?? '')
                      }}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Detail Siswa: {selectedStudentName}</h2>
            <button
              type="button"
              onClick={printPdf}
              className="rounded-lg bg-brand-navy px-3 py-2 text-xs font-semibold text-white"
            >
              Cetak Rekap Perkembangan
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Catatan Pembinaan Wali Kelas</label>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              className="mt-1 min-h-[84px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Tulis catatan pembinaan untuk siswa ini..."
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={saveNote}
                className="rounded border border-emerald-400 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
              >
                Simpan Catatan
              </button>
              {selectedNote?.updatedAt ? (
                <span className="text-xs text-slate-500">Update terakhir: {formatDateTime(selectedNote.updatedAt)}</span>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-medium text-slate-700">Koreksi absensi harian (khusus Sakit/Izin)</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={attendancePatch}
                onChange={(e) => setAttendancePatch(e.target.value as 'S' | 'I')}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
              >
                <option value="S">Sakit (S)</option>
                <option value="I">Izin (I)</option>
              </select>
              <button
                type="button"
                onClick={patchAttendance}
                className="rounded border border-slate-300 bg-white px-3 py-1 text-xs"
              >
                Update Absensi Hari Ini
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-3">
              <h3 className="text-xs font-semibold uppercase text-slate-600">Riwayat Pelanggaran & Penebusan</h3>
              <div className="mt-2 space-y-2 text-xs">
                {detailPointHistory.map((x) => (
                  <div key={x.id} className="rounded border border-slate-100 p-2">
                    <p className="font-medium">{x.reason}</p>
                    <p className="text-slate-500">{formatDateTime(x.timestamp)}</p>
                  </div>
                ))}
                {detailRedemptions.map((x) => (
                  <div key={x.id} className="rounded border border-emerald-100 bg-emerald-50 p-2">
                    <p className="font-medium">Penebusan: {x.activityType} (+{x.pointsRestored})</p>
                    <p className="text-slate-500">{formatDateTime(x.timestamp)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <h3 className="text-xs font-semibold uppercase text-slate-600">Rekap Absensi Semua Guru</h3>
              <div className="mt-2 space-y-2 text-xs">
                {detailAttendance.map((x) => (
                  <div key={x.id} className="rounded border border-slate-100 p-2">
                    <p className="font-medium">
                      {x.date} • Jam {x.period} • {x.status}
                    </p>
                    <p className="text-slate-500">Dicatat oleh: {users.find((u) => u.id === x.teacherId)?.name ?? x.teacherId}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <h3 className="text-xs font-semibold uppercase text-slate-600">Daftar Prestasi / Karantina</h3>
              <div className="mt-2 space-y-2 text-xs">
                {detailCompetitions.map((x) => (
                  <div key={x.id} className="rounded border border-slate-100 p-2">
                    <p className="font-medium">{x.competitionName}</p>
                    <p className="text-slate-500">
                      {x.quarantineDate} • {x.competitionStartDate} s.d. {x.competitionEndDate}
                    </p>
                    <p className="text-slate-500">Status: {x.status}</p>
                  </div>
                ))}
                {detailCompetitions.length === 0 ? (
                  <p className="text-slate-500">Belum ada data lomba/karantina.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
