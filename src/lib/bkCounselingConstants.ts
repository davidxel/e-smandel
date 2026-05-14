import type { CounselingCaseStatus } from '../types/schema'

/** Siswa dengan total poin ≥ nilai ini masuk daftar prioritas dashboard BK */
export const BK_CRITICAL_POINTS_THRESHOLD = 40

/** Ambang poin untuk tombol Surat Peringatan (sesuai kebijakan sekolah) */
export const SP_THRESHOLDS: Record<'SP1' | 'SP2' | 'SP3', number> = {
  SP1: 75,
  SP2: 50,
  SP3: 25,
}

export const COUNSELING_STATUS_LABELS: Record<CounselingCaseStatus, string> = {
  perlu_penanganan: 'Perlu Penanganan',
  sedang_dibimbing: 'Dibimbing',
  selesai: 'Selesai',
}
