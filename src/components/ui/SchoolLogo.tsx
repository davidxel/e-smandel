/** Logo resmi SMA Negeri 8 Mandau — berkas di `public/logo-sekolah.png` */
export const SCHOOL_LOGO_SRC = '/logo-sekolah.png'

type SchoolLogoProps = {
  /** `header`: ikon app bar · `hero`: halaman login */
  variant?: 'header' | 'hero'
  className?: string
  /** Ganti sumber logo (data URL, https, atau path `/...`). `null`/kosong = bawaan. */
  srcOverride?: string | null
  altOverride?: string | null
}

export function SchoolLogo({
  variant = 'header',
  className = '',
  srcOverride,
  altOverride,
}: SchoolLogoProps) {
  const wrap =
    variant === 'hero'
      ? 'mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg ring-2 ring-brand-gold/50'
      : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-0.5 ring-2 ring-brand-gold/50'

  const src =
    srcOverride && srcOverride.trim().length > 0 ? srcOverride.trim() : SCHOOL_LOGO_SRC
  const alt = altOverride?.trim() || 'Logo sekolah'

  return (
    <div className={`${wrap} ${className}`.trim()}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain"
        width={80}
        height={80}
        decoding="async"
      />
    </div>
  )
}
