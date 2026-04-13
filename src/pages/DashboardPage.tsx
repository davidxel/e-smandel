import {
  ClipboardList,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { isPiketActive } from '../lib/permissions'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { ROLE_LABELS } from '../types/roles'
import { getStudentClassLabel } from '../lib/userDisplay'

/** Data contoh tren kehadiran harian untuk Kepsek (persen) */
const KEPSEK_TREND = [
  { label: 'Sen', value: 94 },
  { label: 'Sel', value: 96 },
  { label: 'Rab', value: 92 },
  { label: 'Kam', value: 95 },
  { label: 'Jum', value: 97 },
  { label: 'Sab', value: 0 },
  { label: 'Min', value: 0 },
]

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const students = useDataStore((s) => s.students)
  const pointHistory = useDataStore((s) => s.pointHistory)
  const getStudentByUserId = useDataStore((s) => s.getStudentByUserId)
  const getClassById = useDataStore((s) => s.getClassById)

  if (!user) return null
  const activePiket = isPiketActive(user)

  const student = getStudentByUserId(user.id)
  const className = student ? getClassById(student.classId)?.name : undefined
  const maxTrend = Math.max(...KEPSEK_TREND.map((d) => d.value), 1)

  const showLiveStats =
    user.role === 'super_admin' || user.role === 'kesiswaan'

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

  if (user.role === 'kepsek') {
    return (
      <div>
        <h1 className="mb-1 text-xl font-bold text-slate-800 md:text-2xl">
          Dashboard Kepala Sekolah
        </h1>
        <p className="mb-6 text-sm text-slate-600">
          Ringkasan dan tren kehadiran mingguan (data contoh).
        </p>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-navy" />
            <h2 className="font-semibold text-slate-800">
              Tren kehadiran harian (%)
            </h2>
          </div>
          <div className="flex h-52 items-end justify-between gap-2 border-b border-slate-100 pb-2">
            {KEPSEK_TREND.map((d) => (
              <div
                key={d.label}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="flex h-40 w-full items-end justify-center">
                  {d.value > 0 ? (
                    <div
                      className="w-[min(100%,2.5rem)] rounded-t-lg bg-gradient-to-t from-brand-navy to-brand-navy-muted transition-all"
                      style={{ height: `${(d.value / maxTrend) * 100}%` }}
                      title={`${d.value}%`}
                    />
                  ) : (
                    <div className="h-1 w-full rounded bg-slate-100" />
                  )}
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {d.label}
                </span>
                <span className="text-[10px] tabular-nums text-slate-400">
                  {d.value > 0 ? `${d.value}%` : '—'}
                </span>
              </div>
            ))}
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
    </div>
  )
}
