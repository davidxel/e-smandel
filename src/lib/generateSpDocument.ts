import type { SpLevel } from '../types/schema'

const SP_TITLE: Record<SpLevel, string> = {
  SP1: 'Surat Peringatan I (Kedisiplinan)',
  SP2: 'Surat Peringatan II (Kedisiplinan)',
  SP3: 'Surat Peringatan III (Kedisiplinan)',
}

export type SpDocumentInput = {
  level: SpLevel
  schoolName: string
  studentName: string
  nisn: string
  address: string
  className: string
  totalPoints: number
  issueDateIso: string
}

/** HTML cetak surat peringatan dengan placeholder tanda tangan & stempel */
export function buildSpPrintableHtml(input: SpDocumentInput): string {
  const issue = new Date(input.issueDateIso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const title = SP_TITLE[input.level]
  const bodyText =
    input.level === 'SP1'
      ? 'Berdasarkan akumulasi poin pelanggaran dan hasil pembinaan, dengan ini kami sampaikan Surat Peringatan I.'
      : input.level === 'SP2'
        ? 'Berdasarkan evaluasi lanjutan terhadap kedisiplinan, dengan ini kami sampaikan Surat Peringatan II.'
        : 'Berdasarkan monitoring wali kelas dan unit konseling, dengan ini kami sampaikan Surat Peringatan III.'

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; color: #1e293b; line-height: 1.45; max-width: 720px; margin: 0 auto; padding: 12px; }
    .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-bottom: 18px; }
    .school { font-size: 14pt; font-weight: bold; letter-spacing: 0.02em; }
    .addr { font-size: 10pt; color: #475569; margin-top: 4px; }
    h1 { font-size: 13pt; text-align: center; margin: 20px 0 16px; text-decoration: underline; }
    table.meta { width: 100%; border-collapse: collapse; margin: 14px 0; }
    table.meta td { padding: 6px 8px; vertical-align: top; border: 1px solid #cbd5e1; }
    table.meta td.k { width: 28%; background: #f0fdfa; font-weight: 600; }
    .body { text-align: justify; margin: 16px 0; }
    .sign { display: flex; justify-content: flex-end; margin-top: 36px; gap: 48px; }
    .signbox { text-align: center; width: 220px; }
    .stamp { height: 96px; border: 2px dashed #94a3b8; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 10pt; margin-bottom: 8px; background: #f8fafc; }
    .nip { font-size: 10pt; color: #475569; }
  </style>
</head>
<body>
  <div class="header">
    <div class="school">${escapeHtml(input.schoolName)}</div>
    <div class="addr">Dokumen resmi — data siswa mengacu pada Dapodik</div>
  </div>
  <h1>${escapeHtml(title)}</h1>
  <p>Nomor: ______/SP-${input.level}/SKM/${new Date(input.issueDateIso).getFullYear()}</p>
  <p>Yang bertanda tangan di bawah ini Kepala ${escapeHtml(input.schoolName)}, menerangkan bahwa:</p>
  <table class="meta">
    <tr><td class="k">Nama</td><td>${escapeHtml(input.studentName)}</td></tr>
    <tr><td class="k">NISN</td><td>${escapeHtml(input.nisn)}</td></tr>
    <tr><td class="k">Kelas / Rombel</td><td>${escapeHtml(input.className)}</td></tr>
    <tr><td class="k">Alamat (Dapodik)</td><td>${escapeHtml(input.address || '—')}</td></tr>
    <tr><td class="k">Total poin pelanggaran</td><td>${input.totalPoints}</td></tr>
  </table>
  <div class="body">
    <p>${bodyText}</p>
    <p>Siswa diharapkan memperbaiki perilaku, mematuhi tata tertib, dan berkoordinasi dengan wali kelas serta Guru BK.</p>
    <p>Demikian surat ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
  </div>
  <p>Dibuat di _______________, tanggal ${escapeHtml(issue)}.</p>
  <div class="sign">
    <div class="signbox">
      <div class="stamp">Stempel sekolah<br/>(placeholder)</div>
      <div>Wali Kelas</div>
      <div style="height:56px"></div>
      <div>( ______________________ )</div>
    </div>
    <div class="signbox">
      <div class="stamp">Tanda tangan digital<br/>Kepala Sekolah<br/>(placeholder)</div>
      <div>Kepala Sekolah</div>
      <div style="height:56px"></div>
      <div>( ______________________ )</div>
      <div class="nip">NIP. ____________________</div>
    </div>
  </div>
  <p style="margin-top:28px;font-size:10pt;color:#64748b;">Guru BK: tanda tangan manual dapat ditambahkan setelah cetak jika diperlukan.</p>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
