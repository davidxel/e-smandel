import { useMemo, useState } from 'react'
import { ModuleTabBar } from '../components/ui/ModuleTabBar'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'
import type { CompetitionStatus } from '../types/schema'
import { buildSmsUrl, buildWhatsAppUrl } from '../lib/userDisplay'
import { flushWorkspacePushNow } from '../lib/workspaceSync'

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

type PrestasiTab = 'poin' | 'daftar' | 'riwayat'

const PRESTASI_TABS: { id: PrestasiTab; label: string }[] = [
  { id: 'poin', label: 'Poin prestasi' },
  { id: 'daftar', label: 'Daftar lomba' },
  { id: 'riwayat', label: 'Riwayat status' },
]

export function KegiatanLombaPage() {
  const authUser = useAuthStore((s) => s.user)
  const students = useDataStore((s) => s.students)
  const classes = useDataStore((s) => s.classes)
  const getUserById = useDataStore((s) => s.getUserById)
  const competitions = useDataStore((s) => s.competitions)
  const competitionStatusHistory = useDataStore((s) => s.competitionStatusHistory)
  const updateCompetitionStatus = useDataStore((s) => s.updateCompetitionStatus)
  const addAchievementPoints = useDataStore((s) => s.addAchievementPoints)
  const showToast = useUiStore((s) => s.showToast)
  const [historyStudentId, setHistoryStudentId] = useState('')
  const [statusDraft, setStatusDraft] = useState<Record<string, CompetitionStatus>>({})
  const [notifPayload, setNotifPayload] = useState<{
    phone: string
    message: string
    title: string
  } | null>(null)

  const [moduleTab, setModuleTab] = useState<PrestasiTab>('poin')

  const [studentPrestasi, setStudentPrestasi] = useState('')
  const [prestasiPoints, setPrestasiPoints] = useState(5)
  const [prestasiReason, setPrestasiReason] = useState('')

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

  const submitPrestasi = (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentPrestasi) {
      showToast('Pilih siswa untuk poin prestasi.', 'error')
      return
    }
    const res = addAchievementPoints({
      studentId: studentPrestasi,
      teacherId: actorId,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">e-Prestasi</h1>
        <p className="mt-1 text-sm text-slate-600">
          Atur status kegiatan lomba (Dispensasi) dan tambahkan poin prestasi untuk siswa.
        </p>
        <div className="mt-4">
          <ModuleTabBar tabs={PRESTASI_TABS} value={moduleTab} onChange={setModuleTab} />
        </div>
      </div>

      {!canManage ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Fitur tidak bisa diakses untuk role akun Anda.
        </div>
      ) : null}

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

      {moduleTab === 'poin' ? (
      <form onSubmit={submitPrestasi} className="grid gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Input Poin Prestasi</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <select
            disabled={!canManage}
            value={studentPrestasi}
            onChange={(e) => setStudentPrestasi(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">— Pilih siswa —</option>
            {studentRows.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.className})
              </option>
            ))}
          </select>
          <input
            disabled={!canManage}
            type="number"
            min={1}
            value={prestasiPoints}
            onChange={(e) => setPrestasiPoints(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <input
            disabled={!canManage}
            value={prestasiReason}
            onChange={(e) => setPrestasiReason(e.target.value)}
            placeholder="Contoh: Juara lomba kelas"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </div>
        <button
          disabled={!canManage}
          className="w-fit rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          type="submit"
        >
          Tambah Poin Prestasi
        </button>
      </form>
      ) : null}

      {moduleTab === 'daftar' ? (
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
      ) : null}

      {moduleTab === 'riwayat' ? (
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
      ) : null}
    </div>
  )
}
