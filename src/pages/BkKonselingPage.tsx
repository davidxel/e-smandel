import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  FileText,
  Loader2,
  Printer,
  Search,
  Users,
} from 'lucide-react'
import { FileUploader } from '../components/ui/FileUploader'
import { ModuleTabBar } from '../components/ui/ModuleTabBar'
import {
  BK_CRITICAL_POINTS_THRESHOLD,
  COUNSELING_STATUS_LABELS,
  SP_THRESHOLDS,
} from '../lib/bkCounselingConstants'
import {
  createCounselingLog,
  fetchCounselingLogs,
  fetchCriticalStudents,
  fetchSpRecords,
  updateCounselingLog,
  upsertSpRecord,
  type CriticalStudentRow,
} from '../lib/counselingApi'
import { buildSpPrintableHtml } from '../lib/generateSpDocument'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'
import type { CounselingCaseStatus, CounselingLog, CounselingSessionType, SpLevel } from '../types/schema'

const SCHOOL_NAME = 'SMAN 8 Mandau'

const BK_KONSeling_TABS = [
  { id: 'prioritas' as const, label: 'Prioritas poin' },
  { id: 'telusuri' as const, label: 'Telusuri siswa' },
]

function statusBadgeClass(s: CounselingCaseStatus) {
  if (s === 'perlu_penanganan') return 'bg-amber-100 text-amber-900 ring-amber-200'
  if (s === 'sedang_dibimbing') return 'bg-sky-100 text-sky-900 ring-sky-200'
  return 'bg-emerald-100 text-emerald-900 ring-emerald-200'
}

