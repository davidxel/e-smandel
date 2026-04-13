import React, { useEffect, useMemo } from 'react'
import QRCode from 'react-qr-code'
import { IdCard, School } from 'lucide-react'
import { FileUploader } from '../components/ui/FileUploader'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'
import { ROLE_LABELS } from '../types/roles'
import { formatStaffTitle, getStudentClassLabel } from '../lib/userDisplay'

/** Payload pendek agar muat di semua versi QR; detail lengkap tetap di kartu. */
function buildQrPayload(userId: string): string {
  return JSON.stringify({
    app: 'e-Smandel',
    institusi: 'SMAN 8 Mandau',
    id: userId,
    v: 1,
  })
}

type QrBoundaryProps = { value: string; children: React.ReactNode }
type QrBoundaryState = { hasError: boolean }

class ProfileQrBoundary extends React.Component<QrBoundaryProps, QrBoundaryState> {
  state: QrBoundaryState = { hasError: false }

  static getDerivedStateFromError(): QrBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(): void {
    // #region agent log
    fetch('http://127.0.0.1:7923/ingest/5ca3b835-f44b-49b1-84e7-96e4128da844', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'd9b12b',
      },
      body: JSON.stringify({
        sessionId: 'd9b12b',
        hypothesisId: 'H3-FIX',
        location: 'ProfilePage.tsx:ProfileQrBoundary',
        message: 'QR subtree error caught',
        data: {},
        timestamp: Date.now(),
        runId: 'post-fix',
      }),
    }).catch(() => {})
    // #endregion
  }

  componentDidUpdate(prevProps: QrBoundaryProps): void {
    if (prevProps.value !== this.props.value && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-xs text-amber-900">
          Kode QR tidak dapat ditampilkan. Data NIP/NISN di kartu tetap berlaku.
        </div>
      )
    }
    return this.props.children
  }
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const refreshSessionUser = useAuthStore((s) => s.refreshSessionUser)
  const updateUser = useDataStore((s) => s.updateUser)
  const updateSensitiveUserByActor = useDataStore((s) => s.updateSensitiveUserByActor)
  const getStudentByUserId = useDataStore((s) => s.getStudentByUserId)
  const getClassById = useDataStore((s) => s.getClassById)
  const showToast = useUiStore((s) => s.showToast)
  const [editName, setEditName] = React.useState('')
  const [editNip, setEditNip] = React.useState('')
  const [editNisn, setEditNisn] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7923/ingest/5ca3b835-f44b-49b1-84e7-96e4128da844', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'd9b12b',
      },
      body: JSON.stringify({
        sessionId: 'd9b12b',
        hypothesisId: 'H3',
        location: 'ProfilePage.tsx:useEffect',
        message: 'ProfilePage mounted',
        data: { userPresent: !!user, role: user?.role },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
  }, [user])
  // #endregion

  const student = user ? getStudentByUserId(user.id) : undefined
  const className = student ? getClassById(student.classId)?.name : undefined

  const qrPayload = useMemo(() => {
    if (!user) return ''
    return buildQrPayload(user.id)
  }, [user])

  if (!user) return null

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = updateSensitiveUserByActor(user.id, user.id, {
      name: editName || user.name,
      nip: editNip || user.nip,
      nisn: editNisn || user.nisn,
    })
    if (!res.ok) {
      showToast(res.message ?? 'Gagal menyimpan profil.', 'error')
      setSaving(false)
      return
    }
    refreshSessionUser()
    showToast('Profil berhasil diperbarui.', 'success')
    setSaving(false)
  }

  const handlePhoto = (dataUrl: string) => {
    updateUser(user.id, { profilePhotoDataUrl: dataUrl })
    refreshSessionUser()
    showToast('Foto profil diperbarui.', 'success')
  }

  const jabatanAtauKelas =
    user.role === 'siswa'
      ? getStudentClassLabel(student, className)
      : formatStaffTitle(user.role, user.jabatan)

  const idLabel = user.role === 'siswa' ? 'NISN' : 'NIP'
  const idValue = user.role === 'siswa' ? user.nisn ?? '—' : user.nip ?? '—'

  React.useEffect(() => {
    setEditName(user.name)
    setEditNip(user.nip ?? '')
    setEditNisn(user.nisn ?? '')
  }, [user])

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">
          Profil &amp; identitas digital
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Kartu identitas menampilkan NIP/NISN dan kode QR statis untuk verifikasi
          cepat.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border-2 border-brand-navy/20 bg-gradient-to-br from-brand-navy to-brand-navy-dark p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-stretch md:justify-between">
          <div className="flex gap-4">
            <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-brand-gold/50 bg-white/10">
              {user.profilePhotoDataUrl ? (
                <img
                  src={user.profilePhotoDataUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/40">
                  <IdCard className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-brand-gold-light">
                {ROLE_LABELS[user.role]}
              </p>
              <h2 className="mt-1 text-lg font-bold leading-snug md:text-xl">
                {user.name}
              </h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-white/85">
                <School className="h-4 w-4 shrink-0 text-brand-gold-light" />
                {user.role === 'siswa' ? `Kelas ${jabatanAtauKelas}` : jabatanAtauKelas}
              </p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-white/60">{idLabel}</dt>
                  <dd className="font-mono tabular-nums">{idValue}</dd>
                </div>
                {user.role === 'siswa' ? (
                  <>
                    <div className="flex gap-2">
                      <dt className="w-14 shrink-0 text-white/60">Gender</dt>
                      <dd>{student?.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-14 shrink-0 text-white/60">HP</dt>
                      <dd className="font-mono tabular-nums">{student?.studentPhone || '—'}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-14 shrink-0 text-white/60">Ortu</dt>
                      <dd>{student?.parentName || '—'}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-14 shrink-0 text-white/60">WA Ortu</dt>
                      <dd className="font-mono tabular-nums">{student?.parentPhone || '—'}</dd>
                    </div>
                  </>
                ) : null}
              </dl>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl bg-white p-4 text-slate-900 shadow-inner">
            <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              QR identitas
            </p>
            <div className="rounded-lg bg-white p-1">
              <ProfileQrBoundary value={qrPayload || '-'}>
                <QRCode value={qrPayload || '-'} size={120} level="M" />
              </ProfileQrBoundary>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">
          Unggah foto profil
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Format gambar (JPG/PNG). Disimpan lokal di peramban Anda (demo).
        </p>
        <div className="mt-4">
          <FileUploader
            label="Berkas foto"
            accept="image/jpeg,image/png,image/webp"
            maxSizeMb={2}
            description="Foto wajah terbaru untuk ditampilkan di kartu identitas."
            onDataUrl={(url) => handlePhoto(url)}
          />
        </div>
      </div>

      <form
        onSubmit={handleSaveIdentity}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-sm font-semibold text-slate-800">Edit identitas profil</h3>
        <div>
          <label className="text-xs font-medium text-slate-600">Nama</label>
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        {user.role === 'siswa' ? (
          <div>
            <label className="text-xs font-medium text-slate-600">NISN</label>
            <input
              value={editNisn}
              onChange={(e) => setEditNisn(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium text-slate-600">NIP</label>
            <input
              value={editNip}
              onChange={(e) => setEditNip(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-fit rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  )
}
