import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Lock } from 'lucide-react'
import { PaginatedTable } from '../components/ui/PaginatedTable'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'
import type { AttendanceStatus, Student } from '../types/schema'

const STATUS_OPTIONS: AttendanceStatus[] = ['H', 'S', 'I', 'A', 'Bolos']

type Row = {
  student: Student
  studentName: string
  nisn: string
  locked: boolean
}

export function EAbsenPage() {
  const user = useAuthStore((s) => s.user)
  const showToast = useUiStore((s) => s.showToast)
  const students = useDataStore((s) => s.students)
  const classes = useDataStore((s) => s.classes)
  const getUserById = useDataStore((s) => s.getUserById)
  const setAttendanceStatus = useDataStore((s) => s.setAttendanceStatus)
  const getAttendanceKey = useDataStore((s) => s.getAttendanceKey)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [date, setDate] = useState(today)
  const [period, setPeriod] = useState(1)
  const [classId, setClassId] = useState('')

  useEffect(() => {
    if (!user || !classId) return
    const { getAttendanceKey, setAttendanceStatus } = useDataStore.getState()
    let applied = 0
    for (const s of useDataStore.getState().students) {
      if (s.classId !== classId) continue
      if (
        s.statusPrestasi !== 'lomba' &&
        s.statusPrestasi !== 'karantina_lomba'
      ) {
        continue
      }
      const ex = getAttendanceKey(s.id, date, period)
      if (!ex) {
        setAttendanceStatus({
          studentId: s.id,
          teacherId: user.id,
          date,
          period,
          status: 'Dispensasi',
        })
        applied += 1
      }
    }
    if (applied > 0) {
      useUiStore.getState().showToast(
        `Dispensasi otomatis untuk ${applied} siswa (lomba/karantina).`,
        'info',
      )
    }
  }, [classId, date, period, user])

  const rows: Row[] = useMemo(() => {
    if (!classId) return []
    return students
      .filter((s) => s.classId === classId)
      .map((student) => {
        const u = getUserById(student.userId)
        const locked =
          student.statusPrestasi === 'lomba' ||
          student.statusPrestasi === 'karantina_lomba'
        return {
          student,
          studentName: u?.name ?? '—',
          nisn: u?.nisn ?? '—',
          locked,
        }
      })
  }, [students, classId, getUserById])

  const handleStatus = (r: Row, status: AttendanceStatus) => {
    if (!user) return
    if (r.locked && status !== 'Dispensasi') return
    const finalStatus: AttendanceStatus = r.locked ? 'Dispensasi' : status
    const prev = getAttendanceKey(r.student.id, date, period)?.status
    setAttendanceStatus({
      studentId: r.student.id,
      teacherId: user.id,
      date,
      period,
      status: finalStatus,
    })
    if (!r.locked && finalStatus === 'Bolos' && prev !== 'Bolos') {
      showToast(
        `Bolos: poin siswa ${r.studentName} dikurangi sesuai master pelanggaran.`,
        'info',
      )
    } else {
      showToast(`Absensi ${r.studentName} disimpan.`, 'success')
    }
  }

  const getCurrentStatus = (studentId: string): AttendanceStatus => {
    const r = getAttendanceKey(studentId, date, period)
    if (r) return r.status
    const row = rows.find((x) => x.student.id === studentId)
    if (row?.locked) return 'Dispensasi'
    return 'H'
  }

  const pointHistory = useDataStore((s) => s.pointHistory)
  const classStudentIds = useMemo(
    () => new Set(rows.map((r) => r.student.id)),
    [rows],
  )
  const recentPointHistory = useMemo(
    () =>
      pointHistory
        .filter((ph) => classStudentIds.has(ph.studentId))
        .slice(0, 15),
    [pointHistory, classStudentIds],
  )
  const getUserByIdForHistory = useDataStore((s) => s.getUserById)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">
          e-Absen
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Guru Mapel mencatat kehadiran per kelas dan jam. Status{' '}
          <strong>Bolos</strong> memotong poin otomatis dari master pelanggaran
          (audit di Riwayat Poin).
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
        <div>
          <label className="text-xs font-medium text-slate-600">
            Jam ke-
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
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

      {!classId ? (
        <p className="text-sm text-slate-500">Pilih kelas untuk menampilkan siswa.</p>
      ) : (
        <PaginatedTable
          rows={rows}
          pageSize={15}
          searchPlaceholder="Cari nama atau NISN…"
          searchFilter={(row, q) => {
            const r = row as Row
            return `${r.studentName} ${r.nisn}`.toLowerCase().includes(q)
          }}
        >
          {({ pageRows }) => (
            <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Siswa</th>
                    <th className="px-3 py-2">NISN</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(pageRows as Row[]).map((r) => {
                    const current = getCurrentStatus(r.student.id)
                    return (
                      <tr
                        key={r.student.id}
                        className="border-t border-slate-100 hover:bg-slate-50/80"
                      >
                        <td className="px-3 py-2">
                          <div className="font-medium">{r.studentName}</div>
                          {r.locked ? (
                            <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-amber-700">
                              <Lock className="h-3 w-3" />
                              Lomba / Karantina — hanya Dispensasi
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {r.nisn}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={current}
                            disabled={r.locked}
                            onChange={(e) =>
                              handleStatus(
                                r,
                                e.target.value as AttendanceStatus,
                              )
                            }
                            className="w-full min-w-[8rem] rounded-lg border border-slate-200 px-2 py-1.5 text-sm disabled:bg-amber-50 disabled:text-amber-900"
                          >
                            {(r.locked
                              ? (['Dispensasi'] as AttendanceStatus[])
                              : STATUS_OPTIONS
                            ).map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </PaginatedTable>
      )}

      {classId && recentPointHistory.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">
            Riwayat poin (audit) — siswa kelas ini
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Mencatat pemotongan otomatis dari absensi Bolos dan perubahan lain.
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Waktu</th>
                  <th className="px-3 py-2">Siswa</th>
                  <th className="px-3 py-2">Δ Poin</th>
                  <th className="px-3 py-2">Oleh</th>
                  <th className="px-3 py-2">Alasan</th>
                </tr>
              </thead>
              <tbody>
                {recentPointHistory.map((ph) => {
                  const st = students.find((s) => s.id === ph.studentId)
                  const su = st ? getUserByIdForHistory(st.userId) : undefined
                  const ch = getUserByIdForHistory(ph.changerId)
                  return (
                    <tr
                      key={ph.id}
                      className="border-t border-slate-100 text-slate-700"
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {new Date(ph.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="px-3 py-2">{su?.name ?? ph.studentId}</td>
                      <td className="px-3 py-2 font-medium tabular-nums text-red-700">
                        {ph.pointsChanged}
                      </td>
                      <td className="px-3 py-2 text-xs">{ch?.name ?? '—'}</td>
                      <td className="px-3 py-2 text-xs">{ph.reason}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
