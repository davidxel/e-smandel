import { useEffect, useState, type FormEvent } from 'react'
import { Image as ImageIcon, Palette, RotateCcw, Save } from 'lucide-react'
import { apiRequest } from '../../lib/api'
import { useUiStore } from '../../store/uiStore'
import type { LoginAppearance, LoginBackground } from '../../types/loginAppearance'
import { defaultLoginAppearance } from '../../types/loginAppearance'

const MAX_LOGO_BYTES = 1_800_000
const MAX_BG_BYTES = 3_200_000

function readFileAsDataUrl(file: File, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Pilih berkas gambar (PNG/JPEG/WebP).'))
      return
    }
    if (file.size > maxBytes) {
      reject(new Error(`Berkas terlalu besar (maks. sekitar ${Math.round(maxBytes / 1_000_000)} MB).`))
      return
    }
    const r = new FileReader()
    r.onload = () => {
      const s = typeof r.result === 'string' ? r.result : ''
      if (!s.startsWith('data:image/')) {
        reject(new Error('Gagal membaca gambar.'))
        return
      }
      resolve(s)
    }
    r.onerror = () => reject(new Error('Gagal membaca berkas.'))
    r.readAsDataURL(file)
  })
}

export function AdminLoginTampilanPage() {
  const showToast = useUiStore((s) => s.showToast)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<LoginAppearance>(() => defaultLoginAppearance())

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiRequest('/api/settings/login-appearance')
        if (!res.ok) {
          let msg = 'Gagal memuat pengaturan.'
          try {
            const j = (await res.json()) as { message?: string }
            if (j.message) msg = j.message
          } catch {
            /* ignore */
          }
          if (!cancelled) showToast(msg, 'error')
          return
        }
        const j = (await res.json()) as { appearance?: LoginAppearance }
        if (!cancelled && j.appearance) setForm(j.appearance)
      } catch {
        if (!cancelled) showToast('Gagal memuat pengaturan (jaringan).', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [showToast])

  const setBackground = (next: LoginBackground) => {
    setForm((f) => ({ ...f, background: next }))
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (form.background.kind === 'image' && !form.background.dataUrl.trim()) {
      showToast('Unggah gambar latar terlebih dahulu, atau pilih jenis latar lain.', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await apiRequest('/api/settings/login-appearance', {
        method: 'PUT',
        json: form,
      })
      if (!res.ok) {
        let msg = 'Gagal menyimpan.'
        try {
          const j = (await res.json()) as { message?: string }
          if (j.message) msg = j.message
        } catch {
          /* ignore */
        }
        showToast(msg, 'error')
        return
      }
      const j = (await res.json()) as { appearance?: LoginAppearance }
      if (j.appearance) setForm(j.appearance)
      showToast('Tampilan login disimpan.', 'success')
    } catch {
      showToast('Gagal menyimpan (jaringan).', 'error')
    } finally {
      setSaving(false)
    }
  }

  const bg = form.background

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Tampilan halaman login</h1>
        <p className="mt-1 text-sm text-slate-600">
          Hanya Super Admin. Pengaturan disimpan di basis data dan langsung dipakai halaman login
          publik (logo, teks, latar belakang).
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Memuat…</p>
      ) : (
        <form
          onSubmit={handleSave}
          className="max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Logo login</label>
            <p className="mb-2 text-xs text-slate-500">
              Kosongkan dengan tombol hapus untuk kembali ke logo bawaan aplikasi.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="max-w-full text-sm text-slate-700"
                onChange={async (ev) => {
                  const file = ev.target.files?.[0]
                  ev.target.value = ''
                  if (!file) return
                  try {
                    const url = await readFileAsDataUrl(file, MAX_LOGO_BYTES)
                    setForm((f) => ({ ...f, logoDataUrl: url }))
                    showToast('Logo diperbarui (belum disimpan).', 'info')
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : 'Gagal memuat logo.', 'error')
                  }
                }}
              />
              {form.logoDataUrl ? (
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setForm((f) => ({ ...f, logoDataUrl: null }))}
                >
                  Hapus logo kustom
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Teks alternatif logo</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.logoAlt}
                onChange={(e) => setForm((f) => ({ ...f, logoAlt: e.target.value }))}
                maxLength={200}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Judul utama</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                maxLength={120}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Baris nama sekolah</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.schoolLine}
                onChange={(e) => setForm((f) => ({ ...f, schoolLine: e.target.value }))}
                maxLength={160}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Subjudul</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                maxLength={240}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Catatan kaki</label>
              <textarea
                className="min-h-[72px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.footerLine}
                onChange={(e) => setForm((f) => ({ ...f, footerLine: e.target.value }))}
                maxLength={400}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Teks informasi kecil</label>
              <textarea
                className="min-h-[72px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.infoLine}
                onChange={(e) => setForm((f) => ({ ...f, infoLine: e.target.value }))}
                maxLength={600}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Palette className="h-4 w-4 text-brand-navy" aria-hidden />
              Latar belakang
            </p>
            <div className="space-y-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="bg"
                  checked={bg.kind === 'default'}
                  onChange={() => setBackground({ kind: 'default' })}
                />
                Bawaan aplikasi (gradien biru emas)
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="bg"
                  checked={bg.kind === 'gradient_custom'}
                  onChange={() =>
                    setBackground({
                      kind: 'gradient_custom',
                      from: '#0f172a',
                      via: '#1e3a5f',
                      to: '#334155',
                    })
                  }
                />
                Gradien kustom (warna CSS)
              </label>
              {bg.kind === 'gradient_custom' ? (
                <div className="ml-6 grid gap-2 sm:grid-cols-3">
                  {(['from', 'via', 'to'] as const).map((k) => (
                    <label key={k} className="block text-xs text-slate-600">
                      {k}
                      <input
                        type="text"
                        className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        value={bg[k]}
                        onChange={(e) =>
                          setBackground({
                            kind: 'gradient_custom',
                            from: k === 'from' ? e.target.value : bg.from,
                            via: k === 'via' ? e.target.value : bg.via,
                            to: k === 'to' ? e.target.value : bg.to,
                          })
                        }
                        maxLength={64}
                      />
                    </label>
                  ))}
                </div>
              ) : null}
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="bg"
                  checked={bg.kind === 'image'}
                  onChange={() =>
                    setBackground({
                      kind: 'image',
                      dataUrl: '',
                      overlay: 0.45,
                    })
                  }
                />
                <span className="inline-flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" aria-hidden />
                  Gambar latar (dimuat ke basis data sebagai data URL)
                </span>
              </label>
              {bg.kind === 'image' ? (
                <div className="ml-6 space-y-3">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="max-w-full text-sm"
                    onChange={async (ev) => {
                      const file = ev.target.files?.[0]
                      ev.target.value = ''
                      if (!file) return
                      try {
                        const url = await readFileAsDataUrl(file, MAX_BG_BYTES)
                        setForm((f) => ({
                          ...f,
                          background:
                            f.background.kind === 'image'
                              ? { kind: 'image', dataUrl: url, overlay: f.background.overlay }
                              : { kind: 'image', dataUrl: url, overlay: 0.45 },
                        }))
                        showToast('Gambar latar diperbarui (belum disimpan).', 'info')
                      } catch (err) {
                        showToast(err instanceof Error ? err.message : 'Gagal memuat gambar.', 'error')
                      }
                    }}
                  />
                  <label className="block text-xs text-slate-600">
                    Gelapkan gambar (overlay):{' '}
                    <span className="font-mono tabular-nums">
                      {bg.dataUrl ? bg.overlay.toFixed(2) : '—'}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={0.85}
                      step={0.05}
                      className="mt-1 block w-full"
                      disabled={!bg.dataUrl}
                      value={bg.dataUrl ? bg.overlay : 0}
                      onChange={(e) => {
                        const overlay = Number(e.target.value)
                        setForm((f) =>
                          f.background.kind === 'image'
                            ? { ...f, background: { kind: 'image', dataUrl: f.background.dataUrl, overlay } }
                            : f,
                        )
                      }}
                    />
                  </label>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-navy-dark disabled:opacity-60"
            >
              <Save className="h-4 w-4" aria-hidden />
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setForm(defaultLoginAppearance())
                showToast('Form dikembalikan ke bawaan (klik Simpan untuk menulis ke basis data).', 'info')
              }}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset form ke bawaan
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
