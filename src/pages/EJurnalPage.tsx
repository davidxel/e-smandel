import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, History, Save } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'

export function EJurnalPage() {
  const user = useAuthStore((s) => s.user)
  const showToast = useUiStore((s) => s.showToast)

  const classes = useDataStore((s) => s.classes)
  const students = useDataStore((s) => s.students)
  const attendance = useDataStore((s) => s.attendance)
  const teachingJournals = useDataStore((s) => s.teachingJournals)

  const upsertTeachingJournal = useDataStore((s) => s.upsertTeachingJournal)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [date, setDate] = useState(today)
  const [classId, setClassId] = useState(user?.managed_class_id ?? classes[0]?.id ?? '')

  const [meetingNumber, setMeetingNumber] = useState<number>(1)
  const [text, setText] = useState('')

  const existing = useMemo(() => {
    if (!user || !classId || !date) return undefined
    return teachingJournals.find(
      (j) => j.teacherId === user.id && j.classId === classId && j.date === date,
    )
  }, [classId, date, teachingJournals, user])

  useEffect(() => {
    if (!user) return
    if (!classId || !date) return
    if (existing) {
      setMeetingNumber(existing.meetingNumber)
      setText(existing.text)
      return
    }
    setMeetingNumber(1)
    setText('')
  }, [classId, date, existing, user])

  const classStudentIds = useMemo(() => {
    return new Set(students.filter((s) => s.classId === classId).map((s) => s.id))
  }, [classId, students])

  const attendanceSummary = useMemo(() => {
    if (!user || !classId || !date) return { hasAttendance: false, count: 0 }
    let count = 0
    for (const a of attendance) {
      if (a.teacherId !== user.id) continue
      if (a.date !== date) continue
      if (!classStudentIds.has(a.studentId)) continue
      count += 1
    }
    return { hasAttendance: count > 0, count }
  }, [attendance, classId, classStudentIds, date, user])

  const journalHistory = useMemo(() => {
    if (!user) return []
    return teachingJournals
      .filter((j) => j.teacherId === user.id && (!classId || j.classId === classId))
      .slice()
      .sort((a, b) => {
        const dc = b.date.localeCompare(a.date)
        if (dc !== 0) return dc
        return b.updatedAt.localeCompare(a.updatedAt)
      })
  }, [teachingJournals, user, classId])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!classId) {
      showToast('Pilih kelas untuk menyimpan jurnal.', 'error')
      return
    }
    const result = upsertTeachingJournal({
      teacherId: user.id,
      classId,
      meetingNumber,
      date,
      text,
    })
    if (!result.ok) {
      showToast(result.message ?? 'Gagal menyimpan jurnal.', 'error')
      return
    }
    showToast('Jurnal mengajar disimpan.', 'success')
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">e-Jurnal</h1>
        <p className="mt-1 text-sm text-slate-600">
          Input jurnal mengajar berbasis tanggal dan kelas. Data tersimpan per kombinasi{' '}
          <span className="font-semibold">tanggal + kelas</span>.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <CalendarDays className="h-3.5 w-3.5" />
            Tanggal
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-600">Kelas</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">— Pilih kelas —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-800">Sinkron dengan absensi (berdasarkan tanggal)</p>
        <p className="mt-1 text-xs text-slate-600">
          {attendanceSummary.hasAttendance
            ? `Absensi sudah tercatat untuk tanggal ini (${attendanceSummary.count} entri).`
            : 'Belum ada absensi yang tercatat untuk tanggal ini.'}
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-600">Pertemuan ke berapa</label>
            <input
              type="number"
              min={1}
              value={meetingNumber}
              onChange={(e) => setMeetingNumber(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-50"
              disabled={!classId || !date}
            >
              <Save className="h-4 w-4" />
              Simpan jurnal
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Teks jurnal mengajar</label>
          <textarea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Tulis ringkasan kegiatan belajar, materi, dan catatan penting…"
          />
          {existing ? (
            <p className="mt-2 text-xs text-slate-500">
              Terakhir diperbarui: {new Date(existing.updatedAt).toLocaleString('id-ID')}
            </p>
          ) : null}
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-2">
          <History className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Riwayat jurnal</h2>
            <p className="mt-1 text-xs text-slate-600">
              {classId
                ? `Entri untuk kelas yang dipilih (${classes.find((c) => c.id === classId)?.name ?? ''}).`
                : 'Semua entri jurnal Anda (pilih kelas di atas untuk menyaring).'}
            </p>
          </div>
        </div>
        {journalHistory.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Belum ada jurnal tersimpan{classId ? ' untuk kelas ini' : ''}.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2">Kelas</th>
                  <th className="px-3 py-2">Pertemuan</th>
                  <th className="px-3 py-2">Ringkasan teks</th>
                  <th className="px-3 py-2">Diperbarui</th>
                </tr>
              </thead>
              <tbody>
                {journalHistory.map((j) => {
                  const className = classes.find((c) => c.id === j.classId)?.name ?? j.classId
                  const snippet =
                    j.text.length > 120 ? `${j.text.slice(0, 120).trim()}…` : j.text
                  const isCurrent = Boolean(existing && j.id === existing.id)
                  return (
                    <tr
                      key={j.id}
                      className={`border-t border-slate-100 text-slate-700 ${
                        isCurrent ? 'bg-slate-50/90' : ''
                      }`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap font-medium">{j.date}</td>
                      <td className="px-3 py-2">{className}</td>
                      <td className="px-3 py-2 tabular-nums">{j.meetingNumber}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{snippet}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-500">
                        {new Date(j.updatedAt).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

