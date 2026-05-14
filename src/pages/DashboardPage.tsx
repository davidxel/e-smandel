import {
  BarChart3,
  ClipboardList,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { isPiketActive } from '../lib/permissions'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { ROLE_LABELS } from '../types/roles'
import { getStudentClassLabel } from '../lib/userDisplay'

const KEPSEK_TREND = [
  { label: 'Sen', value: 94 },
  { label: 'Sel', value: 96 },
  { label: 'Rab', value: 92 },
  { label: 'Kam', value: 95 },
  { label: 'Jum', value: 97 },
  { label: 'Sab', value: 0 },
  { label: 'Min', value: 0 },
]

type IncomeTier = 'all' | 'rendah' | 'menengah' | 'tinggi' | 'nominal'

function toRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function parseIncomeToNumber(raw: string): number | null {
  const text = raw.toLowerCase().replace(/\s/g, '')
  const digits = text.replace(/[^\d]/g, '')
  if (!digits) return null
  const n = Number(digits)
  if (Number.isNaN(n) || n <= 0) return null
  if (text.includes('juta')) return n * 1_000_000
  if (text.includes('rb') || text.includes('ribu')) return n * 1_000
  return n
}

function resolveIncomeTier(amount: number): 'rendah' | 'menengah' | 'tinggi' {
  if (amount < 3_000_000) return 'rendah'
  if (amount <= 7_000_000) return 'menengah'
  return 'tinggi'
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const students = useDataStore((s) => s.students)
  const pointHistory = useDataStore((s) => s.pointHistory)
  const getStudentByUserId = useDataStore((s) => s.getStudentByUserId)
  const getClassById = useDataStore((s) => s.getClassById)
  const attendance = useDataStore((s) => s.attendance)
  const users = useDataStore((s) => s.users)
  const [incomeFilter, setIncomeFilter] = useState<IncomeTier>('all')
  const [incomeMin, setIncomeMin] = useState('0')
  const [incomeMax, setIncomeMax] = useState('10000000')

  if (!user) return null
  const activePiket = isPiketActive(user)

  const student = getStudentByUserId(user.id)
  const className = student ? getClassById(student.classId)?.name : undefined
  const maxTrend = Math.max(...KEPSEK_TREND.map((d) => d.value), 1)

  const showLiveStats =
    user.role === 'super_admin' || user.role === 'kesiswaan'
  const managedClassStudents =
    user.role === 'guru_mapel' && user.is_walikelas && user.managed_class_id
      ? students.filter((s) => s.classId === user.managed_class_id)
      : []
  const today = new Date().toISOString().slice(0, 10)
  const criticalCount = managedClassStudents.filter((s) => s.totalPoints < 50).length
  const hadirToday = managedClassStudents.filter((s) =>
    attendance.some((a) => a.studentId === s.id && a.date === today && a.status === 'H'),
  ).length

  if (user.role === 'siswa') {
    const points = student?.totalPoints ?? 0
    const isMinus = points < 0
    const studentHistory = student
      ? pointHistory.filter((ph) => ph.studentId === student.id).slice(0, 20)
      : []
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="mb-2 text-xl font-bold text-slate-800 md:text-2xl">
          Halo, {user.name.split(',')[0]}
        </h1>
        <p className="mb-6 text-sm text-slate-600">
          Berikut ringkasan poin perilaku Anda.
        </p>
        <div className="relative overflow-hidden rounded-3xl border-2 border-brand-gold/40 bg-gradient-to-br from-brand-navy to-brand-navy-dark p-8 text-white shadow-xl">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-gold/20 blur-2xl" />
          <p className="text-sm font-medium uppercase tracking-widest text-brand-gold-light">
            Kartu Poin
          </p>
          <p className="mt-1 text-sm text-white/80">
            {getStudentClassLabel(student, className)} · NISN{' '}
            {user.nisn ?? '—'}
          </p>
          <div className="mt-8 flex flex-col items-center">
            <div
              className="relative flex h-44 w-44 items-center justify-center rounded-full border-4 border-brand-gold/60 bg-white/5 shadow-inner"
            >
              <div className="flex h-[7.5rem] w-[7.5rem] flex-col items-center justify-center rounded-full bg-brand-navy-dark">
                <span
                  className={`text-5xl font-bold tabular-nums ${
                    isMinus ? 'text-red-300' : 'text-white'
                  }`}
                >
                  {points}
                </span>
                <span className="text-xs text-white/70">
                  {isMinus ? 'Poin pelanggaran (minus)' : 'Poin saat ini'}
                </span>
              </div>
            </div>
            <p className="mt-6 text-center text-sm text-white/85">
              Nilai awal siswa dimulai dari 0. Pelanggaran akan menjadi minus,
              sedangkan penebusan dan prestasi menambah poin.
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">
            Riwayat Poin Saya
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Menampilkan perubahan poin terbaru berdasarkan pelanggaran, penebusan,
            prestasi, dan absensi.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Waktu</th>
                  <th className="px-3 py-2">Sumber</th>
                  <th className="px-3 py-2">Delta</th>
                  <th className="px-3 py-2">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {studentHistory.map((ph) => (
                  <tr key={ph.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {new Date(ph.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-2 text-xs uppercase">{ph.source}</td>
                    <td
                      className={`px-3 py-2 font-semibold tabular-nums ${
                        ph.pointsChanged >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {ph.pointsChanged >= 0 ? `+${ph.pointsChanged}` : ph.pointsChanged}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">{ph.reason}</td>
                  </tr>
                ))}
                {studentHistory.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-xs text-slate-500" colSpan={4}>
                      Belum ada riwayat perubahan poin.
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

  const totalSiswa = students.length
  const poinMingguIni = pointHistory.filter((p) => {
    const t = new Date(p.timestamp).getTime()
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return t >= weekAgo && p.pointsChanged < 0
  }).length

  const avgPoints =
    totalSiswa > 0
      ? Math.round(
          students.reduce((a, s) => a + s.totalPoints, 0) / totalSiswa,
        )
      : 0

  const analyticsRows = useMemo(() => {
    const rows = students.map((st) => {
      const studentUser = users.find((u) => u.id === st.userId)
      const profile = st.dapodikProfile
      const parentJobs = [
        profile?.dataAyah?.pekerjaan,
        profile?.dataIbu?.pekerjaan,
        profile?.dataWali?.pekerjaan,
      ]
        .map((x) => (x ?? '').trim())
        .filter(Boolean)
      const incomeCandidates = [
        profile?.dataAyah?.penghasilan,
        profile?.dataIbu?.penghasilan,
        profile?.dataWali?.penghasilan,
      ].map((x) => x ?? '')
      const incomeText = incomeCandidates.find((x) => x.trim()) ?? ''
      const incomeAmount = parseIncomeToNumber(incomeText)
      const religion = profile?.agama?.trim() || 'Tidak diisi'
      const latestPoint = pointHistory.find((ph) => ph.studentId === st.id)
      return {
        studentId: st.id,
        studentName: studentUser?.name ?? st.userId,
        gender: st.gender === 'P' ? 'Perempuan' : 'Laki-laki',
        religion,
        parentJobs,
        incomeText: incomeText || 'Tidak diisi',
        incomeAmount,
        incomeTier: incomeAmount ? resolveIncomeTier(incomeAmount) : null,
        latestPoint,
        totalPoint: st.totalPoints,
      }
    })
    return rows
  }, [pointHistory, students, users])

  const incomeMinNum = Number(incomeMin) || 0
  const incomeMaxNum = Number(incomeMax) || Number.MAX_SAFE_INTEGER
  const filteredAnalyticsRows = analyticsRows.filter((row) => {
    if (!row.incomeAmount) return incomeFilter === 'all'
    if (incomeFilter === 'rendah' || incomeFilter === 'menengah' || incomeFilter === 'tinggi') {
      return row.incomeTier === incomeFilter
    }
    if (incomeFilter === 'nominal') {
      return row.incomeAmount >= incomeMinNum && row.incomeAmount <= incomeMaxNum
    }
    return true
  })

  const countBy = (getter: (row: (typeof filteredAnalyticsRows)[number]) => string) => {
    const m = new Map<string, number>()
    for (const row of filteredAnalyticsRows) {
      const key = getter(row) || 'Tidak diisi'
      m.set(key, (m.get(key) ?? 0) + 1)
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }
  const genderStats = countBy((r) => r.gender)
  const religionStats = countBy((r) => r.religion)
  const parentJobStats = countBy((r) => r.parentJobs[0] ?? 'Tidak diisi')
  const incomeTierStats = countBy((r) => {
    if (!r.incomeTier) return 'Tidak diisi'
    if (r.incomeTier === 'rendah') return 'Rendah (<3 jt)'
    if (r.incomeTier === 'menengah') return 'Menengah (3-7 jt)'
    return 'Tinggi (>7 jt)'
  })

  const cards = showLiveStats
    ? [
        {
          title: 'Total siswa',
          value: String(totalSiswa),
          icon: Users,
          accent: 'from-sky-500 to-brand-navy',
        },
        {
          title: 'Catatan pemotongan poin (7 hari)',
          value: String(poinMingguIni),
          icon: ClipboardList,
          accent: 'from-amber-500 to-orange-600',
        },
        {
          title: 'Rata-rata poin siswa',
          value: String(avgPoints),
          icon: Shield,
          accent: 'from-emerald-500 to-teal-600',
        },
      ]
    : [
        {
          title: 'Total siswa (data)',
          value: String(totalSiswa),
          icon: Users,
          accent: 'from-sky-500 to-brand-navy',
        },
        {
          title: 'Pelanggaran minggu ini',
          value: String(poinMingguIni),
          icon: ClipboardList,
          accent: 'from-amber-500 to-orange-600',
        },
        {
          title: 'Rata-rata poin kelas',
          value: String(avgPoints),
          icon: Shield,
          accent: 'from-emerald-500 to-teal-600',
        },
      ]

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-800 md:text-2xl">
        Dashboard
      </h1>
      {user.role === 'guru_mapel' ? (
        <div
          className={`mb-4 rounded-xl p-3 ${
            activePiket
              ? 'border border-amber-300 bg-amber-50'
              : 'border border-slate-200 bg-slate-50'
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              activePiket ? 'text-amber-900' : 'text-slate-700'
            }`}
          >
            Status piket:{' '}
            {activePiket ? 'Sedang Piket (aktif hari ini)' : 'Tidak Sedang Piket'}
          </p>
          {activePiket ? (
            <Link
              to="/app/e-poin"
              className="mt-2 inline-flex rounded-lg bg-brand-navy px-3 py-2 text-xs font-semibold text-white"
            >
              Buka e-Poin
            </Link>
          ) : null}
          {user.is_walikelas && user.managed_class_id ? (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-semibold text-emerald-900">
                Anda wali kelas {getClassById(user.managed_class_id)?.name ?? '—'}
              </p>
              <p className="mt-1 text-xs text-emerald-800">
                Siswa terampu: {managedClassStudents.length} • Hadir hari ini: {hadirToday} • Poin kritis (&lt;50): {criticalCount}
              </p>
              <Link
                to="/app/kelas-saya"
                className="mt-2 inline-flex rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white"
              >
                Buka Kelas Saya
              </Link>
            </div>
          ) : null}
          <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
            <p className="text-sm font-semibold text-sky-900">
              Modul tugas siap dipakai untuk kelas yang Anda ampu.
            </p>
            <p className="mt-1 text-xs text-sky-800">
              Buat tugas, pantau progres pengumpulan, dan beri catatan singkat per siswa.
            </p>
            <Link
              to="/app/manajemen-tugas"
              className="mt-2 inline-flex rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold text-white"
            >
              Buka Manajemen Tugas
            </Link>
          </div>
        </div>
      ) : null}
      {user.role === 'bk' ? (
        <div className="mb-4 rounded-xl border border-violet-300 bg-violet-50 p-3">
          <p className="text-sm font-semibold text-violet-900">
            Akses BK aktif untuk proses poin pelanggaran dan penebusan siswa.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              to="/app/e-poin"
              className="inline-flex rounded-lg bg-brand-navy px-3 py-2 text-xs font-semibold text-white"
            >
              Buka Modul Poin BK
            </Link>
            <Link
              to="/app/penebusan-poin"
              className="inline-flex rounded-lg border border-brand-navy px-3 py-2 text-xs font-semibold text-brand-navy"
            >
              Konfirmasi Penebusan
            </Link>
          </div>
        </div>
      ) : null}
      <p className="mb-6 text-sm text-slate-600">
        Anda masuk sebagai{' '}
        <span className="font-semibold text-brand-navy">
          {ROLE_LABELS[user.role]}
        </span>
        .{' '}
        {showLiveStats
          ? 'Statistik di bawah mengikuti data master di penyimpanan lokal.'
          : 'Statistik ringkas dari data saat ini.'}
      </p>
      {(user.role === 'kepsek' || user.role === 'super_admin' || user.role === 'kesiswaan' || user.role === 'bk') ? (
        <div className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Filter tingkat penghasilan orang tua</p>
              <p className="text-xs text-slate-500">Standar default: rendah &lt; 3 jt, menengah 3-7 jt, tinggi &gt; 7 jt</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={incomeFilter}
                onChange={(e) => setIncomeFilter(e.target.value as IncomeTier)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
              >
                <option value="all">Semua</option>
                <option value="rendah">Rendah</option>
                <option value="menengah">Menengah</option>
                <option value="tinggi">Tinggi</option>
                <option value="nominal">Rentang nominal</option>
              </select>
              {incomeFilter === 'nominal' ? (
                <>
                  <input value={incomeMin} onChange={(e) => setIncomeMin(e.target.value)} className="w-28 rounded-lg border border-slate-200 px-2 py-2 text-xs" placeholder="Min" />
                  <input value={incomeMax} onChange={(e) => setIncomeMax(e.target.value)} className="w-28 rounded-lg border border-slate-200 px-2 py-2 text-xs" placeholder="Max" />
                </>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Data tersaring: {filteredAnalyticsRows.length} siswa
            {incomeFilter === 'nominal' ? ` (rentang ${toRupiah(incomeMinNum)} - ${toRupiah(incomeMaxNum)})` : ''}
          </p>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.title}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div
              className={`h-1.5 bg-gradient-to-r ${c.accent}`}
              aria-hidden
            />
            <div className="flex items-start gap-4 p-5">
              <div className="rounded-xl bg-slate-100 p-3 text-brand-navy">
                <c.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{c.title}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                  {c.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {(user.role === 'kepsek' || user.role === 'super_admin' || user.role === 'kesiswaan' || user.role === 'bk') ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {[{ title: 'Pekerjaan Orang Tua', data: parentJobStats }, { title: 'Penghasilan Orang Tua', data: incomeTierStats }, { title: 'Agama', data: religionStats }, { title: 'Jenis Kelamin', data: genderStats }].map((panel) => {
            const max = Math.max(...panel.data.map((x) => x[1]), 1)
            return (
              <div key={panel.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-brand-navy" />
                  <h3 className="text-sm font-semibold text-slate-800">{panel.title}</h3>
                </div>
                <div className="space-y-2">
                  {panel.data.length === 0 ? (
                    <p className="text-xs text-slate-500">Belum ada data.</p>
                  ) : panel.data.map(([label, count]) => (
                    <div key={label}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                        <span>{label}</span>
                        <span>{count} siswa</span>
                      </div>
                      <div className="h-2 rounded bg-slate-100">
                        <div className="h-2 rounded bg-brand-navy" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
      {(user.role === 'kepsek' || user.role === 'super_admin' || user.role === 'kesiswaan' || user.role === 'bk') ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Poin siswa terbaru / terupdate</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Siswa</th>
                  <th className="px-3 py-2">Total Poin</th>
                  <th className="px-3 py-2">Update Terakhir</th>
                  <th className="px-3 py-2">Delta</th>
                  <th className="px-3 py-2">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnalyticsRows
                  .slice()
                  .sort((a, b) => (b.latestPoint?.timestamp ?? '').localeCompare(a.latestPoint?.timestamp ?? ''))
                  .slice(0, 20)
                  .map((row) => (
                    <tr key={row.studentId} className="border-t border-slate-100">
                      <td className="px-3 py-2">{row.studentName}</td>
                      <td className="px-3 py-2 font-semibold tabular-nums">{row.totalPoint}</td>
                      <td className="px-3 py-2 text-xs">{row.latestPoint ? new Date(row.latestPoint.timestamp).toLocaleString('id-ID') : '—'}</td>
                      <td className={`px-3 py-2 text-xs font-semibold ${row.latestPoint && row.latestPoint.pointsChanged < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {row.latestPoint ? (row.latestPoint.pointsChanged > 0 ? `+${row.latestPoint.pointsChanged}` : row.latestPoint.pointsChanged) : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">{row.latestPoint?.reason ?? 'Belum ada riwayat'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {user.role === 'kepsek' ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-navy" />
            <h2 className="font-semibold text-slate-800">Rekap kerja & tren kehadiran lintas akun (%)</h2>
          </div>
          <div className="flex h-52 items-end justify-between gap-2 border-b border-slate-100 pb-2">
            {KEPSEK_TREND.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end justify-center">
                  {d.value > 0 ? (
                    <div className="w-[min(100%,2.5rem)] rounded-t-lg bg-gradient-to-t from-brand-navy to-brand-navy-muted transition-all" style={{ height: `${(d.value / maxTrend) * 100}%` }} title={`${d.value}%`} />
                  ) : (
                    <div className="h-1 w-full rounded bg-slate-100" />
                  )}
                </div>
                <span className="text-xs font-medium text-slate-500">{d.label}</span>
                <span className="text-[10px] tabular-nums text-slate-400">{d.value > 0 ? `${d.value}%` : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
