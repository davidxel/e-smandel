export function DataPrivacyNotice() {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700"
      aria-labelledby="privacy-notice-heading"
    >
      <h2 id="privacy-notice-heading" className="font-semibold text-slate-800">
        Penggunaan data pribadi
      </h2>
      <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
        <li>
          NISN, NIP, kontak orang tua, dan data akademik hanya dipakai untuk operasional sekolah di lingkungan
          yang diizinkan kebijakan madrasah/sekolah.
        </li>
        <li>
          Cadangkan data penting secara berkala; retensi dan akses mengikuti aturan institusi serta peraturan
          perlindungan data yang berlaku.
        </li>
        <li>
          Akun staf dapat menyimpan perubahan ke server API; siswa dan kepala sekolah tidak menulis snapshot
          data ke server sesuai pengaturan keamanan aplikasi.
        </li>
      </ul>
    </section>
  )
}
