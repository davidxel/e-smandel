import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileUploader } from '../components/ui/FileUploader'
import { buildSmsUrl, buildWhatsAppUrl } from '../lib/userDisplay'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'

const ACTIVITY_OPTIONS = [
  'Kerja Bakti',
  'Literasi Perpustakaan',
  'Bersih Musholla',
  'Membantu Kebersihan Kelas',
]

export function PenebusanPoinPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const students = useDataStore((s) => s.students)
  const users = useDataStore((s) => s.users)
  const getUserById = useDataStore((s) => s.getUserById)
  const getStudentByUserId = useDataStore((s) => s.getStudentByUserId)
  const redeemStudentPoints = useDataStore((s) => s.redeemStudentPoints)
  const createRedemptionRequest = useDataStore((s) => s.createRedemptionRequest)
  const approveRedemptionRequest = useDataStore((s) => s.approveRedemptionRequest)
  const pointRedemptions = useDataStore((s) => s.pointRedemptions)
  const pointRedemptionRequests = useDataStore((s) => s.pointRedemptionRequests)
  const showToast = useUiStore((s) => s.showToast)
  const [studentId, setStudentId] = useState('')
  const [supervisorTeacherId, setSupervisorTeacherId] = useState('')
  const [activityType, setActivityType] = useState(ACTIVITY_OPTIONS[0])
  const [pointsRestored, setPointsRestored] = useState(5)
  const [proofPhoto, setProofPhoto] = useState('')
  const [approvalPhoto, setApprovalPhoto] = useState<Record<string, string>>({})
  const [approvalPoints, setApprovalPoints] = useState<Record<string, number>>({})
  const [notifPayload, setNotifPayload] = useState<{
    phone: string
    message: string
    title: string
  } | null>(null)

  const studentRows = useMemo(
    () =>
      students.map((s) => ({
        id: s.id,
        totalPoints: s.totalPoints,
        name: getUserById(s.userId)?.name ?? '—',
      })),
    [students, getUserById],
  )

  if (!user) return null

  const teacherRows = users.filter(
    (u) =>
      u.role !== 'siswa' &&
      u.role !== 'super_admin' &&
      !u.id.startsWith('u-dummy'),
  )

  const submitDirect = (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId) {
      showToast('Pilih siswa.', 'error')
      return
    }
    if (!proofPhoto) {
      showToast('Bukti foto wajib diunggah.', 'error')
      return
    }
    const res = redeemStudentPoints({
      studentId,
      teacherId: user.id,
      activityType,
      pointsRestored,
      proofPhotoDataUrl: proofPhoto,
    })
    if (!res.ok) {
      showToast(res.message ?? 'Gagal memproses penebusan.', 'error')
      return
    }
    const st = students.find((s) => s.id === studentId)
    const stUser = st ? getUserById(st.userId) : undefined
    if (st && stUser) {
      setNotifPayload({
        phone: st.parentPhone,
        message: `Notifikasi e-Smandel: Penebusan poin ${stUser.name} diproses untuk kegiatan "${activityType}".`,
        title: 'Validasi Notifikasi Penebusan',
      })
    }
    showToast(res.message ?? 'Penebusan poin diproses.', 'success')
    setProofPhoto('')
  }

  const submitRequestByStudent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supervisorTeacherId) {
      showToast('Pilih guru pengawas.', 'error')
      return
    }
    const res = createRedemptionRequest({
      studentUserId: user.id,
      activityType,
      requestedPoints: pointsRestored,
      supervisorTeacherId,
    })
    if (!res.ok) {
      showToast(res.message ?? 'Pengajuan gagal.', 'error')
      return
    }
    showToast('Pengajuan penebusan dikirim. Tunggu approval guru pengawas.', 'success')
  }

  const myStudent = getStudentByUserId(user.id)
  const myRequests = pointRedemptionRequests.filter((r) => r.studentId === myStudent?.id)
  const blockedForStudent = user.role === 'siswa' && (myStudent?.totalPoints ?? 0) >= 0

  useEffect(() => {
    if (blockedForStudent) {
      showToast(
        'Penebusan poin tidak bisa diakses karena tidak ada poin pelanggaran.',
        'info',
      )
      navigate('/app', { replace: true })
    }
  }, [blockedForStudent, showToast, navigate])

  if (blockedForStudent) {
    return null
  }
  const pendingForTeacher = pointRedemptionRequests.filter(
    (r) =>
      r.status === 'pending' &&
      (r.supervisorTeacherId === user.id || user.role === 'super_admin'),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Penebusan Poin</h1>
        <p className="mt-1 text-sm text-slate-600">
          Restorasi karakter: siswa mengajukan kegiatan, guru pengawas melakukan verifikasi dan approval.
        </p>
      </div>
      {notifPayload ? (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-sm font-semibold text-indigo-900">{notifPayload.title}</p>
          <p className="mt-1 text-xs text-indigo-800">
            Pilih kanal notifikasi ke orang tua: {notifPayload.phone || 'nomor belum diisi'}.
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
      {user.role === 'siswa' ? (
        <form onSubmit={submitRequestByStudent} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Ajukan Penebusan Poin</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Kegiatan</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {ACTIVITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Guru Pengawas</label>
              <select
                value={supervisorTeacherId}
                onChange={(e) => setSupervisorTeacherId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">— Pilih guru —</option>
                {teacherRows.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Poin diajukan</label>
              <input
                type="number"
                min={1}
                max={100}
                value={pointsRestored}
                onChange={(e) => setPointsRestored(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button type="submit" className="w-fit rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white">
            Kirim Pengajuan
          </button>
        </form>
      ) : (
        <form onSubmit={submitDirect} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Siswa</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">— Pilih siswa —</option>
                {studentRows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (poin: {r.totalPoints})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Kegiatan</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {ACTIVITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Poin dikembalikan</label>
              <input
                type="number"
                min={1}
                max={100}
                value={pointsRestored}
                onChange={(e) => setPointsRestored(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <FileUploader
            label="Bukti dokumentasi (kamera/galeri)"
            accept="image/*"
            maxSizeMb={5}
            description="Foto kegiatan wajib ada sebagai bukti sah penebusan poin."
            onDataUrl={(url) => setProofPhoto(url)}
          />
          <button type="submit" className="w-fit rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white">
            Proses Penebusan Langsung
          </button>
        </form>
      )}

      {user.role === 'siswa' ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Status Pengajuan Saya</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2">Kegiatan</th>
                  <th className="px-3 py-2">Guru Pengawas</th>
                  <th className="px-3 py-2">Poin</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-xs">{new Date(r.requestedAt).toLocaleString('id-ID')}</td>
                    <td className="px-3 py-2">{r.activityType}</td>
                    <td className="px-3 py-2">{getUserById(r.supervisorTeacherId)?.name ?? '—'}</td>
                    <td className="px-3 py-2 tabular-nums">{r.requestedPoints}</td>
                    <td className="px-3 py-2 font-medium">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {user.role !== 'siswa' && pendingForTeacher.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Menunggu Approval Anda</h2>
          <div className="mt-4 space-y-4">
            {pendingForTeacher.map((req) => {
              const st = students.find((s) => s.id === req.studentId)
              const studentName = st ? getUserById(st.userId)?.name : req.studentId
              const proof = approvalPhoto[req.id] ?? ''
              const pts = approvalPoints[req.id] ?? req.requestedPoints
              return (
                <div key={req.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-800">{studentName}</p>
                  <p className="text-xs text-slate-500">
                    {req.activityType} · ajukan {req.requestedPoints} poin
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={pts}
                      onChange={(e) =>
                        setApprovalPoints((s) => ({
                          ...s,
                          [req.id]: Number(e.target.value),
                        }))
                      }
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <FileUploader
                      label="Bukti foto approval"
                      accept="image/*"
                      maxSizeMb={5}
                      onDataUrl={(url) =>
                        setApprovalPhoto((s) => ({ ...s, [req.id]: url }))
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const res = approveRedemptionRequest({
                        requestId: req.id,
                        approverId: user.id,
                        approvedPoints: pts,
                        proofPhotoDataUrl: proof,
                      })
                      if (res.ok) {
                        const st = students.find((s) => s.id === req.studentId)
                        const stUser = st ? getUserById(st.userId) : undefined
                        if (st && stUser) {
                          setNotifPayload({
                            phone: st.parentPhone,
                            message:
                              `Notifikasi e-Smandel: Penebusan poin ${stUser.name} telah di-approve guru pengawas.`,
                            title: 'Validasi Notifikasi Approval Penebusan',
                          })
                        }
                      }
                      showToast(
                        res.ok ? res.message ?? 'Pengajuan disetujui.' : res.message ?? 'Gagal approve.',
                        res.ok ? 'success' : 'error',
                      )
                    }}
                    className="mt-3 rounded-lg bg-brand-navy px-4 py-2 text-xs font-semibold text-white"
                  >
                    Approve Penebusan
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Riwayat penebusan terbaru</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Waktu</th>
                <th className="px-3 py-2">Siswa</th>
                <th className="px-3 py-2">Kegiatan</th>
                <th className="px-3 py-2">+Poin</th>
                <th className="px-3 py-2">Petugas</th>
              </tr>
            </thead>
            <tbody>
              {pointRedemptions.slice(0, 20).map((r) => {
                const student = students.find((s) => s.id === r.studentId)
                const studentName = student ? getUserById(student.userId)?.name : r.studentId
                const teacherName = users.find((u) => u.id === r.teacherId)?.name ?? r.teacherId
                return (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-xs">{new Date(r.timestamp).toLocaleString('id-ID')}</td>
                    <td className="px-3 py-2">{studentName}</td>
                    <td className="px-3 py-2">{r.activityType}</td>
                    <td className="px-3 py-2 font-semibold text-emerald-700">+{r.pointsRestored}</td>
                    <td className="px-3 py-2 text-xs">{teacherName}</td>
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
