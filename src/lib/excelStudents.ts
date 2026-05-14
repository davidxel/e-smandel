import * as XLSX from 'xlsx'
import type { StudentDapodikProfile } from '../types/schema'

export type ImportStudentRow = {
  sourceRowNumber: number
  nisn: string
  nipd: string
  nik: string
  name: string
  gender: 'L' | 'P'
  className: string
  dapodikProfile: StudentDapodikProfile
  /** Kolom opsional (alamat, orang tua, kontak, fisik, …) keyed by index string "9"… */
  dapodikExtraColumns: Record<string, string>
}

export type ImportPreviewData = {
  headers: string[]
  rows: string[][]
}

const MAX_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 5000
const MAX_CELL_LEN = 500
/** Baris pertama data = baris ke-7 di Excel (indeks 0-based = 6). */
const START_DATA_ROW_INDEX = 6

/** Indeks kolom wajib (0-based, sesuai template Dapodik): Nama(1), NIPD(2), JK(3), NISN(4), … Rombel(42). */
const COLUMN_HEADERS = [
  'No',
  'Nama Lengkap',
  'NIPD',
  'JK',
  'NISN',
  'Tempat Lahir',
  'Tanggal Lahir',
  'NIK',
  'Agama',
  'Alamat',
  'RT',
  'RW',
  'Dusun',
  'Kelurahan',
  'Kecamatan',
  'Kode Pos',
  'Jenis Tinggal',
  'Alat Transportasi',
  'Telepon',
  'HP',
  'E-Mail',
  'SKHUN',
  'Penerima KPS',
  'No. KPS',
  'Nama Ayah',
  'Tahun Lahir Ayah',
  'Pendidikan Ayah',
  'Pekerjaan Ayah',
  'Penghasilan Ayah',
  'NIK Ayah',
  'Nama Ibu',
  'Tahun Lahir Ibu',
  'Pendidikan Ibu',
  'Pekerjaan Ibu',
  'Penghasilan Ibu',
  'NIK Ibu',
  'Nama Wali',
  'Tahun Lahir Wali',
  'Pendidikan Wali',
  'Pekerjaan Wali',
  'Penghasilan Wali',
  'NIK Wali',
  'Rombel Saat Ini',
  'No Peserta Ujian Nasional',
  'No Seri Ijazah',
  'Penerima KIP',
  'Nomor KIP',
  'Nama di KIP',
  'Nomor KKS',
  'No Registrasi Akta Lahir',
  'Bank',
  'Nomor Rekening Bank',
  'Rekening Atas Nama',
  'Layak PIP',
  'Alasan Layak PIP',
  'Kebutuhan Khusus',
  'Sekolah Asal',
  'Anak ke-berapa',
  'Lintang',
  'Bujur',
  'No KK',
  'Berat Badan',
  'Tinggi Badan',
  'Lingkar Kepala',
  'Jml. Saudara Kandung',
  'Jarak Rumah ke Sekolah (KM)',
] as const

/** Hilangkan pola mirip formula lembar kerja (=, +, -, @ di awal sel) */
function sanitizeCellValue(raw: string): string {
  let s = raw.trim().slice(0, MAX_CELL_LEN)
  if (/^[=+\-@]/.test(s)) {
    s = s.replace(/^[=+\-@]+/, '').trim()
  }
  return s
}

function cell(row: unknown[], columnIndex: number): string {
  const raw = row[columnIndex]
  if (raw === null || raw === undefined) return ''
  return sanitizeCellValue(String(raw))
}

function digitsOnly(value: string): string {
  return value.replace(/\D+/g, '')
}

function normalizeGender(raw: string): 'L' | 'P' {
  const v = raw.trim().toUpperCase()
  return v === 'P' ? 'P' : 'L'
}

/** Kolom di luar identitas inti & rombel (indeks 9–41, 43–65) untuk tabel `student_details`. */
function buildDapodikExtraColumns(row: unknown[]): Record<string, string> {
  const out: Record<string, string> = {}
  const optionalRanges: [number, number][] = [
    [9, 41],
    [43, 65],
  ]
  for (const [from, to] of optionalRanges) {
    for (let i = from; i <= to; i++) {
      const v = cell(row, i)
      if (v) out[String(i)] = v
    }
  }
  return out
}

