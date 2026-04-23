import { useEffect, useMemo, useState } from 'react'
import { FileUploader } from '../components/ui/FileUploader'
import { pullWorkspaceFromServer } from '../lib/pullWorkspace'
import { buildSmsUrl, buildWhatsAppUrl } from '../lib/userDisplay'
import { flushWorkspacePushNow } from '../lib/workspaceSync'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'

const QUICK_ACTIVITY = ['Kerja Bakti', 'Literasi Perpustakaan', 'Bersih Musholla']

export function ModePiketPage() {
  const user = useAuthStore((s) => s.user)
  const showToast = useUiStore((s) => s.showToast)
  const users = useDataStore((s) => s.users)
  const students = useDataStore((s) => s.students)
  const classes = useDataStore((s) => s.classes)
  const violations = useDataStore((s) => s.violations)
  const attendance = useDataStore((s) => s.attendance)
  const getUserById = useDataStore((s) => s.getUserById)
  const applyQuickViolation = useDataStore((s) => s.applyQuickViolation)
  const redeemStudentPoints = useDataStore((s) => s.redeemStudentPoints)
  const addAchievementPoints = useDataStore((s) => s.addAchievementPoints)
  const addLateArrival = useDataStore((s) => s.addLateArrival)
  const lateArrivals = useDataStore((s) => s.lateArrivals)
  const addGuestVisit = useDataStore((s) => s.addGuestVisit)
  const guestVisits = useDataStore((s) => s.guestVisits)
  const addKbmLog = useDataStore((s) => s.addKbmLog)
  const kbmLogs = useDataStore((s) => s.kbmLogs)
  const [studentViolation, setStudentViolation] = useState('')
  const [violationId, setViolationId] = useState('')
  const [studentRedeem, setStudentRedeem] = useState('')
  const [activityType, setActivityType] = useState(QUICK_ACTIVITY[0])
  const [pointsRestore, setPointsRestore] = useState(5)
  const [proof, setProof] = useState('')
  const [studentPrestasi, setStudentPrestasi] = useState('')
  const [prestasiPoints, setPrestasiPoints] = useState(5)
  const [prestasiReason, setPrestasiReason] = useState('')
  const [lateStudentId, setLateStudentId] = useState('')
  const [lateReason, setLateReason] = useState('')
  const [lateFollowUpViolationId, setLateFollowUpViolationId] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestPosition, setGuestPosition] = useState('')
  const [guestPurpose, setGuestPurpose] = useState('')
  const [kbmPeriod, setKbmPeriod] = useState(1)
  const [kbmTeacherId, setKbmTeacherId] = useState('')
  const [kbmClassId, setKbmClassId] = useState('')
  const [kbmNote, setKbmNote] = useState('')
  const [notifPayload, setNotifPayload] = useState<{
    phone: string
    message: string
    title: string
  } | null>(null)
  const [date] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    void pullWorkspaceFromServer()
  }, [])

  const getGrade = (className: string): 'X' | 'XI' | 'XII' | null => {
    const n = className.trim().toUpperCase()
    if (n.startsWith('XII')) return 'XII'
    if (n.startsWith('XI')) return 'XI'
    if (n.startsWith('X')) return 'X'
    return null
  }

  const rows = useMemo(
    () =>
      students.map((st) => ({
        id: st.id,
        className: classes.find((c) => c.id === st.classId)?.name ?? '—',
        name: getUserById(st.userId)?.name ?? '—',
        nisn: getUserById(st.userId)?.nisn ?? '—',
      })),
    [students, classes, getUserById],
  )
  const terlambat = violations.find((v) => v.slug === 'terlambat')
  const todaysAttendance = attendance.filter((a) => a.date === date)
  const todaysNotPresent = todaysAttendance.filter((a) => a.status !== 'H')

  const notPresentByStudent = useMemo(() => {
    const map = new Map<
      string,
      { studentId: string; name: string; nisn: string; className: string; grade: 'X' | 'XI' | 'XII' | null; statuses: Set<string> }
    >()
    for (const a of todaysNotPresent) {
      const st = students.find((s) => s.id === a.studentId)
      if (!st) continue
      const u = getUserById(st.userId)
      const className = classes.find((c) => c.id === st.classId)?.name ?? '—'
      const grade = getGrade(className)
      const key = st.id
      const ex = map.get(key)
      if (ex) {
        ex.statuses.add(`${a.status} (jam ${a.period})`)
      } else {
        map.set(key, {
          studentId: st.id,
          name: u?.name ?? '—',
          nisn: u?.nisn ?? '—',
          className,
          grade,
          statuses: new Set([`${a.status} (jam ${a.period})`]),
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.className.localeCompare(b.className) || a.name.localeCompare(b.name))
  }, [todaysNotPresent, students, classes, getUserById])

  const notPresentByGrade = useMemo(() => {
    const base = { X: [] as typeof notPresentByStudent, XI: [] as typeof notPresentByStudent, XII: [] as typeof notPresentByStudent }
    for (const item of notPresentByStudent) {
      if (item.grade === 'X') base.X.push(item)
      else if (item.grade === 'XI') base.XI.push(item)
      else if (item.grade === 'XII') base.XII.push(item)
    }
    return base
  }, [notPresentByStudent])

  if (!user) return null

  const submitQuickViolation = (e: React.FormEvent) => {
    e.preventDefault()
    const selected = violationId || terlambat?.id
    if (!studentViolation || !selected) {
      showToast('Pilih siswa dan pelanggaran.', 'error')
      return
    }
    const res = applyQuickViolation({
      studentId: studentViolation,
      teacherId: user.id,
      violationId: selected,
    })
    if (res.ok) {
      flushWorkspacePushNow()
      const st = students.find((s) => s.id === studentViolation)
      const stUser = st ? getUserById(st.userId) : undefined
      if (st && stUser) {
        const v = violations.find((x) => x.id === selected)
        setNotifPayload({
          phone: st.parentPhone,
          message: `Notifikasi e-Smandel: ${stUser.name} mendapat pelanggaran "${v?.name ?? 'Pelanggaran'}" (${v?.points ?? 0} poin).`,
          title: 'Validasi Notifikasi Pelanggaran',
        })
      }
    }
    showToast(res.ok ? 'Pelanggaran tercatat dan poin terpotong.' : res.message ?? 'Gagal.', res.ok ? 'success' : 'error')
  }

  const submitRedemption = (e: React.FormEvent) => {
    e.preventDefault()
    if (!proof) {
      showToast('Bukti foto wajib ada.', 'error')
      return
    }
    const res = redeemStudentPoints({
      studentId: studentRedeem,
      teacherId: user.id,
      activityType,
      pointsRestored: pointsRestore,
      proofPhotoDataUrl: proof,
    })
    if (res.ok) {
      flushWorkspacePushNow()
      const st = students.find((s) => s.id === studentRedeem)
      const stUser = st ? getUserById(st.userId) : undefined
      if (st && stUser) {
        setNotifPayload({
          phone: st.parentPhone,
          message: `Notifikasi e-Smandel: Penebusan poin ${stUser.name} disetujui untuk kegiatan "${activityType}".`,
          title: 'Validasi Notifikasi Penebusan',
        })
      }
    }
    showToast(res.ok ? 'Penebusan disetujui.' : res.message ?? 'Gagal.', res.ok ? 'success' : 'error')
  }

  const submitPrestasi = (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentPrestasi) {
      showToast('Pilih siswa untuk poin prestasi.', 'error')
      return
    }
    const res = addAchievementPoints({
      studentId: studentPrestasi,
      teacherId: user.id,
      points: prestasiPoints,
      reason: prestasiReason || 'Pencapaian prestasi siswa',
    })
    if (res.ok) {
      flushWorkspacePushNow()
      const st = students.find((s) => s.id === studentPrestasi)
      const stUser = st ? getUserById(st.userId) : undefined
      if (st && stUser) {
        setNotifPayload({
          phone: st.parentPhone,
          message: `Notifikasi e-Smandel: ${stUser.name} mendapat poin prestasi (+${prestasiPoints}) karena ${prestasiReason || 'pencapaian prestasi'}.`,
          title: 'Validasi Notifikasi Prestasi',
        })
      }
    }
    showToast(
      res.ok ? 'Poin prestasi berhasil ditambahkan.' : res.message ?? 'Gagal memproses prestasi.',
      res.ok ? 'success' : 'error',
    )
  }

  const submitLateArrival = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lateStudentId) {
      showToast('Pilih siswa (NISN sinkron dari akun siswa).', 'error')
      return
    }
    const res = addLateArrival({
      date,
      studentId: lateStudentId,
      reason: lateReason,
      createdByUserId: user.id,
      followUpViolationId: lateFollowUpViolationId || null,
    })
    showToast(
      res.ok
        ? 'Keterlambatan tercatat. Poin otomatis terpotong dan masuk ke e-Poin.'
        : res.message ?? 'Gagal mencatat keterlambatan.',
      res.ok ? 'success' : 'error',
    )
    if (res.ok) {
      flushWorkspacePushNow()
      setLateReason('')
      setLateFollowUpViolationId('')
      setLateStudentId('')
    }
  }

  const submitGuestVisit = (e: React.FormEvent) => {
    e.preventDefault()
    const res = addGuestVisit({
      date,
      name: guestName,
      position: guestPosition,
      purpose: guestPurpose,
      createdByUserId: user.id,
    })
    showToast(res.ok ? 'Tamu tersimpan.' : res.message ?? 'Gagal menyimpan tamu.', res.ok ? 'success' : 'error')
    if (res.ok) {
      flushWorkspacePushNow()
      setGuestName('')
      setGuestPosition('')
      setGuestPurpose('')
    }
  }

  const submitKbmLog = (e: React.FormEvent) => {
    e.preventDefault()
    const res = addKbmLog({
      date,
      period: kbmPeriod,
      teacherId: kbmTeacherId,
      classId: kbmClassId,
      note: kbmNote,
      createdByUserId: user.id,
    })
    showToast(res.ok ? 'Log KBM tersimpan.' : res.message ?? 'Gagal menyimpan log KBM.', res.ok ? 'success' : 'error')
    if (res.ok) {
      flushWorkspacePushNow()
      setKbmNote('')
      setKbmPeriod(1)
      setKbmTeacherId('')
      setKbmClassId('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">e-Piket</h1>
        <p className="mt-1 text-sm text-slate-600">
          Piket: keterlambatan (sinkron e-Poin), pelanggaran cepat, daftar tamu, log KBM, dan rekap absen global harian.
        </p>
      </div>
      {notifPayload ? (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-sm font-semibold text-indigo-900">{notifPayload.title}</p>
          <p className="mt-1 text-xs text-indigo-800">
            Pilih kanal pengiriman notifikasi ke orang tua: {notifPayload.phone || 'nomor belum diisi'}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const wa = buildWhatsAppUrl(notifPayload.phone, notifPayload.message)
                if (wa) window.open(wa, '_blank', 'noopener,noreferrer')
                else showToast('Nomor orang tua belum valid untuk WhatsApp.', 'error')
              }}
              className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white"
            >
              Validasi via WhatsApp
            </button>
            <button
              type="button"
              onClick={() => {
                const sms = buildSmsUrl(notifPayload.phone, notifPayload.message)
                if (sms) window.open(sms, '_blank', 'noopener,noreferrer')
                else showToast('Nomor orang tua belum valid untuk SMS.', 'error')
              }}
              className="rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold text-white"
            >
              Validasi via SMS
            </button>
            <button
              type="button"
              onClick={() => setNotifPayload(null)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              Tutup
            </button>
          </div>
        </div>
      ) : null}
      <form onSubmit={submitQuickViolation} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Input Pelanggaran Cepat</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <select value={studentViolation} onChange={(e) => setStudentViolation(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">— Pilih siswa —</option>
            {rows.map((r) => (
              <option key={r.id} value={r.id}>{r.name} ({r.className})</option>
            ))}
          </select>
          <select value={violationId} onChange={(e) => setViolationId(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">Terlambat (default)</option>
            {violations.map((v) => (
              <option key={v.id} value={v.id}>{v.name} (-{v.points})</option>
            ))}
          </select>
        </div>
        <button className="w-fit rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white" type="submit">Catat Pelanggaran</button>
      </form>

      <form onSubmit={submitLateArrival} className="grid gap-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Keterlambatan Siswa (sinkron e-Poin)</h2>
        <p className="text-xs text-slate-600">
          Data berisi hari/tanggal, NISN (sinkron dari akun siswa), nama, kelas, dan alasan. Saat disimpan, poin otomatis terpotong memakai master pelanggaran <span className="font-semibold">Terlambat</span>.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <select
            value={lateStudentId}
            onChange={(e) => setLateStudentId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">— Pilih siswa (NISN · Nama · Kelas) —</option>
            {rows
              .slice()
              .sort((a, b) => `${a.className}${a.name}`.localeCompare(`${b.className}${b.name}`))
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nisn} · {r.name} ({r.className})
                </option>
              ))}
          </select>
          <select
            value={lateFollowUpViolationId}
            onChange={(e) => setLateFollowUpViolationId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">— Tindak lanjut (opsional): kurangi poin lagi —</option>
            {violations.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} (-{v.points})
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={lateReason}
          onChange={(e) => setLateReason(e.target.value)}
          rows={3}
          placeholder="Alasan/keterangan (contoh: terlambat karena hujan, ban bocor, dll.)"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <button className="w-fit rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white" type="submit">
          Simpan keterlambatan & potong poin
        </button>

        <div className="mt-2 overflow-x-auto rounded-xl border border-amber-200 bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-amber-50 text-xs uppercase text-amber-900/70">
              <tr>
                <th className="px-3 py-2">Tanggal</th>
                <th className="px-3 py-2">NISN</th>
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Kelas</th>
                <th className="px-3 py-2">Keterangan</th>
                <th className="px-3 py-2">Tindak lanjut</th>
              </tr>
            </thead>
            <tbody>
              {lateArrivals.filter((x) => x.date === date).length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-xs text-slate-500" colSpan={6}>
                    Belum ada data keterlambatan untuk tanggal ini.
                  </td>
                </tr>
              ) : (
                lateArrivals
                  .filter((x) => x.date === date)
                  .map((x) => {
                    const fu = x.followUpViolationId
                      ? violations.find((v) => v.id === x.followUpViolationId)?.name ?? x.followUpViolationId
                      : '—'
                    return (
                      <tr key={x.id} className="border-t border-amber-100">
                        <td className="px-3 py-2 whitespace-nowrap">{x.date}</td>
                        <td className="px-3 py-2 font-mono text-xs">{x.nisn}</td>
                        <td className="px-3 py-2">{x.studentName}</td>
                        <td className="px-3 py-2">{x.className}</td>
                        <td className="px-3 py-2 text-xs text-slate-600">{x.reason}</td>
                        <td className="px-3 py-2 text-xs">{fu}</td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>
      </form>

      <form onSubmit={submitGuestVisit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Daftar Tamu Sekolah</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Nama tamu"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={guestPosition}
            onChange={(e) => setGuestPosition(e.target.value)}
            placeholder="Jabatan"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <input
          value={guestPurpose}
          onChange={(e) => setGuestPurpose(e.target.value)}
          placeholder="Maksud kunjungan"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button className="w-fit rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white" type="submit">
          Simpan tamu
        </button>

        <div className="mt-2 overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Tanggal</th>
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Jabatan</th>
                <th className="px-3 py-2">Maksud</th>
              </tr>
            </thead>
            <tbody>
              {guestVisits.filter((x) => x.date === date).length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-xs text-slate-500" colSpan={4}>
                    Belum ada data tamu untuk tanggal ini.
                  </td>
                </tr>
              ) : (
                guestVisits
                  .filter((x) => x.date === date)
                  .map((x) => (
                    <tr key={x.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 whitespace-nowrap">{x.date}</td>
                      <td className="px-3 py-2">{x.name}</td>
                      <td className="px-3 py-2">{x.position}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{x.purpose}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </form>

      <form onSubmit={submitKbmLog} className="grid gap-4 rounded-2xl border border-sky-200 bg-sky-50/40 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Guru Melaksanakan KBM di Kelas</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <input
            type="number"
            min={1}
            value={kbmPeriod}
            onChange={(e) => setKbmPeriod(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            placeholder="Jam ke-"
          />
          <select
            value={kbmTeacherId}
            onChange={(e) => setKbmTeacherId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">— Pilih guru —</option>
            {users
              .filter((u) => u.role === 'guru_mapel' || u.role === 'guru_piket')
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
          <select
            value={kbmClassId}
            onChange={(e) => setKbmClassId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">— Pilih kelas —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <input
          value={kbmNote}
          onChange={(e) => setKbmNote(e.target.value)}
          placeholder="Catatan (opsional)"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <button className="w-fit rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white" type="submit">
          Simpan log KBM
        </button>

        <div className="mt-2 overflow-x-auto rounded-xl border border-sky-200 bg-white">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-sky-50 text-xs uppercase text-sky-900/70">
              <tr>
                <th className="px-3 py-2">Tanggal</th>
                <th className="px-3 py-2">Jam</th>
                <th className="px-3 py-2">Guru</th>
                <th className="px-3 py-2">Kelas</th>
                <th className="px-3 py-2">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {kbmLogs.filter((x) => x.date === date).length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-xs text-slate-500" colSpan={5}>
                    Belum ada log KBM untuk tanggal ini.
                  </td>
                </tr>
              ) : (
                kbmLogs
                  .filter((x) => x.date === date)
                  .slice()
                  .sort((a, b) => a.period - b.period)
                  .map((x) => (
                    <tr key={x.id} className="border-t border-sky-100">
                      <td className="px-3 py-2 whitespace-nowrap">{x.date}</td>
                      <td className="px-3 py-2">Jam {x.period}</td>
                      <td className="px-3 py-2">{x.teacherName}</td>
                      <td className="px-3 py-2">{x.className}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{x.note || '—'}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Poin Siswa (Kontrol Piket)</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Siswa</th>
                <th className="px-3 py-2">Kelas</th>
                <th className="px-3 py-2">Status Lomba</th>
                <th className="px-3 py-2">Total Poin</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const nama = getUserById(s.userId)?.name ?? '—'
                const kelas = classes.find((c) => c.id === s.classId)?.name ?? '—'
                return (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{nama}</td>
                    <td className="px-3 py-2">{kelas}</td>
                    <td className="px-3 py-2 text-xs">{s.statusPrestasi}</td>
                    <td className="px-3 py-2 font-semibold tabular-nums">{s.totalPoints}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={submitRedemption} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Konfirmasi Penebusan Poin</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <select value={studentRedeem} onChange={(e) => setStudentRedeem(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">— Pilih siswa —</option>
            {rows.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <select value={activityType} onChange={(e) => setActivityType(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            {QUICK_ACTIVITY.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <input type="number" min={1} max={100} value={pointsRestore} onChange={(e) => setPointsRestore(Number(e.target.value))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <FileUploader
          label="Foto bukti kegiatan"
          accept="image/*"
          description="Wajib unggah sebelum penebusan diproses."
          onDataUrl={(url) => setProof(url)}
        />
        <button className="w-fit rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white" type="submit">Setujui Penebusan</button>
      </form>

      <form onSubmit={submitPrestasi} className="grid gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Input Poin Prestasi (bukan penebusan)</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <select value={studentPrestasi} onChange={(e) => setStudentPrestasi(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">— Pilih siswa —</option>
            {rows.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={prestasiPoints}
            onChange={(e) => setPrestasiPoints(Number(e.target.value))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={prestasiReason}
            onChange={(e) => setPrestasiReason(e.target.value)}
            placeholder="Contoh: Juara lomba kelas"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <button className="w-fit rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white" type="submit">
          Tambah Poin Prestasi
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Rekap Absen Global ({date})</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Kelas</th>
                <th className="px-3 py-2">Siswa</th>
                <th className="px-3 py-2">Jam</th>
                <th className="px-3 py-2">Status Lomba</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {todaysAttendance.map((a) => {
                const st = students.find((s) => s.id === a.studentId)
                const name = st ? getUserById(st.userId)?.name : a.studentId
                const className = st ? classes.find((c) => c.id === st.classId)?.name : '—'
                return (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{className}</td>
                    <td className="px-3 py-2">{name}</td>
                    <td className="px-3 py-2">{a.period}</td>
                    <td className="px-3 py-2 text-xs">{st?.statusPrestasi ?? 'normal'}</td>
                    <td className="px-3 py-2">{a.status}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">
          Siswa Tidak Hadir / Bermasalah ({date})
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Fokus penyisiran untuk status selain Hadir (H).
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(['X', 'XI', 'XII'] as const).map((g) => {
            const list = notPresentByGrade[g]
            return (
              <div key={g} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-700">Tingkat {g}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{list.length}</p>
                <p className="text-xs text-slate-600">siswa tidak hadir / bermasalah</p>
              </div>
            )
          })}
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Tingkat</th>
                <th className="px-3 py-2">Kelas</th>
                <th className="px-3 py-2">NISN</th>
                <th className="px-3 py-2">Siswa</th>
                <th className="px-3 py-2">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {notPresentByStudent.map((x) => (
                <tr key={`np-${x.studentId}`} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-xs font-semibold text-slate-700">{x.grade ?? '—'}</td>
                  <td className="px-3 py-2">{x.className}</td>
                  <td className="px-3 py-2 font-mono text-xs">{x.nisn}</td>
                  <td className="px-3 py-2">{x.name}</td>
                  <td className="px-3 py-2 text-xs text-amber-800">
                    {Array.from(x.statuses).join(', ')}
                  </td>
                </tr>
              ))}
              {notPresentByStudent.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-xs text-slate-500" colSpan={5}>
                    Belum ada catatan siswa tidak hadir untuk tanggal ini.
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
