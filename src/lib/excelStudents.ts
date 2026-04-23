import * as XLSX from 'xlsx'

export type ImportStudentRow = {
  nisn: string
  name: string
  className: string
}

const MAX_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 5000
const MAX_CELL_LEN = 500

function normKey(k: string) {
  return k.replace(/\s+/g, '').toLowerCase()
}

/** Hilangkan pola mirip formula lembar kerja (=, +, -, @ di awal sel) */
function sanitizeCellValue(raw: string): string {
  let s = raw.trim().slice(0, MAX_CELL_LEN)
  if (/^[=+\-@]/.test(s)) {
    s = s.replace(/^[=+\-@]+/, '').trim()
  }
  return s
}

/** Ambil nilai sel dari baris objek dengan beberapa alias header */
function pick(row: Record<string, unknown>, keys: string[]): string {
  const entries = Object.entries(row)
  for (const [k, v] of entries) {
    const nk = normKey(String(k))
    if (keys.some((alias) => normKey(alias) === nk)) {
      if (v === null || v === undefined) return ''
      return sanitizeCellValue(String(v))
    }
  }
  return ''
}

export function parseStudentSpreadsheetDataUrl(dataUrl: string): {
  rows: ImportStudentRow[]
  error?: string
} {
  try {
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
    const approxBytes = Math.floor((base64.length * 3) / 4)
    if (approxBytes > MAX_BYTES) {
      return {
        rows: [],
        error: `Berkas terlalu besar (maks. ${MAX_BYTES / (1024 * 1024)} MB).`,
      }
    }
    const binary = atob(base64)
    const len = binary.length
    if (len > MAX_BYTES) {
      return {
        rows: [],
        error: `Berkas terlalu besar (maks. ${MAX_BYTES / (1024 * 1024)} MB).`,
      }
    }
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
    const wb = XLSX.read(bytes.buffer, { type: 'array', cellDates: false })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    if (!sheet) return { rows: [], error: 'Lembar kerja kosong.' }
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    })
    if (json.length > MAX_ROWS) {
      return {
        rows: [],
        error: `Terlalu banyak baris (maks. ${MAX_ROWS}).`,
      }
    }
    const rows: ImportStudentRow[] = []
    for (const r of json) {
      const nisn = pick(r, ['nisn', 'nis', 'nomor induk'])
      const name = pick(r, ['nama', 'name', 'nama lengkap', 'nama siswa'])
      const className = pick(r, ['kelas', 'class', 'nama kelas'])
      if (!nisn && !name && !className) continue
      rows.push({ nisn, name, className })
    }
    return { rows }
  } catch {
    return { rows: [], error: 'Format berkas tidak valid.' }
  }
}
