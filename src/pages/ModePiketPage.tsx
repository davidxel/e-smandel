import { useMemo, useState } from 'react'
import { FileUploader } from '../components/ui/FileUploader'
import { buildSmsUrl, buildWhatsAppUrl } from '../lib/userDisplay'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'

const QUICK_ACTIVITY = ['Kerja Bakti', 'Literasi Perpustakaan', 'Bersih Musholla']

export function ModePiketPage() {
  const user = useAuthStore((s) => s.user)
  const showToast = useUiStore((s) => s.showToast)
  const students = useDataStore((s) => s.students)
  const classes = useDataStore((s) => s.classes)
  const violations = useDataStore((s) => s.violations)
  const attendance = useDataStore((s) => s.attendance)
  const getUserById = useDataStore((s) => s.getUserById)
  const applyQuickViolation = useDataStore((s) => s.applyQuickViolation)
  const redeemStudentPoints = useDataStore((s) => s.redeemStudentPoints)
  const addAchievementPoints = useDataStore((s) => s.addAchievementPoints)
  const [studentViolation, setStudentViolation] = useState('')
  const [violationId, setViolationId] = useState('')
  const [studentRedeem, setStudentRedeem] = useState('')
  const [activityType, setActivityType] = useState(QUICK_ACTIVITY[0])
  const [pointsRestore, setPointsRestore] = useState(5)
  const [proof, setProof] = useState('')
  const [studentPrestasi, setStudentPrestasi] = useState('')
  const [prestasiPoints, setPrestasiPoints] = useState(5)
  const [prestasiReason, setPrestasiReason] = useState('')
  const [notifPayload, setNotifPayload] = useState<{
    phone: string
    message: string
    title: string
  } | null>(null)
  const [date] = useState(new Date().toISOString().slice(0, 10))

  const rows = useMemo(
    () =>
      students.map((st) => ({
        id: st.id,
        className: classes.find((c) => c.id === st.classId)?.name ?? '—',
        name: getUserById(st.userId)?.name ?? '—',
      })),
    [students, classes, getUserById],
  )
  const terlambat = violations.find((v) => v.slug === 'terlambat')
  const todaysAttendance = attendance.filter((a) => a.date === date)
  const todaysNotPresent = todaysAttendance.filter((a) => a.status !== 'H')

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">e-Poin</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pelanggaran cepat, konfirmasi penebusan poin, dan rekap absen global harian.
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
              {todaysNotPresent.map((a) => {
                const st = students.find((s) => s.id === a.studentId)
                const name = st ? getUserById(st.userId)?.name : a.studentId
                const className = st ? classes.find((c) => c.id === st.classId)?.name : '—'
                return (
                  <tr key={`np-${a.id}`} className="border-t border-slate-100">
                    <td className="px-3 py-2">{className}</td>
                    <td className="px-3 py-2">{name}</td>
                    <td className="px-3 py-2">{a.period}</td>
                    <td className="px-3 py-2 text-xs">{st?.statusPrestasi ?? 'normal'}</td>
                    <td className="px-3 py-2 font-medium text-amber-700">{a.status}</td>
                  </tr>
                )
              })}
              {todaysNotPresent.length === 0 ? (
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
