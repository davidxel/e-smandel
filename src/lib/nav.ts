import {
  Award,
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  ShieldAlert,
  UserCircle,
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
  section?: 'main' | 'admin'
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    path: '/app',
    label: 'Dashboard',
    icon: LayoutDashboard,
    section: 'main',
  },
  {
    key: 'profil',
    path: '/app/profil',
    label: 'Profil & Identitas',
    icon: UserCircle,
    section: 'main',
  },
  {
    key: 'mode_piket',
    path: '/app/e-poin',
    label: 'e-Poin',
    icon: ClipboardList,
    section: 'main',
  },
  {
    key: 'eabsen',
    path: '/app/e-absen',
    label: 'e-Absen',
    icon: BarChart3,
    section: 'main',
  },
  {
    key: 'ejurnal',
    path: '/app/e-jurnal',
    label: 'e-Jurnal',
    icon: FileText,
    section: 'main',
  },
  {
    key: 'eprestasi',
    path: '/app/eprestasi',
    label: 'Kegiatan Lomba',
    icon: Award,
    section: 'main',
  },
  {
    key: 'kokurikuler_operasional',
    path: '/app/kokurikuler',
    label: 'Projek Kokurikuler',
    icon: Award,
    section: 'main',
  },
  {
    key: 'kelas_saya',
    path: '/app/kelas-saya',
    label: 'Kelas Saya',
    icon: Users,
    section: 'main',
  },
  {
    key: 'manajemen_tugas',
    path: '/app/manajemen-tugas',
    label: 'Manajemen Tugas',
    icon: ClipboardList,
    section: 'main',
  },
  {
    key: 'tugas_saya',
    path: '/app/tugas-saya',
    label: 'Tugas Saya',
    icon: FileText,
    section: 'main',
  },
  {
    key: 'laporan',
    path: '/app/laporan',
    label: 'Laporan',
    icon: FileText,
    section: 'main',
  },
  {
    key: 'penebusan_poin',
    path: '/app/penebusan-poin',
    label: 'Penebusan Poin',
    icon: Award,
    section: 'main',
  },
  {
    key: 'admin_siswa',
    path: '/app/admin/siswa',
    label: 'Data Siswa',
    icon: GraduationCap,
    section: 'admin',
  },
  {
    key: 'admin_guru',
    path: '/app/admin/guru',
    label: 'Akun Guru & Staff',
    icon: Users,
    section: 'admin',
  },
  {
    key: 'admin_pelanggaran',
    path: '/app/admin/pelanggaran',
    label: 'Master Pelanggaran',
    icon: ShieldAlert,
    section: 'admin',
  },
  {
    key: 'admin_jadwal_piket',
    path: '/app/admin/jadwal-piket',
    label: 'Jadwal Piket Guru',
    icon: CalendarDays,
    section: 'admin',
  },
  {
    key: 'admin_pembimbing_lomba',
    path: '/app/admin/pembimbing-lomba',
    label: 'Pembimbing Lomba',
    icon: Award,
    section: 'admin',
  },
  {
    key: 'admin_walikelas',
    path: '/app/admin/wali-kelas',
    label: 'Penetapan Wali Kelas',
    icon: Users,
    section: 'admin',
  },
  {
    key: 'admin_koordinator_kokurikuler',
    path: '/app/admin/koordinator-kokurikuler',
    label: 'Koordinator Kokurikuler',
    icon: Award,
    section: 'admin',
  },
  {
    key: 'admin_kelas',
    path: '/app/admin/kelas',
    label: 'Master Kelas',
    icon: ListChecks,
    section: 'admin',
  },
  {
    key: 'admin_tugas',
    path: '/app/admin/tugas',
    label: 'CRUD Tugas Global',
    icon: ClipboardList,
    section: 'admin',
  },
]

export const ADMIN_SECTION_LABEL = 'Administrasi'