function buildDapodikProfile(row: unknown[]): StudentDapodikProfile {
  return {
    no: cell(row, 0),
    namaLengkap: cell(row, 1),
    nipd: digitsOnly(cell(row, 2)),
    jk: cell(row, 3),
    nisn: digitsOnly(cell(row, 4)),
    tempatLahir: cell(row, 5),
    tanggalLahir: cell(row, 6),
    nik: digitsOnly(cell(row, 7)),
    agama: cell(row, 8),
    alamat: cell(row, 9),
    rt: cell(row, 10),
    rw: cell(row, 11),
    dusun: cell(row, 12),
    kelurahan: cell(row, 13),
    kecamatan: cell(row, 14),
    kodePos: cell(row, 15),
    jenisTinggal: cell(row, 16),
    alatTransportasi: cell(row, 17),
    telepon: cell(row, 18),
    hp: cell(row, 19),
    email: cell(row, 20),
    skhun: cell(row, 21),
    penerimaKps: cell(row, 22),
    nomorKps: cell(row, 23),
    dataAyah: {
      nama: cell(row, 24),
      tahunLahir: cell(row, 25),
      pendidikan: cell(row, 26),
      pekerjaan: cell(row, 27),
      penghasilan: cell(row, 28),
      nik: cell(row, 29),
    },
    dataIbu: {
      nama: cell(row, 30),
      tahunLahir: cell(row, 31),
      pendidikan: cell(row, 32),
      pekerjaan: cell(row, 33),
      penghasilan: cell(row, 34),
      nik: cell(row, 35),
    },
    dataWali: {
      nama: cell(row, 36),
      tahunLahir: cell(row, 37),
      pendidikan: cell(row, 38),
      pekerjaan: cell(row, 39),
      penghasilan: cell(row, 40),
      nik: cell(row, 41),
    },
    rombelSaatIni: cell(row, 42),
    nomorPesertaUjianNasional: cell(row, 43),
    nomorSeriIjazah: cell(row, 44),
    penerimaKip: cell(row, 45),
    nomorKip: cell(row, 46),
    namaDiKip: cell(row, 47),
    nomorKks: cell(row, 48),
    nomorRegistrasiAktaLahir: cell(row, 49),
    bank: cell(row, 50),
    nomorRekeningBank: cell(row, 51),
    rekeningAtasNama: cell(row, 52),
    layakPip: cell(row, 53),
    alasanLayakPip: cell(row, 54),
    kebutuhanKhusus: cell(row, 55),
    sekolahAsal: cell(row, 56),
    anakKeBerapa: cell(row, 57),
    lintang: cell(row, 58),
    bujur: cell(row, 59),
    noKk: cell(row, 60),
    beratBadan: cell(row, 61),
    tinggiBadan: cell(row, 62),
    lingkarKepala: cell(row, 63),
    jumlahSaudaraKandung: cell(row, 64),
    jarakRumahKeSekolahKm: cell(row, 65),
  }
}

function isFullyEmptyRow(row: unknown[]): boolean {
  return row.every((value) => sanitizeCellValue(String(value ?? '')) === '')
}

export function parseStudentSpreadsheetDataUrl(dataUrl: string): {
  rows: ImportStudentRow[]
  preview: ImportPreviewData
  error?: string
} {
  try {
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
    const approxBytes = Math.floor((base64.length * 3) / 4)
    if (approxBytes > MAX_BYTES) {
      return {
        rows: [],
        preview: { headers: [], rows: [] },
        error: `Berkas terlalu besar (maks. ${MAX_BYTES / (1024 * 1024)} MB).`,
      }
    }
    const binary = atob(base64)
    const len = binary.length
    if (len > MAX_BYTES) {
      return {
        rows: [],
        preview: { headers: [], rows: [] },
        error: `Berkas terlalu besar (maks. ${MAX_BYTES / (1024 * 1024)} MB).`,
      }
    }
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
    const wb = XLSX.read(bytes.buffer, {
      type: 'array',
      cellDates: false,
    })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    if (!sheet) return { rows: [], preview: { headers: [], rows: [] }, error: 'Lembar kerja kosong.' }
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    })
    const dataRows = matrix.slice(START_DATA_ROW_INDEX)
    if (dataRows.length > MAX_ROWS) {
      return {
        rows: [],
        preview: { headers: [], rows: [] },
        error: `Terlalu banyak baris (maks. ${MAX_ROWS}).`,
      }
    }

    const fileHeaderRow = matrix[START_DATA_ROW_INDEX - 1] ?? []
    const previewHeaders = COLUMN_HEADERS.map((fallback, idx) => {
      const fromFile = sanitizeCellValue(String(fileHeaderRow[idx] ?? ''))
      return fromFile || fallback
    })

    const rows: ImportStudentRow[] = []
    const previewRows: string[][] = []
    for (let idx = 0; idx < dataRows.length; idx++) {
      const rawRow = dataRows[idx] ?? []
      if (isFullyEmptyRow(rawRow)) continue
      const profile = buildDapodikProfile(rawRow)
      if (!profile.namaLengkap || !profile.nisn) continue
      const gender = normalizeGender(profile.jk)
      const dapodikExtraColumns = buildDapodikExtraColumns(rawRow)
      previewRows.push(COLUMN_HEADERS.map((_, colIdx) => cell(rawRow, colIdx)))
      rows.push({
        sourceRowNumber: START_DATA_ROW_INDEX + idx + 1,
        nisn: profile.nisn,
        nipd: profile.nipd,
        nik: profile.nik,
        name: profile.namaLengkap,
        gender,
        className: profile.rombelSaatIni,
        dapodikProfile: profile,
        dapodikExtraColumns,
      })
    }
    return {
      rows,
      preview: {
        headers: previewHeaders,
        rows: previewRows,
      },
    }
  } catch {
    return { rows: [], preview: { headers: [], rows: [] }, error: 'Format berkas tidak valid.' }
  }
}