export function BkKonselingPage() {
  const user = useAuthStore((s) => s.user)
  const students = useDataStore((s) => s.students)
  const users = useDataStore((s) => s.users)
  const classes = useDataStore((s) => s.classes)
  const showToast = useUiStore((s) => s.showToast)

  const [tab, setTab] = useState<'prioritas' | 'telusuri'>('prioritas')
  const [critical, setCritical] = useState<CriticalStudentRow[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [search, setSearch] = useState('')

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [logs, setLogs] = useState<CounselingLog[]>([])
  const [spRows, setSpRows] = useState<Awaited<ReturnType<typeof fetchSpRecords>>>([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [formType, setFormType] = useState<CounselingSessionType>('individu')
  const [formAnalysis, setFormAnalysis] = useState('')
  const [formAction, setFormAction] = useState('')
  const [formStatus, setFormStatus] = useState<CounselingCaseStatus>('sedang_dibimbing')
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const reloadCritical = useCallback(async () => {
    setLoadingList(true)
    try {
      const rows = await fetchCriticalStudents()
      setCritical(rows)
    } catch {
      showToast('Gagal memuat daftar prioritas BK. Periksa koneksi API.', 'error')
      setCritical([])
    } finally {
      setLoadingList(false)
    }
  }, [showToast])

  useEffect(() => {
    void reloadCritical()
  }, [reloadCritical])

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  )
  const selectedUser = useMemo(
    () => (selectedStudent ? users.find((u) => u.id === selectedStudent.userId) : undefined),
    [selectedStudent, users],
  )
  const selectedClassName = useMemo(() => {
    if (!selectedStudent) return '—'
    return classes.find((c) => c.id === selectedStudent.classId)?.name ?? '—'
  }, [classes, selectedStudent])

  const loadStudentDetail = useCallback(
    async (studentId: string) => {
      setLoadingDetail(true)
      setEditingLogId(null)
      setFormDate(new Date().toISOString().slice(0, 10))
      setFormType('individu')
      setFormAnalysis('')
      setFormAction('')
      setFormStatus('sedang_dibimbing')
      setAttachmentUrl(null)
      try {
        const [lg, sp] = await Promise.all([fetchCounselingLogs(studentId), fetchSpRecords(studentId)])
        setLogs(lg)
        setSpRows(sp)
      } catch {
        showToast('Gagal memuat detail konseling.', 'error')
        setLogs([])
        setSpRows([])
      } finally {
        setLoadingDetail(false)
      }
    },
    [showToast],
  )

  useEffect(() => {
    if (selectedStudentId) void loadStudentDetail(selectedStudentId)
  }, [selectedStudentId, loadStudentDetail])

  const browseRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students
      .map((st) => {
        const u = users.find((x) => x.id === st.userId)
        const nm = (u?.name ?? '').toLowerCase()
        const ns = (u?.nisn ?? '').toLowerCase()
        if (q && !nm.includes(q) && !ns.includes(q)) return null
        return { student: st, name: u?.name ?? '—', nisn: u?.nisn ?? '—' }
      })
      .filter(Boolean) as { student: (typeof students)[0]; name: string; nisn: string }[]
  }, [students, users, search])

  const dapodik = selectedStudent?.dapodikProfile
  const displayName = dapodik?.namaLengkap?.trim() || selectedUser?.name || '—'
  const displayNisn = dapodik?.nisn?.trim() || selectedUser?.nisn || '—'
  const displayAddress =
    dapodik?.alamat?.trim() ||
    [dapodik?.dusun, dapodik?.kelurahan, dapodik?.kecamatan].filter(Boolean).join(', ') ||
    '—'

  const openLogEditor = (log: CounselingLog) => {
    setEditingLogId(log.id)
    setFormDate(log.date)
    setFormType(log.sessionType)
    setFormAnalysis(log.analysis)
    setFormAction(log.actionPlan)
    setFormStatus(log.status)
    setAttachmentUrl(log.attachmentUrl)
  }

  const submitLog = async () => {
    if (!selectedStudentId || !user) return
    if (!formAnalysis.trim() || !formAction.trim()) {
      showToast('Analisis dan kesepakatan wajib diisi.', 'error')
      return
    }
    setSaving(true)
    try {
      if (editingLogId) {
        const updated = await updateCounselingLog(editingLogId, {
          date: formDate,
          sessionType: formType,
          analysis: formAnalysis.trim(),
          actionPlan: formAction.trim(),
          status: formStatus,
          attachmentUrl,
        })
        setLogs((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
        showToast('Log konseling diperbarui.', 'success')
      } else {
        const created = await createCounselingLog({
          studentId: selectedStudentId,
          date: formDate,
          sessionType: formType,
          analysis: formAnalysis.trim(),
          actionPlan: formAction.trim(),
          status: formStatus,
          attachmentUrl,
        })
        setLogs((prev) => [created, ...prev])
        showToast('Log konseling disimpan.', 'success')
        setFormAnalysis('')
        setFormAction('')
        setAttachmentUrl(null)
        setEditingLogId(null)
      }
      void reloadCritical()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal menyimpan.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const generateSp = async (level: SpLevel) => {
    if (!selectedStudent || !selectedStudentId) return
    const pts = selectedStudent.totalPoints
    if (pts < SP_THRESHOLDS[level]) {
      showToast(`Poin belum mencapai ambang ${level}.`, 'error')
      return
    }
    const issueDate = new Date().toISOString().slice(0, 10)
    const html = buildSpPrintableHtml({
      level,
      schoolName: SCHOOL_NAME,
      studentName: displayName,
      nisn: displayNisn,
      address: displayAddress,
      className: selectedClassName,
      totalPoints: pts,
      issueDateIso: issueDate,
    })
    const fileUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    try {
      const row = await upsertSpRecord({
        studentId: selectedStudentId,
        spLevel: level,
        issueDate,
        fileUrl,
      })
      setSpRows((prev) => {
        const rest = prev.filter((p) => p.spLevel !== level)
        return [row, ...rest].sort((a, b) => b.issueDate.localeCompare(a.issueDate))
      })
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const w = window.open(url, '_blank')
      if (w) w.addEventListener('beforeunload', () => URL.revokeObjectURL(url))
      showToast(`${level} dicetak / dicatat.`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal menyimpan SP.', 'error')
    }
  }

  const pickStudentFromCritical = (row: CriticalStudentRow) => {
    setSelectedStudentId(row.studentId)
    setTab('prioritas')
  }

  const pickStudentFromBrowse = (studentId: string) => {
    setSelectedStudentId(studentId)
    setTab('telusuri')
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-teal-50/25 to-sky-50/40 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-teal-100/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">
                Manajemen Kasus &amp; Konseling
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                Dashboard prioritas berdasarkan poin pelanggaran (≥ {BK_CRITICAL_POINTS_THRESHOLD} poin), catatan
                bimbingan, dan surat peringatan. Data siswa hanya untuk konseling — bukan pengelolaan master
                siswa.
              </p>
            </div>
            <ModuleTabBar tabs={BK_KONSeling_TABS} value={tab} onChange={setTab} />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-5">
          <aside className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-sky-100 bg-white/95 p-4 shadow-sm">
              {tab === 'prioritas' ? (
                <>
                  <div className="mb-3 flex items-center gap-2 text-slate-700">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-semibold">Siswa prioritas BK</span>
                  </div>
                  {loadingList ? (
                    <div className="flex items-center justify-center py-10 text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : critical.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">
                      Tidak ada siswa di atas ambang {BK_CRITICAL_POINTS_THRESHOLD} poin.
                    </p>
                  ) : (
                    <ul className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
                      {critical.map((row) => (
                        <li key={row.studentId}>
                          <button
                            type="button"
                            onClick={() => pickStudentFromCritical(row)}
                            className={`flex w-full flex-col gap-1 rounded-xl border px-3 py-3 text-left text-sm transition ${
                              selectedStudentId === row.studentId
                                ? 'border-teal-400 bg-teal-50/80 ring-1 ring-teal-200'
                                : 'border-slate-100 bg-slate-50/50 hover:border-teal-200 hover:bg-teal-50/40'
                            }`}
                          >
                            <span className="font-medium text-slate-900">{row.name}</span>
                            <span className="text-xs text-slate-500">
                              {row.className} · NISN {row.nisn} · {row.totalPoints} poin
                            </span>
                            <span
                              className={`mt-1 inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusBadgeClass(row.counselingStatus)}`}
                            >
                              {COUNSELING_STATUS_LABELS[row.counselingStatus]}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <>
                  <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cari nama atau NISN…"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-sky-200 focus:border-sky-400 focus:ring-2"
                    />
                  </div>
                  <ul className="max-h-[480px] space-y-1 overflow-y-auto pr-1">
                    {browseRows.slice(0, 200).map(({ student, name }) => (
                      <li key={student.id}>
                        <button
                          type="button"
                          onClick={() => pickStudentFromBrowse(student.id)}
                          className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm ${
                            selectedStudentId === student.id
                              ? 'border-sky-400 bg-sky-50'
                              : 'border-transparent hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate font-medium text-slate-800">{name}</span>
                          <span className="shrink-0 text-xs text-slate-500">{student.totalPoints} poin</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </aside>

          <section className="space-y-4 lg:col-span-3">
            {!selectedStudent ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-slate-500">
                <div>
                  <Users className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                  <p className="text-sm">Pilih siswa pada daftar di kiri untuk melihat profil ringkas dan log konseling.</p>
                </div>
              </div>
            ) : loadingDetail ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-100 bg-white/90">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-emerald-100/90 bg-white/95 p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-800">Profil ringkas (Dapodik / workspace)</h2>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Nama</dt>
                      <dd className="text-slate-900">{displayName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">NISN</dt>
                      <dd className="text-slate-900">{displayNisn}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Alamat</dt>
                      <dd className="text-slate-800">{displayAddress}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Kelas</dt>
                      <dd className="text-slate-900">{selectedClassName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Total poin</dt>
                      <dd className="font-semibold text-amber-800">{selectedStudent.totalPoints}</dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <span className="w-full text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Generate Surat Peringatan
                    </span>
                    {(['SP3', 'SP2', 'SP1'] as const).map((lvl) => {
                      const min = SP_THRESHOLDS[lvl]
                      const ok = selectedStudent.totalPoints >= min
                      return (
                        <button
                          key={lvl}
                          type="button"
                          disabled={!ok}
                          onClick={() => void generateSp(lvl)}
                          className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                          title={!ok ? `Butuh ≥ ${min} poin` : `Cetak ${lvl}`}
                        >
                          {lvl} (≥{min} poin)
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-white/95 p-5 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-slate-800">Form log konseling</h2>
                    {editingLogId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLogId(null)
                          setFormDate(new Date().toISOString().slice(0, 10))
                          setFormType('individu')
                          setFormAnalysis('')
                          setFormAction('')
                          setFormStatus('sedang_dibimbing')
                          setAttachmentUrl(null)
                        }}
                        className="text-xs font-medium text-sky-700 underline"
                      >
                        Batalkan edit → entri baru
                      </button>
                    ) : null}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                        <Calendar className="h-3.5 w-3.5" />
                        Tanggal bimbingan
                      </label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Jenis bimbingan</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as CounselingSessionType)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      >
                        <option value="individu">Individu</option>
                        <option value="kelompok">Kelompok</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-600">Analisis Guru BK</label>
                      <textarea
                        value={formAnalysis}
                        onChange={(e) => setFormAnalysis(e.target.value)}
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                        placeholder="Diagnosis / observasi perilaku…"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-600">Kesepakatan / solusi</label>
                      <textarea
                        value={formAction}
                        onChange={(e) => setFormAction(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                        placeholder="Rencana tindak lanjut…"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-600">Status kasus</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as CounselingCaseStatus)}
                        className="w-full max-w-xs rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                      >
                        <option value="perlu_penanganan">Perlu Penanganan</option>
                        <option value="sedang_dibimbing">Sedang Dibimbing</option>
                        <option value="selesai">Selesai</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <FileUploader
                        label="Lampiran (foto kegiatan / scan surat)"
                        accept="image/*,.pdf"
                        maxSizeMb={8}
                        description="Opsional. Berkas disimpan aman pada server (data URL)."
                        onDataUrl={(url) => setAttachmentUrl(url)}
                        className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3"
                      />
                      {attachmentUrl ? (
                        <p className="mt-2 text-xs text-emerald-700">Lampiran siap dikirim bersama log.</p>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void submitLog()}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-teal-700 hover:to-sky-700 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {editingLogId ? 'Perbarui log' : 'Simpan log konseling'}
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white/95 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-800">Riwayat log</h3>
                  <ul className="mt-3 divide-y divide-slate-100">
                    {logs.map((log) => (
                      <li key={log.id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm">
                        <div>
                          <div className="font-medium text-slate-900">
                            Sesi #{log.sessionNo} · {log.date} · {log.sessionType === 'individu' ? 'Individu' : 'Kelompok'}
                          </div>
                          <div className="mt-1 text-xs text-slate-600 line-clamp-2">{log.analysis}</div>
                          <span
                            className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusBadgeClass(log.status)}`}
                          >
                            {COUNSELING_STATUS_LABELS[log.status]}
                          </span>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {log.counselorId === user?.id || user?.role === 'super_admin' ? (
                            <button
                              type="button"
                              onClick={() => openLogEditor(log)}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                          ) : null}
                          {log.attachmentUrl ? (
                            <a
                              href={log.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800"
                            >
                              Lampiran
                            </a>
                          ) : null}
                        </div>
                      </li>
                    ))}
                    {logs.length === 0 ? <li className="py-6 text-center text-slate-500">Belum ada log.</li> : null}
                  </ul>
                </div>

                {spRows.length > 0 ? (
                  <div className="rounded-2xl border border-slate-100 bg-white/95 p-5 shadow-sm">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <FileText className="h-4 w-4" />
                      Riwayat SP tercatat
                    </h3>
                    <ul className="mt-2 space-y-2 text-sm">
                      {spRows.map((sp) => (
                        <li key={sp.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                          <span className="font-medium">{sp.spLevel}</span>
                          <span className="text-xs text-slate-500">{sp.issueDate}</span>
                          <a
                            href={sp.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-sky-700"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Buka dokumen
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
