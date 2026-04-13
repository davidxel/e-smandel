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
    key: 'eprestasi',
    path: '/app/eprestasi',
    label: 'Kegiatan Lomba',
    icon: Award,
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
    key: 'admin_kelas',
    path: '/app/admin/kelas',
    label: 'Master Kelas',
    icon: ListChecks,
    section: 'admin',
  },
]

export const ADMIN_SECTION_LABEL = 'Administrasi'
