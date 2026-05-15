/** Tampilan halaman login (disimpan di MySQL, diatur Super Admin). */
export type LoginBackground =
  | { kind: 'default' }
  | { kind: 'gradient_custom'; from: string; via: string; to: string }
  | { kind: 'image'; dataUrl: string; overlay: number }

export type LoginAppearance = {
  /** `null` = pakai aset statis `/logo-sekolah.png` */
  logoDataUrl: string | null
  logoAlt: string
  title: string
  subtitle: string
  schoolLine: string
  footerLine: string
  infoLine: string
  background: LoginBackground
}

export function defaultLoginAppearance(): LoginAppearance {
  return {
    logoDataUrl: null,
    logoAlt: 'Logo SMA Negeri 8 Mandau',
    title: 'e-Smandel',
    subtitle: 'Sistem Informasi Disiplin & Absensi',
    schoolLine: 'SMAN 8 Mandau',
    footerLine: `© ${new Date().getFullYear()} SMAN 8 Mandau — Lingkungan percobaan`,
    infoLine:
      'Masuk memerlukan API + MySQL (lihat env.example, lalu npm run dev). Data NISN/NIP dan kontak diproses sesuai kebijakan institusi.',
    background: { kind: 'default' },
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function parseBackground(raw: unknown): LoginBackground {
  if (!raw || typeof raw !== 'object') return { kind: 'default' }
  const o = raw as Record<string, unknown>
  const kind = o.kind
  if (kind === 'gradient_custom') {
    const from = typeof o.from === 'string' ? o.from.slice(0, 64) : '#0f172a'
    const via = typeof o.via === 'string' ? o.via.slice(0, 64) : '#1e3a5f'
    const to = typeof o.to === 'string' ? o.to.slice(0, 64) : '#334155'
    return { kind: 'gradient_custom', from, via, to }
  }
  if (kind === 'image') {
    const dataUrl = typeof o.dataUrl === 'string' ? o.dataUrl : ''
    const overlay =
      typeof o.overlay === 'number' && !Number.isNaN(o.overlay) ? clamp(o.overlay, 0, 0.85) : 0.45
    if (!dataUrl.startsWith('data:image/')) return { kind: 'default' }
    return { kind: 'image', dataUrl: dataUrl.slice(0, 4_000_000), overlay }
  }
  return { kind: 'default' }
}

/** Gabungkan nilai dari basis data dengan bawaan aman. */
export function mergeLoginAppearance(raw: unknown): LoginAppearance {
  const d = defaultLoginAppearance()
  if (!raw || typeof raw !== 'object') return d
  const o = raw as Record<string, unknown>

  let logoDataUrl: string | null = d.logoDataUrl
  if (o.logoDataUrl === null) logoDataUrl = null
  else if (typeof o.logoDataUrl === 'string') {
    const s = o.logoDataUrl.trim()
    if (s.length === 0) logoDataUrl = null
    else if (s.startsWith('data:image/') && s.length <= 2_500_000) logoDataUrl = s
    else if (s.startsWith('https://') && s.length <= 2048) logoDataUrl = s
    else logoDataUrl = d.logoDataUrl
  }

  return {
    logoDataUrl,
    logoAlt: typeof o.logoAlt === 'string' ? o.logoAlt.slice(0, 200) : d.logoAlt,
    title: typeof o.title === 'string' ? o.title.slice(0, 120) : d.title,
    subtitle: typeof o.subtitle === 'string' ? o.subtitle.slice(0, 240) : d.subtitle,
    schoolLine: typeof o.schoolLine === 'string' ? o.schoolLine.slice(0, 160) : d.schoolLine,
    footerLine: typeof o.footerLine === 'string' ? o.footerLine.slice(0, 400) : d.footerLine,
    infoLine: typeof o.infoLine === 'string' ? o.infoLine.slice(0, 600) : d.infoLine,
    background: parseBackground(o.background),
  }
}
