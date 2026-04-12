import {
  ClipboardList,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react'
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

  const student = getStudentByUserId(user.id)
  const className = student ? getClassById(student.classId)?.name : undefined
  const maxTrend = Math.max(...KEPSEK_TREND.map((d) => d.value), 1)

  const showLiveStats =
    user.role === 'super_admin' || user.role === 'kesiswaan'

  if (user.role === 'siswa') {
    const points = student?.totalPoints ?? 100
    const maxPoints = 100
    const pct = Math.min(100, Math.round((points / maxPoints) * 100))
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
              style={{
                background: `conic-gradient(#c9a227 ${pct * 3.6}deg, rgba(255,255,255,0.12) 0deg)`,
              }}
            >
              <div className="flex h-[7.5rem] w-[7.5rem] flex-col items-center justify-center rounded-full bg-brand-navy-dark">
                <span className="text-5xl font-bold tabular-nums text-white">
                  {points}
                </span>
                <span className="text-xs text-white/70">dari {maxPoints}</span>
              </div>
            </div>
            <p className="mt-6 text-center text-sm text-white/85">
              Pertahankan perilaku positif. Poin dapat berubah sesuai pelanggaran
              dan penghargaan.
            </p>
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
