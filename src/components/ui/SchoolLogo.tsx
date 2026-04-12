/** Logo resmi SMA Negeri 8 Mandau — berkas di `public/logo-sekolah.png` */
export const SCHOOL_LOGO_SRC = '/logo-sekolah.png'

type SchoolLogoProps = {
  /** `header`: ikon app bar · `hero`: halaman login */
  variant?: 'header' | 'hero'
  className?: string
}

export function SchoolLogo({ variant = 'header', className = '' }: SchoolLogoProps) {
  const wrap =
    variant === 'hero'
      ? 'mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg ring-2 ring-brand-gold/50'
      : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-0.5 ring-2 ring-brand-gold/50'

  return (
    <div className={`${wrap} ${className}`.trim()}>
      <img
        src={SCHOOL_LOGO_SRC}
        alt="Logo SMA Negeri 8 Mandau"
        className="h-full w-full object-contain"
        width={80}
        height={80}
        decoding="async"
      />
    </div>
  )
}
