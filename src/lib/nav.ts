import {
  Award,
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  HeartHandshake,
  History,
  LayoutDashboard,
  ListChecks,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { AppRouteKey } from './permissions'

export type NavItem = {
  key: AppRouteKey
  path: string
  label: string
  icon: LucideIcon
  /** Ditampilkan sebagai grup di sidebar */
  section?: 'ringkasan' | 'manajemen_guru' | 'epoin_bk' | 'administrasi'
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    path: '/app',
    label: 'Dashboard',
    icon: LayoutDashboard,
    section: 'ringkasan',
  },
  {
    key: 'mode_piket',
    path: '/app/e-poin',
    label: 'e-Poin',
    icon: ClipboardList,
    section: 'epoin_bk',
  },
  {
    key: 'eabsen',
    path: '/app/e-absen',
    label: 'e-Absen',
    icon: BarChart3,
    section: 'manajemen_guru',
  },
  {
    key: 'ejurnal',
    path: '/app/e-jurnal',
    label: 'e-Jurnal',
    icon: FileText,
    section: 'manajemen_guru',
  },
  {
    key: 'eprestasi',
    path: '/app/eprestasi',
    label: 'e-Prestasi',
    icon: Award,
    section: 'epoin_bk',
  },
  {
    key: 'kokurikuler_operasional',
    path: '/app/kokurikuler',
    label: 'Projek Kokurikuler',
    icon: Award,
    section: 'manajemen_guru',
  },
  {
    key: 'kelas_saya',
    path: '/app/kelas-saya',
    label: 'Kelas Saya',
    icon: Users,
    section: 'manajemen_guru',
  },
  {
    key: 'manajemen_tugas',
    path: '/app/manajemen-tugas',
    label: 'Manajemen Tugas',
    icon: ClipboardList,
    section: 'manajemen_guru',
  },
  {
    key: 'tugas_saya',
    path: '/app/tugas-saya',
    label: 'Tugas Saya',
    icon: FileText,
    section: 'epoin_bk',
  },
  {
    key: 'laporan',
    path: '/app/laporan',
    label: 'Laporan',
    icon: FileText,
    section: 'ringkasan',
  },
  {
    key: 'penebusan_poin',
    path: '/app/penebusan-poin',
    label: 'Penebusan Poin',
    icon: Award,
    section: 'epoin_bk',
  },
  {
    key: 'bk_manajemen_kasus',
    path: '/app/bk/konseling',
    label: 'Manajemen Kasus BK',
    icon: HeartHandshake,
    section: 'epoin_bk',
  },
  {
    key: 'admin_siswa',
    path: '/app/admin/siswa',
    label: 'Data Siswa',
    icon: GraduationCap,
    section: 'administrasi',
  },
  {
    key: 'admin_guru',
    path: '/app/admin/guru',
    label: 'Akun Guru & Staff',
    icon: Users,
    section: 'administrasi',
  },
  {
    key: 'admin_pelanggaran',
    path: '/app/admin/pelanggaran',
    label: 'Master Pelanggaran',
    icon: ShieldAlert,
    section: 'administrasi',
  },
  {
    key: 'admin_jadwal_piket',
    path: '/app/admin/jadwal-piket',
    label: 'Jadwal Piket Guru',
    icon: CalendarDays,
    section: 'administrasi',
  },
  {
    key: 'admin_pembimbing_lomba',
    path: '/app/admin/pembimbing-lomba',
    label: 'Pembimbing Lomba',
    icon: Award,
    section: 'administrasi',
  },
  {
    key: 'admin_walikelas',
    path: '/app/admin/wali-kelas',
    label: 'Penetapan Wali Kelas',
    icon: Users,
    section: 'administrasi',
  },
  {
    key: 'admin_koordinator_kokurikuler',
    path: '/app/admin/koordinator-kokurikuler',
    label: 'Koordinator Kokurikuler',
    icon: Award,
    section: 'administrasi',
  },
  {
    key: 'admin_kelas',
    path: '/app/admin/kelas',
    label: 'Master Kelas',
    icon: ListChecks,
    section: 'administrasi',
  },
  {
    key: 'admin_tugas',
    path: '/app/admin/tugas',
    label: 'CRUD Tugas Global',
    icon: ClipboardList,
    section: 'administrasi',
  },
  {
    key: 'admin_audit_poin',
    path: '/app/admin/audit-poin',
    label: 'Audit Poin',
    icon: History,
    section: 'administrasi',
  },
]

export const NAV_SECTION_LABELS: Record<NonNullable<NavItem['section']>, string> = {
  ringkasan: 'Ringkasan',
  manajemen_guru: 'Manajemen Guru',
  epoin_bk: 'e-Poin & BK',
  administrasi: 'Administrasi',
}
