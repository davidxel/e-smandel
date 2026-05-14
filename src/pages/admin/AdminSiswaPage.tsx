import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { apiSetPassword } from '../../lib/api'
import { FileUploader } from '../../components/ui/FileUploader'
import { ModuleTabBar } from '../../components/ui/ModuleTabBar'
import { PaginatedTable } from '../../components/ui/PaginatedTable'
import { parseStudentSpreadsheetDataUrl } from '../../lib/excelStudents'
import type { ImportPreviewData, ImportStudentRow } from '../../lib/excelStudents'
import { flushWorkspacePushNowAsync } from '../../lib/workspaceSync'
import { UNCLASSIFIED_CLASS_ID } from '../../lib/classConstants'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import type {
  Student,
  StudentDapodikProfile,
  StudentHealthConditionKey,
  StudentHealthHistory,
} from '../../types/schema'

type Row = { student: Student; name: string; nisn: string }

type AdminSiswaTab = 'kelola' | 'impor'

const ADMIN_SISWA_TABS: { id: AdminSiswaTab; label: string }[] = [
  { id: 'kelola', label: 'Kelola data siswa' },
  { id: 'impor', label: 'Impor Dapodik' },
]

const emptyDapodikProfile = (): StudentDapodikProfile => ({
  no: '',
  namaLengkap: '',
  nipd: '',
  jk: 'L',
  nisn: '',
  tempatLahir: '',
  tanggalLahir: '',
  nik: '',
  agama: '',
  alamat: '',
  rt: '',
  rw: '',
  dusun: '',
  kelurahan: '',
  kecamatan: '',
  kodePos: '',
  jenisTinggal: '',
  alatTransportasi: '',
  telepon: '',
  hp: '',
  email: '',
  skhun: '',
  penerimaKps: '',
  nomorKps: '',
  dataAyah: {
    nama: '',
    tahunLahir: '',
    pendidikan: '',
    pekerjaan: '',
    penghasilan: '',
    nik: '',
  },
  dataIbu: {
    nama: '',
    tahunLahir: '',
    pendidikan: '',
    pekerjaan: '',
    penghasilan: '',
    nik: '',
  },
  dataWali: {
    nama: '',
    tahunLahir: '',
    pendidikan: '',
    pekerjaan: '',
    penghasilan: '',
    nik: '',
  },
  rombelSaatIni: '',
  nomorPesertaUjianNasional: '',
  nomorSeriIjazah: '',
  penerimaKip: '',
  nomorKip: '',
  namaDiKip: '',
  nomorKks: '',
  nomorRegistrasiAktaLahir: '',
  bank: '',
  nomorRekeningBank: '',
  rekeningAtasNama: '',
  layakPip: '',
  alasanLayakPip: '',
  kebutuhanKhusus: '',
  sekolahAsal: '',
  anakKeBerapa: '',
  lintang: '',
  bujur: '',
  noKk: '',
  beratBadan: '',
  tinggiBadan: '',
  lingkarKepala: '',
  jumlahSaudaraKandung: '',
  jarakRumahKeSekolahKm: '',
})

const HEALTH_CONDITION_LABELS: Array<{ key: StudentHealthConditionKey; label: string }> = [
  { key: 'alergi', label: 'Alergi' },
  { key: 'tbc', label: 'T.B.C' },
  { key: 'sakit_kuning', label: 'Sakit Kuning' },
  { key: 'hati', label: 'Hati' },
  { key: 'jantung', label: 'Jantung' },
  { key: 'geger_otak', label: 'Geger Otak' },
  { key: 'typus', label: 'Typus' },
  { key: 'maag', label: 'Maag' },
  { key: 'mata', label: 'Mata' },
  { key: 'epilepsi', label: 'Epilepsi' },
  { key: 'kecelakaan', label: 'Kecelakaan' },
]

const emptyHealthHistory = (): StudentHealthHistory => ({
  conditions: {
    alergi: { checked: false, year: '' },
    tbc: { checked: false, year: '' },
    sakit_kuning: { checked: false, year: '' },
    hati: { checked: false, year: '' },
    jantung: { checked: false, year: '' },
    geger_otak: { checked: false, year: '' },
    typus: { checked: false, year: '' },
    maag: { checked: false, year: '' },
    mata: { checked: false, year: '' },
    epilepsi: { checked: false, year: '' },
    kecelakaan: { checked: false, year: '' },
  },
  otherConditionName: '',
  otherConditionChecked: false,
  otherConditionYear: '',
})

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm text-slate-800">{value?.trim() ? value : '—'}</div>
    </div>
  )
}

export function AdminSiswaPage() {
  const students = useDataStore((s) => s.students)
  const classes = useDataStore((s) => s.classes)
  const addStudent = useDataStore((s) => s.addStudent)
  const updateStudent = useDataStore((s) => s.updateStudent)
  const updateUser = useDataStore((s) => s.updateUser)
  const deleteStudent = useDataStore((s) => s.deleteStudent)
  const importStudentsFromRows = useDataStore((s) => s.importStudentsFromRows)
  const bulkAssignStudentsToClass = useDataStore((s) => s.bulkAssignStudentsToClass)
  const getUserById = useDataStore((s) => s.getUserById)
  const getClassById = useDataStore((s) => s.getClassById)
  const showToast = useUiStore((s) => s.showToast)

  const [nama, setNama] = useState('')
  const [nisn, setNisn] = useState('')
  const [classId, setClassId] = useState('')
  const [pass, setPass] = useState('siswa123')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [studentPhone, setStudentPhone] = useState('')
  const [gender, setGender] = useState<'L' | 'P'>('L')
  const [studentPhotoDataUrl, setStudentPhotoDataUrl] = useState<string | null>(null)
  const [dapodikForm, setDapodikForm] = useState<StudentDapodikProfile>(() => emptyDapodikProfile())
  const [healthForm, setHealthForm] = useState<StudentHealthHistory>(() => emptyHealthHistory())
  const [editing, setEditing] = useState<Student | null>(null)
  const [eNama, setENama] = useState('')
  const [eNisn, setENisn] = useState('')
  const [eClassId, setEClassId] = useState('')
  const [ePass, setEPass] = useState('siswa123')
  const [ePoin, setEPoin] = useState(0)
  const [eParentName, setEParentName] = useState('')
  const [eParentPhone, setEParentPhone] = useState('')
  const [eStudentPhone, setEStudentPhone] = useState('')
  const [eGender, setEGender] = useState<'L' | 'P'>('L')
  const [ePhotoDataUrl, setEPhotoDataUrl] = useState<string | null>(null)
  const [eDapodikForm, setEDapodikForm] = useState<StudentDapodikProfile>(() => emptyDapodikProfile())
  const [eHealthForm, setEHealthForm] = useState<StudentHealthHistory>(() => emptyHealthHistory())
  const [previewOpen, setPreviewOpen] = useState(false)
  const [pendingImportRows, setPendingImportRows] = useState<ImportStudentRow[]>([])
  const [previewData, setPreviewData] = useState<ImportPreviewData>({
    headers: [],
    rows: [],
  })
  const [isImporting, setIsImporting] = useState(false)
  const [importErrorModalOpen, setImportErrorModalOpen] = useState(false)
  const [importErrorMessages, setImportErrorMessages] = useState<string[]>([])
  const [importWarningMessages, setImportWarningMessages] = useState<string[]>([])
  const [bulkTargetClassId, setBulkTargetClassId] = useState('')
  const [bulkSelected, setBulkSelected] = useState<Record<string, boolean>>({})
  const [selectedClassFilter, setSelectedClassFilter] = useState('all')
  const [detailRow, setDetailRow] = useState<Row | null>(null)
  const [moduleTab, setModuleTab] = useState<AdminSiswaTab>('kelola')

  const rows: Row[] = students
    .map((student) => {
      const u = getUserById(student.userId)
      if (!u || u.role !== 'siswa') return null
      return { student, name: u.name, nisn: u.nisn ?? '' }
    })
    .filter((x): x is Row => x !== null)

  useEffect(() => {
    if (previewOpen) setModuleTab('impor')
  }, [previewOpen])

  const resetAdd = () => {
    setNama('')
    setNisn('')
    setClassId('')
    setPass('siswa123')
    setParentName('')
    setParentPhone('')
    setStudentPhone('')
    setGender('L')
    setStudentPhotoDataUrl(null)
    setDapodikForm(emptyDapodikProfile())
    setHealthForm(emptyHealthHistory())
  }

  const setDapodikField = (key: keyof StudentDapodikProfile, value: string) => {
    setDapodikForm((prev) => ({ ...prev, [key]: value }))
  }

  const setParentGroupField = (
    group: 'dataAyah' | 'dataIbu' | 'dataWali',
    key: keyof StudentDapodikProfile['dataAyah'],
    value: string,
  ) => {
    setDapodikForm((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value,
      },
    }))
  }

  const setHealthCondition = (
    key: StudentHealthConditionKey,
    patch: Partial<StudentHealthHistory['conditions'][StudentHealthConditionKey]>,
  ) => {
    setHealthForm((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [key]: {
          ...prev.conditions[key],
          ...patch,
        },
      },
    }))
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classId) {
      showToast('Pilih kelas.', 'error')
      return
    }
    try {
      const plain = pass || 'siswa123'
      const mergedProfile: StudentDapodikProfile = {
        ...dapodikForm,
        namaLengkap: nama.trim(),
        nisn: nisn.trim(),
        jk: gender,
        rombelSaatIni: getClassById(classId)?.name ?? dapodikForm.rombelSaatIni,
      }
      const { user } = addStudent({
        name: nama,
        nisn,
        classId,
        password: plain,
        parentName,
        parentPhone,
        studentPhone,
        gender,
        dapodikProfile: mergedProfile,
        healthHistory: healthForm,
      })
      if (studentPhotoDataUrl) {
        updateUser(user.id, { profilePhotoDataUrl: studentPhotoDataUrl })
      }
      await flushWorkspacePushNowAsync()
      const syncPw = await apiSetPassword(user.id, plain)
      if (!syncPw.ok) {
        showToast(syncPw.message ?? 'Siswa ditambahkan lokal; gagal menyimpan hash kata sandi ke server.', 'error')
      } else {
        showToast('Siswa ditambahkan.', 'success')
      }
      resetAdd()
    } catch (err) {
      showToast(String(err), 'error')
    }
  }

  const openEdit = (r: Row) => {
    setModuleTab('kelola')
    const u = getUserById(r.student.userId)
    setEditing(r.student)
    setENama(r.name)
    setENisn(r.nisn)
    setEClassId(r.student.classId)
    setEPass('siswa123')
    setEPoin(r.student.totalPoints)
    setEParentName(r.student.parentName)
    setEParentPhone(r.student.parentPhone)
    setEStudentPhone(r.student.studentPhone)
    setEGender(r.student.gender)
    setEPhotoDataUrl(u?.profilePhotoDataUrl ?? null)
    setEDapodikForm(r.student.dapodikProfile ?? emptyDapodikProfile())
    setEHealthForm(r.student.healthHistory ?? emptyHealthHistory())
  }

  const setEditDapodikField = (key: keyof StudentDapodikProfile, value: string) => {
    setEDapodikForm((prev) => ({ ...prev, [key]: value }))
  }

  const setEditParentGroupField = (
    group: 'dataAyah' | 'dataIbu' | 'dataWali',
    key: keyof StudentDapodikProfile['dataAyah'],
    value: string,
  ) => {
    setEDapodikForm((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value,
      },
    }))
  }

  const setEditHealthCondition = (
    key: StudentHealthConditionKey,
    patch: Partial<StudentHealthHistory['conditions'][StudentHealthConditionKey]>,
  ) => {
    setEHealthForm((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [key]: {
          ...prev.conditions[key],
          ...patch,
        },
      },
    }))
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const mergedProfile: StudentDapodikProfile = {
      ...eDapodikForm,
      namaLengkap: eNama.trim(),
      nisn: eNisn.trim(),
      jk: eGender,
      rombelSaatIni: getClassById(eClassId)?.name ?? eDapodikForm.rombelSaatIni,
    }
    updateStudent(editing.id, {
      name: eNama,
      nisn: eNisn,
      classId: eClassId,
      totalPoints: ePoin,
      password: ePass || 'siswa123',
      parentName: eParentName,
      parentPhone: eParentPhone,
      studentPhone: eStudentPhone,
      gender: eGender,
      dapodikProfile: mergedProfile,
      healthHistory: eHealthForm,
    })
    updateUser(editing.userId, { profilePhotoDataUrl: ePhotoDataUrl })
    await flushWorkspacePushNowAsync()
    const syncPw = await apiSetPassword(editing.userId, ePass || 'siswa123')
    if (!syncPw.ok) {
      showToast(syncPw.message ?? 'Data siswa diperbarui, tetapi sinkron kata sandi ke server gagal.', 'error')
    } else {
      showToast('Data siswa diperbarui.', 'success')
    }
    setEditing(null)
  }

  const handleImport = (dataUrl: string) => {
    const { rows: parsed, preview, error } = parseStudentSpreadsheetDataUrl(dataUrl)
    if (error) {
      showToast(error, 'error')
      return
    }
    if (!parsed.length) {
      showToast('Tidak ada baris data.', 'error')
      return
    }
    setPendingImportRows(parsed)
    setPreviewData(preview)
    setPreviewOpen(true)
  }

  const processImport = async () => {
    if (!pendingImportRows.length) return
    setIsImporting(true)
    try {
      const { created, errors, warnings, createdUserIds } = importStudentsFromRows(pendingImportRows)
      if (createdUserIds.length > 0) {
        await flushWorkspacePushNowAsync()
      }
      const syncResults = await Promise.all(
        createdUserIds.map((id) => apiSetPassword(id, 'siswa123')),
      )
      const syncFailed = syncResults.filter((r) => !r.ok).length
      if (created) {
        showToast(
          syncFailed
            ? `${created} siswa diimpor; ${syncFailed} gagal sinkron kata sandi ke server.`
            : `${created} siswa diimpor.`,
          syncFailed ? 'error' : 'success',
        )
      }
      if (warnings.length) {
        setImportWarningMessages(warnings)
        showToast(
          `${warnings.length} siswa masuk kelas "${getClassById(UNCLASSIFIED_CLASS_ID)?.name ?? 'Belum Terklasifikasi'}" karena rombel tidak cocok. Lihat daftar peringatan.`,
          'info',
        )
      } else {
        setImportWarningMessages([])
      }
      if (errors.length) {
        setImportErrorMessages(errors)
        setImportErrorModalOpen(true)
        showToast(`${errors.length} baris bermasalah. Lihat detail di modal error.`, 'error')
      }
    } catch (error) {
      console.error('Import siswa gagal:', error)
      showToast('Proses import gagal. Coba lagi.', 'error')
    } finally {
      setIsImporting(false)
      setPreviewOpen(false)
      setPendingImportRows([])
      setPreviewData({ headers: [], rows: [] })
    }
  }

  const importErrorSuggestions = useMemo(() => {
    const hasClassError = importErrorMessages.some((msg) =>
      msg.toLowerCase().includes('kelas'),
    )
    const hasDuplicateNisn = importErrorMessages.some((msg) =>
      msg.toLowerCase().includes('nisn') && msg.toLowerCase().includes('sudah ada'),
    )
    const hasRowError = importErrorMessages.some((msg) =>
      msg.toLowerCase().includes('baris'),
    )
    const suggestions: string[] = []
    if (hasClassError) {
      suggestions.push(
        'Pastikan nama kelas di file Dapodik sama persis dengan master kelas di sistem (termasuk spasi/tanda baca).',
      )
    }
    if (hasDuplicateNisn) {
      suggestions.push(
        'Periksa NISN duplikat. Gunakan NISN unik atau update data siswa yang sudah ada, bukan import ulang.',
      )
    }
    if (hasRowError) {
      suggestions.push(
        'Cek baris yang disebutkan pada daftar error, lalu perbaiki file dan ulangi import.',
      )
    }
    suggestions.push(
      'Jika jumlah error sangat banyak, uji import 5-10 baris terlebih dahulu untuk validasi format.',
    )
    return suggestions
  }, [importErrorMessages])

  const authUser = useAuthStore((s) => s.user)
  const currentUserId = authUser?.id
  const canBulkAssign =
    !!authUser &&
    (authUser.role === 'super_admin' ||
      authUser.role === 'kesiswaan' ||
      authUser.role === 'kurikulum')

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        selectedClassFilter === 'all' ? true : row.student.classId === selectedClassFilter,
      ),
    [rows, selectedClassFilter],
  )

  const unclassifiedRows = useMemo(
    () => rows.filter((r) => r.student.classId === UNCLASSIFIED_CLASS_ID),
    [rows],
  )

  const selectedBulkIds = useMemo(
    () => unclassifiedRows.filter((r) => bulkSelected[r.student.id]).map((r) => r.student.id),
    [unclassifiedRows, bulkSelected],
  )
  const detailUser = detailRow ? getUserById(detailRow.student.userId) : undefined
  const detailProfile = detailRow?.student.dapodikProfile

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">
          Data siswa
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          CRUD siswa dan impor Dapodik lengkap berbasis urutan indeks kolom.
        </p>
        <div className="mt-4">
          <ModuleTabBar tabs={ADMIN_SISWA_TABS} value={moduleTab} onChange={setModuleTab} />
        </div>
      </div>

      {moduleTab === 'impor' ? (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Upload className="h-4 w-4 text-brand-navy" />
          Impor massal
        </h2>
        <FileUploader
          className="mt-3"
          label="Berkas Dapodik (.xlsx / .xls / .csv)"
          accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          description="Sistem melewati 6 baris pertama dan mulai membaca data dari baris ke-7."
          maxSizeMb={8}
          onDataUrl={(url) => void handleImport(url)}
        />
      </div>
      ) : null}

      {moduleTab === 'kelola' ? (
        <>
      {canBulkAssign && unclassifiedRows.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-amber-950">Bulk-assign kelas</h2>
          <p className="mt-1 text-xs text-amber-900/85">
            {unclassifiedRows.length} siswa di status &quot;Belum Terklasifikasi&quot;. Pilih siswa lalu pindahkan ke
            kelas tujuan.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-amber-950/80">Kelas tujuan</label>
              <select
                value={bulkTargetClassId}
                onChange={(e) => setBulkTargetClassId(e.target.value)}
                className="mt-1 block min-w-[200px] rounded-lg border border-amber-300/80 bg-white px-3 py-2 text-sm"
              >
                <option value="">— Pilih kelas —</option>
                {classes
                  .filter((c) => c.id !== UNCLASSIFIED_CLASS_ID)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <button
              type="button"
              className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark"
              onClick={() => {
                if (!currentUserId || !bulkTargetClassId || selectedBulkIds.length === 0) {
                  showToast('Pilih minimal satu siswa dan kelas tujuan.', 'error')
                  return
                }
                const res = bulkAssignStudentsToClass({
                  actorId: currentUserId,
                  studentIds: selectedBulkIds,
                  classId: bulkTargetClassId,
                })
                if (!res.ok) {
                  showToast(res.message ?? 'Gagal memindahkan siswa.', 'error')
                  return
                }
                void flushWorkspacePushNowAsync()
                setBulkSelected({})
                setBulkTargetClassId('')
                showToast(`${res.moved ?? selectedBulkIds.length} siswa dipindahkan ke kelas baru.`, 'success')
              }}
            >
              Pindahkan terpilih
            </button>
          </div>
          <div className="mt-3 max-h-40 overflow-auto rounded-lg border border-amber-200/80 bg-white/90">
            <ul className="divide-y divide-amber-100 text-sm">
              {unclassifiedRows.map((r) => (
                <li key={r.student.id} className="flex items-center gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!bulkSelected[r.student.id]}
                    onChange={(e) =>
                      setBulkSelected((prev) => ({
                        ...prev,
                        [r.student.id]: e.target.checked,
                      }))
                    }
                    className="rounded border-amber-400"
                  />
                  <span className="font-medium text-slate-800">{r.name}</span>
                  <span className="text-xs text-slate-500">{r.nisn}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      <form
        onSubmit={handleAdd}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Plus className="h-4 w-4 text-brand-navy" />
          Tambah siswa
        </h2>
        <details open className="group rounded-xl border border-slate-200">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
            Data Utama
          </summary>
          <div className="grid gap-4 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Nama Lengkap</label>
              <input
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">NISN</label>
              <input
                required
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Kelas</label>
              <select
                required
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">— Pilih —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Jenis Kelamin</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Kata sandi awal</label>
              <input
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </details>

        <details className="group rounded-xl border border-slate-200">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
            Foto Siswa
          </summary>
          <div className="border-t border-slate-200 p-4">
            <FileUploader
              label="Unggah foto siswa"
              accept="image/png,image/jpeg,image/webp"
              description="Format gambar: JPG/PNG/WEBP (maks 2 MB)."
              maxSizeMb={2}
              onDataUrl={(url) => setStudentPhotoDataUrl(url)}
            />
            {studentPhotoDataUrl ? (
              <img
                src={studentPhotoDataUrl}
                alt="Preview foto siswa"
                className="mt-3 h-24 w-24 rounded-lg border border-slate-200 object-cover"
              />
            ) : null}
          </div>
        </details>

        <details className="group rounded-xl border border-slate-200">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
            Data Pribadi & Alamat
          </summary>
          <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><label className="text-xs font-medium text-slate-600">NIPD</label><input value={dapodikForm.nipd} onChange={(e) => setDapodikField('nipd', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Tempat Lahir</label><input value={dapodikForm.tempatLahir} onChange={(e) => setDapodikField('tempatLahir', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Tanggal Lahir</label><input value={dapodikForm.tanggalLahir} onChange={(e) => setDapodikField('tanggalLahir', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">NIK</label><input value={dapodikForm.nik} onChange={(e) => setDapodikField('nik', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Agama</label><input value={dapodikForm.agama} onChange={(e) => setDapodikField('agama', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-600">Alamat</label><input value={dapodikForm.alamat} onChange={(e) => setDapodikField('alamat', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">RT</label><input value={dapodikForm.rt} onChange={(e) => setDapodikField('rt', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">RW</label><input value={dapodikForm.rw} onChange={(e) => setDapodikField('rw', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Dusun</label><input value={dapodikForm.dusun} onChange={(e) => setDapodikField('dusun', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Kelurahan</label><input value={dapodikForm.kelurahan} onChange={(e) => setDapodikField('kelurahan', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Kecamatan</label><input value={dapodikForm.kecamatan} onChange={(e) => setDapodikField('kecamatan', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Kode Pos</label><input value={dapodikForm.kodePos} onChange={(e) => setDapodikField('kodePos', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
          </div>
        </details>

        <details className="group rounded-xl border border-slate-200">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
            Kontak, Dokumen, Bantuan & Perbankan
          </summary>
          <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><label className="text-xs font-medium text-slate-600">No. WA/Telp Orang Tua</label><input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">No. HP Siswa</label><input value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Telepon</label><input value={dapodikForm.telepon} onChange={(e) => setDapodikField('telepon', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">HP</label><input value={dapodikForm.hp} onChange={(e) => setDapodikField('hp', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">E-Mail</label><input value={dapodikForm.email} onChange={(e) => setDapodikField('email', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Jenis Tinggal</label><input value={dapodikForm.jenisTinggal} onChange={(e) => setDapodikField('jenisTinggal', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Alat Transportasi</label><input value={dapodikForm.alatTransportasi} onChange={(e) => setDapodikField('alatTransportasi', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">SKHUN</label><input value={dapodikForm.skhun} onChange={(e) => setDapodikField('skhun', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Penerima KPS</label><input value={dapodikForm.penerimaKps} onChange={(e) => setDapodikField('penerimaKps', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Nomor KPS</label><input value={dapodikForm.nomorKps} onChange={(e) => setDapodikField('nomorKps', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Penerima KIP</label><input value={dapodikForm.penerimaKip} onChange={(e) => setDapodikField('penerimaKip', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Nomor KIP</label><input value={dapodikForm.nomorKip} onChange={(e) => setDapodikField('nomorKip', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Nama di KIP</label><input value={dapodikForm.namaDiKip} onChange={(e) => setDapodikField('namaDiKip', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Nomor KKS</label><input value={dapodikForm.nomorKks} onChange={(e) => setDapodikField('nomorKks', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Layak PIP</label><input value={dapodikForm.layakPip} onChange={(e) => setDapodikField('layakPip', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-600">Alasan Layak PIP</label><input value={dapodikForm.alasanLayakPip} onChange={(e) => setDapodikField('alasanLayakPip', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Bank</label><input value={dapodikForm.bank} onChange={(e) => setDapodikField('bank', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Nomor Rekening</label><input value={dapodikForm.nomorRekeningBank} onChange={(e) => setDapodikField('nomorRekeningBank', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Rekening Atas Nama</label><input value={dapodikForm.rekeningAtasNama} onChange={(e) => setDapodikField('rekeningAtasNama', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
          </div>
        </details>

        <details className="group rounded-xl border border-slate-200">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
            Data Keluarga (Ayah, Ibu, Wali)
          </summary>
          <div className="border-t border-slate-200 p-4">
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-600">Nama Orang Tua</label>
              <input
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:w-80"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Data Ayah</p>
                <div className="mt-2 space-y-2">
                  <input placeholder="Nama Ayah" value={dapodikForm.dataAyah.nama} onChange={(e) => setParentGroupField('dataAyah', 'nama', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="Tahun Lahir Ayah" value={dapodikForm.dataAyah.tahunLahir} onChange={(e) => setParentGroupField('dataAyah', 'tahunLahir', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="Pendidikan Ayah" value={dapodikForm.dataAyah.pendidikan} onChange={(e) => setParentGroupField('dataAyah', 'pendidikan', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="Pekerjaan Ayah" value={dapodikForm.dataAyah.pekerjaan} onChange={(e) => setParentGroupField('dataAyah', 'pekerjaan', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="Penghasilan Ayah" value={dapodikForm.dataAyah.penghasilan} onChange={(e) => setParentGroupField('dataAyah', 'penghasilan', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="NIK Ayah" value={dapodikForm.dataAyah.nik} onChange={(e) => setParentGroupField('dataAyah', 'nik', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Data Ibu</p>
                <div className="mt-2 space-y-2">
                  <input placeholder="Nama Ibu" value={dapodikForm.dataIbu.nama} onChange={(e) => setParentGroupField('dataIbu', 'nama', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="Tahun Lahir Ibu" value={dapodikForm.dataIbu.tahunLahir} onChange={(e) => setParentGroupField('dataIbu', 'tahunLahir', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="Pendidikan Ibu" value={dapodikForm.dataIbu.pendidikan} onChange={(e) => setParentGroupField('dataIbu', 'pendidikan', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="Pekerjaan Ibu" value={dapodikForm.dataIbu.pekerjaan} onChange={(e) => setParentGroupField('dataIbu', 'pekerjaan', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="Penghasilan Ibu" value={dapodikForm.dataIbu.penghasilan} onChange={(e) => setParentGroupField('dataIbu', 'penghasilan', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="NIK Ibu" value={dapodikForm.dataIbu.nik} onChange={(e) => setParentGroupField('dataIbu', 'nik', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Data Wali</p>
                <div className="mt-2 space-y-2">
                  <input placeholder="Nama Wali" value={dapodikForm.dataWali.nama} onChange={(e) => setParentGroupField('dataWali', 'nama', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="Tahun Lahir Wali" value={dapodikForm.dataWali.tahunLahir} onChange={(e) => setParentGroupField('dataWali', 'tahunLahir', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="Pendidikan Wali" value={dapodikForm.dataWali.pendidikan} onChange={(e) => setParentGroupField('dataWali', 'pendidikan', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="Pekerjaan Wali" value={dapodikForm.dataWali.pekerjaan} onChange={(e) => setParentGroupField('dataWali', 'pekerjaan', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="Penghasilan Wali" value={dapodikForm.dataWali.penghasilan} onChange={(e) => setParentGroupField('dataWali', 'penghasilan', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="NIK Wali" value={dapodikForm.dataWali.nik} onChange={(e) => setParentGroupField('dataWali', 'nik', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          </div>
        </details>

        <details className="group rounded-xl border border-slate-200">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
            Data Akademik & Fisik
          </summary>
          <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><label className="text-xs font-medium text-slate-600">No Peserta UN</label><input value={dapodikForm.nomorPesertaUjianNasional} onChange={(e) => setDapodikField('nomorPesertaUjianNasional', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">No Seri Ijazah</label><input value={dapodikForm.nomorSeriIjazah} onChange={(e) => setDapodikField('nomorSeriIjazah', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">No Registrasi Akta Lahir</label><input value={dapodikForm.nomorRegistrasiAktaLahir} onChange={(e) => setDapodikField('nomorRegistrasiAktaLahir', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Sekolah Asal</label><input value={dapodikForm.sekolahAsal} onChange={(e) => setDapodikField('sekolahAsal', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Kebutuhan Khusus</label><input value={dapodikForm.kebutuhanKhusus} onChange={(e) => setDapodikField('kebutuhanKhusus', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Anak ke-</label><input value={dapodikForm.anakKeBerapa} onChange={(e) => setDapodikField('anakKeBerapa', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">No KK</label><input value={dapodikForm.noKk} onChange={(e) => setDapodikField('noKk', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Jml Saudara Kandung</label><input value={dapodikForm.jumlahSaudaraKandung} onChange={(e) => setDapodikField('jumlahSaudaraKandung', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Berat Badan</label><input value={dapodikForm.beratBadan} onChange={(e) => setDapodikField('beratBadan', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Tinggi Badan</label><input value={dapodikForm.tinggiBadan} onChange={(e) => setDapodikField('tinggiBadan', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Lingkar Kepala</label><input value={dapodikForm.lingkarKepala} onChange={(e) => setDapodikField('lingkarKepala', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Jarak Rumah ke Sekolah (KM)</label><input value={dapodikForm.jarakRumahKeSekolahKm} onChange={(e) => setDapodikField('jarakRumahKeSekolahKm', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Lintang</label><input value={dapodikForm.lintang} onChange={(e) => setDapodikField('lintang', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-600">Bujur</label><input value={dapodikForm.bujur} onChange={(e) => setDapodikField('bujur', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
          </div>
        </details>

        <details className="group rounded-xl border border-slate-200">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
            Riwayat Kesehatan
          </summary>
          <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {HEALTH_CONDITION_LABELS.map((item) => (
              <div key={item.key} className="rounded-lg border border-slate-200 p-3">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={healthForm.conditions[item.key].checked}
                    onChange={(e) =>
                      setHealthCondition(item.key, {
                        checked: e.target.checked,
                        year: e.target.checked ? healthForm.conditions[item.key].year : '',
                      })
                    }
                  />
                  {item.label}
                </label>
                <input
                  value={healthForm.conditions[item.key].year}
                  onChange={(e) => setHealthCondition(item.key, { year: e.target.value })}
                  placeholder="Tahun sakit (contoh: 2022)"
                  disabled={!healthForm.conditions[item.key].checked}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100"
                />
              </div>
            ))}
            <div className="rounded-lg border border-slate-200 p-3 sm:col-span-2 lg:col-span-3">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={healthForm.otherConditionChecked}
                  onChange={(e) =>
                    setHealthForm((prev) => ({
                      ...prev,
                      otherConditionChecked: e.target.checked,
                      ...(e.target.checked ? {} : { otherConditionName: '', otherConditionYear: '' }),
                    }))
                  }
                />
                Lain-lain
              </label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input
                  value={healthForm.otherConditionName}
                  onChange={(e) =>
                    setHealthForm((prev) => ({ ...prev, otherConditionName: e.target.value }))
                  }
                  placeholder="Nama penyakit/kondisi lain"
                  disabled={!healthForm.otherConditionChecked}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100"
                />
                <input
                  value={healthForm.otherConditionYear}
                  onChange={(e) =>
                    setHealthForm((prev) => ({ ...prev, otherConditionYear: e.target.value }))
                  }
                  placeholder="Tahun sakit"
                  disabled={!healthForm.otherConditionChecked}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>
        </details>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-dark"
          >
            Simpan
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-slate-600">Filter kelas</label>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">Semua kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <PaginatedTable
          rows={filteredRows}
          pageSize={10}
          searchPlaceholder="Cari nama, NISN, atau kelas…"
          searchFilter={(row, q) => {
            const r = row as Row
            const kelas = getClassById(r.student.classId)?.name ?? ''
            const hay = `${r.name} ${r.nisn} ${kelas}`.toLowerCase()
            return hay.includes(q)
          }}
        >
          {({ pageRows }) => (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Foto</th>
                    <th className="px-3 py-2">Nama</th>
                    <th className="px-3 py-2">NISN</th>
                    <th className="px-3 py-2">Kelas</th>
                    <th className="px-3 py-2">Gender</th>
                    <th className="px-3 py-2">Orang Tua</th>
                    <th className="px-3 py-2">Poin</th>
                    <th className="px-3 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {(pageRows as Row[]).map((r) => (
                    <tr
                      key={r.student.id}
                      className="border-t border-slate-100 hover:bg-slate-50/80"
                    >
                      <td className="px-3 py-2">
                        {getUserById(r.student.userId)?.profilePhotoDataUrl ? (
                          <img
                            src={getUserById(r.student.userId)?.profilePhotoDataUrl ?? ''}
                            alt={`Foto ${r.name}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-slate-100" />
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium">{r.name}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.nisn}</td>
                      <td className="px-3 py-2">
                        {getClassById(r.student.classId)?.name ?? '—'}
                      </td>
                      <td className="px-3 py-2">{r.student.gender}</td>
                      <td className="px-3 py-2 text-xs">
                        <div>{r.student.parentName || '—'}</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {r.student.parentPhone || '—'}
                        </div>
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {r.student.totalPoints}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setModuleTab('kelola')
                            setDetailRow(r)
                          }}
                          className="inline-flex rounded p-1.5 text-slate-600 hover:bg-slate-100"
                          aria-label="Lihat detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="inline-flex rounded p-1.5 text-brand-navy hover:bg-brand-navy/10"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={r.student.userId === currentUserId}
                          onClick={() => {
                            if (
                              confirm(
                                `Hapus siswa ${r.name}? Akun login ikut terhapus.`,
                              )
                            ) {
                              deleteStudent(r.student.id)
                              showToast('Siswa dihapus.', 'info')
                            }
                          }}
                          className="inline-flex rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30"
                          aria-label="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PaginatedTable>
      </div>
        </>
      ) : null}

      {previewOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-3 py-6">
          <div className="max-h-[92vh] w-full max-w-[96vw] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Preview import Dapodik</h3>
                <p className="text-xs text-slate-500">{pendingImportRows.length} baris valid siap diproses.</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                onClick={() => {
                  if (isImporting) return
                  setPreviewOpen(false)
                  setPendingImportRows([])
                  setPreviewData({ headers: [], rows: [] })
                }}
              >
                Tutup
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-[2400px] text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-slate-600">
                    <tr>
                      {previewData.headers.map((header, idx) => (
                        <th
                          key={`${header}-${idx}`}
                          className="whitespace-nowrap border-b border-r border-slate-200 px-2 py-2"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.map((row, rowIdx) => (
                      <tr key={`row-${rowIdx}`} className="odd:bg-white even:bg-slate-50/40">
                        {row.map((cell, colIdx) => (
                          <td
                            key={`cell-${rowIdx}-${colIdx}`}
                            className="whitespace-nowrap border-r border-slate-100 px-2 py-1.5 text-slate-700"
                          >
                            {cell || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm"
                onClick={() => {
                  if (isImporting) return
                  setPreviewOpen(false)
                  setPendingImportRows([])
                  setPreviewData({ headers: [], rows: [] })
                }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isImporting}
                className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => void processImport()}
              >
                {isImporting ? 'Memproses…' : 'Proses Import'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {importErrorModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-3 py-6">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div>
                <h3 className="text-sm font-semibold text-red-700">Error Import Siswa</h3>
                <p className="text-xs text-slate-500">
                  Ditemukan {importErrorMessages.length} baris bermasalah saat import.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                onClick={() => setImportErrorModalOpen(false)}
              >
                Tutup
              </button>
            </div>
            <div className="max-h-[70vh] space-y-4 overflow-auto p-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Daftar Error
                </p>
                <div className="max-h-64 overflow-auto rounded-lg border border-red-100 bg-red-50/40 p-3">
                  <ul className="space-y-1 text-sm text-slate-700">
                    {importErrorMessages.map((msg, idx) => (
                      <li key={`${msg}-${idx}`}>• {msg}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {importWarningMessages.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
                    Peringatan rombel (siswa tetap diimpor)
                  </p>
                  <div className="max-h-48 overflow-auto rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                    <ul className="space-y-1 text-sm text-slate-700">
                      {importWarningMessages.map((msg, idx) => (
                        <li key={`w-${msg}-${idx}`}>• {msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Saran Perbaikan
                </p>
                <ul className="space-y-1 text-sm text-slate-700">
                  {importErrorSuggestions.map((tip, idx) => (
                    <li key={`${tip}-${idx}`}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-3 py-6">
          <div className="max-h-[92vh] w-full max-w-[96vw] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Edit siswa (lengkap)</h3>
                <p className="text-xs text-slate-500">
                  Login siswa menggunakan NISN. Password default: <span className="font-mono">siswa123</span>
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                onClick={() => setEditing(null)}
              >
                Tutup
              </button>
            </div>
            <form onSubmit={saveEdit} className="max-h-[78vh] space-y-4 overflow-auto p-4">
              <details open className="group rounded-xl border border-slate-200">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">Data Utama</summary>
                <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div><label className="text-xs font-medium text-slate-600">Nama Lengkap</label><input required value={eNama} onChange={(e)=>setENama(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">NISN</label><input required value={eNisn} onChange={(e)=>setENisn(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Kelas</label><select value={eClassId} onChange={(e)=>setEClassId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">{classes.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label className="text-xs font-medium text-slate-600">Jenis Kelamin</label><select value={eGender} onChange={(e)=>setEGender(e.target.value as 'L'|'P')} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
                  <div><label className="text-xs font-medium text-slate-600">Password</label><input value={ePass} onChange={(e)=>setEPass(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div className="flex items-end"><button type="button" onClick={()=>setEPass('siswa123')} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">Reset ke siswa123</button></div>
                  <div><label className="text-xs font-medium text-slate-600">Total poin</label><input type="number" value={ePoin} onChange={(e)=>setEPoin(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                </div>
              </details>

              <details className="group rounded-xl border border-slate-200">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">Foto Siswa</summary>
                <div className="border-t border-slate-200 p-4">
                  <FileUploader
                    label="Unggah foto siswa"
                    accept="image/png,image/jpeg,image/webp"
                    description="Format gambar: JPG/PNG/WEBP (maks 2 MB)."
                    maxSizeMb={2}
                    onDataUrl={(url) => setEPhotoDataUrl(url)}
                  />
                  {ePhotoDataUrl ? <img src={ePhotoDataUrl} alt="Preview foto siswa" className="mt-3 h-24 w-24 rounded-lg border border-slate-200 object-cover" /> : null}
                </div>
              </details>

              <details className="group rounded-xl border border-slate-200">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">Data Pribadi & Alamat</summary>
                <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div><label className="text-xs font-medium text-slate-600">NIPD</label><input value={eDapodikForm.nipd} onChange={(e)=>setEditDapodikField('nipd', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Tempat Lahir</label><input value={eDapodikForm.tempatLahir} onChange={(e)=>setEditDapodikField('tempatLahir', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Tanggal Lahir</label><input value={eDapodikForm.tanggalLahir} onChange={(e)=>setEditDapodikField('tanggalLahir', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">NIK</label><input value={eDapodikForm.nik} onChange={(e)=>setEditDapodikField('nik', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Agama</label><input value={eDapodikForm.agama} onChange={(e)=>setEditDapodikField('agama', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-600">Alamat</label><input value={eDapodikForm.alamat} onChange={(e)=>setEditDapodikField('alamat', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">RT</label><input value={eDapodikForm.rt} onChange={(e)=>setEditDapodikField('rt', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">RW</label><input value={eDapodikForm.rw} onChange={(e)=>setEditDapodikField('rw', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Dusun</label><input value={eDapodikForm.dusun} onChange={(e)=>setEditDapodikField('dusun', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Kelurahan</label><input value={eDapodikForm.kelurahan} onChange={(e)=>setEditDapodikField('kelurahan', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Kecamatan</label><input value={eDapodikForm.kecamatan} onChange={(e)=>setEditDapodikField('kecamatan', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Kode Pos</label><input value={eDapodikForm.kodePos} onChange={(e)=>setEditDapodikField('kodePos', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                </div>
              </details>

              <details className="group rounded-xl border border-slate-200">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">Kontak, Dokumen, Bantuan & Perbankan</summary>
                <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div><label className="text-xs font-medium text-slate-600">No. WA/Telp Orang Tua</label><input value={eParentPhone} onChange={(e)=>setEParentPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">No. HP Siswa</label><input value={eStudentPhone} onChange={(e)=>setEStudentPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Telepon</label><input value={eDapodikForm.telepon} onChange={(e)=>setEditDapodikField('telepon', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">HP</label><input value={eDapodikForm.hp} onChange={(e)=>setEditDapodikField('hp', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">E-Mail</label><input value={eDapodikForm.email} onChange={(e)=>setEditDapodikField('email', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Jenis Tinggal</label><input value={eDapodikForm.jenisTinggal} onChange={(e)=>setEditDapodikField('jenisTinggal', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Alat Transportasi</label><input value={eDapodikForm.alatTransportasi} onChange={(e)=>setEditDapodikField('alatTransportasi', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">SKHUN</label><input value={eDapodikForm.skhun} onChange={(e)=>setEditDapodikField('skhun', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Penerima KPS</label><input value={eDapodikForm.penerimaKps} onChange={(e)=>setEditDapodikField('penerimaKps', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Nomor KPS</label><input value={eDapodikForm.nomorKps} onChange={(e)=>setEditDapodikField('nomorKps', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Penerima KIP</label><input value={eDapodikForm.penerimaKip} onChange={(e)=>setEditDapodikField('penerimaKip', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Nomor KIP</label><input value={eDapodikForm.nomorKip} onChange={(e)=>setEditDapodikField('nomorKip', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Nama di KIP</label><input value={eDapodikForm.namaDiKip} onChange={(e)=>setEditDapodikField('namaDiKip', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Nomor KKS</label><input value={eDapodikForm.nomorKks} onChange={(e)=>setEditDapodikField('nomorKks', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Layak PIP</label><input value={eDapodikForm.layakPip} onChange={(e)=>setEditDapodikField('layakPip', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-600">Alasan Layak PIP</label><input value={eDapodikForm.alasanLayakPip} onChange={(e)=>setEditDapodikField('alasanLayakPip', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Bank</label><input value={eDapodikForm.bank} onChange={(e)=>setEditDapodikField('bank', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Nomor Rekening</label><input value={eDapodikForm.nomorRekeningBank} onChange={(e)=>setEditDapodikField('nomorRekeningBank', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Rekening Atas Nama</label><input value={eDapodikForm.rekeningAtasNama} onChange={(e)=>setEditDapodikField('rekeningAtasNama', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                </div>
              </details>

              <details className="group rounded-xl border border-slate-200">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">Data Keluarga (Ayah, Ibu, Wali)</summary>
                <div className="border-t border-slate-200 p-4">
                  <div className="mb-3">
                    <label className="text-xs font-medium text-slate-600">Nama Orang Tua</label>
                    <input value={eParentName} onChange={(e)=>setEParentName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:w-80" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Data Ayah</p><div className="mt-2 space-y-2"><input placeholder="Nama Ayah" value={eDapodikForm.dataAyah.nama} onChange={(e)=>setEditParentGroupField('dataAyah','nama',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Tahun Lahir Ayah" value={eDapodikForm.dataAyah.tahunLahir} onChange={(e)=>setEditParentGroupField('dataAyah','tahunLahir',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Pendidikan Ayah" value={eDapodikForm.dataAyah.pendidikan} onChange={(e)=>setEditParentGroupField('dataAyah','pendidikan',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Pekerjaan Ayah" value={eDapodikForm.dataAyah.pekerjaan} onChange={(e)=>setEditParentGroupField('dataAyah','pekerjaan',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Penghasilan Ayah" value={eDapodikForm.dataAyah.penghasilan} onChange={(e)=>setEditParentGroupField('dataAyah','penghasilan',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input placeholder="NIK Ayah" value={eDapodikForm.dataAyah.nik} onChange={(e)=>setEditParentGroupField('dataAyah','nik',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div></div>
                    <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Data Ibu</p><div className="mt-2 space-y-2"><input placeholder="Nama Ibu" value={eDapodikForm.dataIbu.nama} onChange={(e)=>setEditParentGroupField('dataIbu','nama',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Tahun Lahir Ibu" value={eDapodikForm.dataIbu.tahunLahir} onChange={(e)=>setEditParentGroupField('dataIbu','tahunLahir',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Pendidikan Ibu" value={eDapodikForm.dataIbu.pendidikan} onChange={(e)=>setEditParentGroupField('dataIbu','pendidikan',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Pekerjaan Ibu" value={eDapodikForm.dataIbu.pekerjaan} onChange={(e)=>setEditParentGroupField('dataIbu','pekerjaan',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Penghasilan Ibu" value={eDapodikForm.dataIbu.penghasilan} onChange={(e)=>setEditParentGroupField('dataIbu','penghasilan',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input placeholder="NIK Ibu" value={eDapodikForm.dataIbu.nik} onChange={(e)=>setEditParentGroupField('dataIbu','nik',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div></div>
                    <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Data Wali</p><div className="mt-2 space-y-2"><input placeholder="Nama Wali" value={eDapodikForm.dataWali.nama} onChange={(e)=>setEditParentGroupField('dataWali','nama',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Tahun Lahir Wali" value={eDapodikForm.dataWali.tahunLahir} onChange={(e)=>setEditParentGroupField('dataWali','tahunLahir',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Pendidikan Wali" value={eDapodikForm.dataWali.pendidikan} onChange={(e)=>setEditParentGroupField('dataWali','pendidikan',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Pekerjaan Wali" value={eDapodikForm.dataWali.pekerjaan} onChange={(e)=>setEditParentGroupField('dataWali','pekerjaan',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Penghasilan Wali" value={eDapodikForm.dataWali.penghasilan} onChange={(e)=>setEditParentGroupField('dataWali','penghasilan',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input placeholder="NIK Wali" value={eDapodikForm.dataWali.nik} onChange={(e)=>setEditParentGroupField('dataWali','nik',e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div></div>
                  </div>
                </div>
              </details>

              <details className="group rounded-xl border border-slate-200">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">Data Akademik & Fisik</summary>
                <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div><label className="text-xs font-medium text-slate-600">No Peserta UN</label><input value={eDapodikForm.nomorPesertaUjianNasional} onChange={(e)=>setEditDapodikField('nomorPesertaUjianNasional', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">No Seri Ijazah</label><input value={eDapodikForm.nomorSeriIjazah} onChange={(e)=>setEditDapodikField('nomorSeriIjazah', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">No Registrasi Akta Lahir</label><input value={eDapodikForm.nomorRegistrasiAktaLahir} onChange={(e)=>setEditDapodikField('nomorRegistrasiAktaLahir', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Sekolah Asal</label><input value={eDapodikForm.sekolahAsal} onChange={(e)=>setEditDapodikField('sekolahAsal', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Kebutuhan Khusus</label><input value={eDapodikForm.kebutuhanKhusus} onChange={(e)=>setEditDapodikField('kebutuhanKhusus', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Anak ke-</label><input value={eDapodikForm.anakKeBerapa} onChange={(e)=>setEditDapodikField('anakKeBerapa', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">No KK</label><input value={eDapodikForm.noKk} onChange={(e)=>setEditDapodikField('noKk', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Jml Saudara Kandung</label><input value={eDapodikForm.jumlahSaudaraKandung} onChange={(e)=>setEditDapodikField('jumlahSaudaraKandung', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Berat Badan</label><input value={eDapodikForm.beratBadan} onChange={(e)=>setEditDapodikField('beratBadan', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Tinggi Badan</label><input value={eDapodikForm.tinggiBadan} onChange={(e)=>setEditDapodikField('tinggiBadan', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Lingkar Kepala</label><input value={eDapodikForm.lingkarKepala} onChange={(e)=>setEditDapodikField('lingkarKepala', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Jarak Rumah ke Sekolah (KM)</label><input value={eDapodikForm.jarakRumahKeSekolahKm} onChange={(e)=>setEditDapodikField('jarakRumahKeSekolahKm', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Lintang</label><input value={eDapodikForm.lintang} onChange={(e)=>setEditDapodikField('lintang', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-600">Bujur</label><input value={eDapodikForm.bujur} onChange={(e)=>setEditDapodikField('bujur', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                </div>
              </details>

              <details className="group rounded-xl border border-slate-200">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">Riwayat Kesehatan</summary>
                <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {HEALTH_CONDITION_LABELS.map((item) => (
                    <div key={item.key} className="rounded-lg border border-slate-200 p-3">
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={eHealthForm.conditions[item.key].checked}
                          onChange={(e) =>
                            setEditHealthCondition(item.key, {
                              checked: e.target.checked,
                              year: e.target.checked ? eHealthForm.conditions[item.key].year : '',
                            })
                          }
                        />
                        {item.label}
                      </label>
                      <input
                        value={eHealthForm.conditions[item.key].year}
                        onChange={(e) => setEditHealthCondition(item.key, { year: e.target.value })}
                        placeholder="Tahun sakit"
                        disabled={!eHealthForm.conditions[item.key].checked}
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100"
                      />
                    </div>
                  ))}
                  <div className="rounded-lg border border-slate-200 p-3 sm:col-span-2 lg:col-span-3">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={eHealthForm.otherConditionChecked}
                        onChange={(e) =>
                          setEHealthForm((prev) => ({
                            ...prev,
                            otherConditionChecked: e.target.checked,
                            ...(e.target.checked ? {} : { otherConditionName: '', otherConditionYear: '' }),
                          }))
                        }
                      />
                      Lain-lain
                    </label>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <input
                        value={eHealthForm.otherConditionName}
                        onChange={(e) =>
                          setEHealthForm((prev) => ({ ...prev, otherConditionName: e.target.value }))
                        }
                        placeholder="Nama penyakit/kondisi lain"
                        disabled={!eHealthForm.otherConditionChecked}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100"
                      />
                      <input
                        value={eHealthForm.otherConditionYear}
                        onChange={(e) =>
                          setEHealthForm((prev) => ({ ...prev, otherConditionYear: e.target.value }))
                        }
                        placeholder="Tahun sakit"
                        disabled={!eHealthForm.otherConditionChecked}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </details>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm">
                  Batal
                </button>
                <button type="submit" className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white">
                  Simpan perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}



      {detailRow ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-3 py-6">
          <div className="max-h-[92vh] w-full max-w-[96vw] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Detail siswa</h3>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                onClick={() => setDetailRow(null)}
              >
                Tutup
              </button>
            </div>
            <div className="max-h-[78vh] overflow-auto p-4">
              <div className="mb-4 flex items-center gap-3">
                {detailUser?.profilePhotoDataUrl ? (
                  <img
                    src={detailUser.profilePhotoDataUrl}
                    alt={`Foto ${detailRow.name}`}
                    className="h-20 w-20 rounded-xl border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-xl border border-slate-200 bg-slate-100" />
                )}
                <div>
                  <div className="text-base font-semibold text-slate-800">{detailRow.name}</div>
                  <div className="text-sm text-slate-600">
                    NISN {detailRow.nisn} · {getClassById(detailRow.student.classId)?.name ?? '—'}
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem label="Nama Lengkap" value={detailProfile?.namaLengkap ?? detailRow.name} />
                <InfoItem label="NIPD" value={detailProfile?.nipd} />
                <InfoItem label="JK" value={detailProfile?.jk ?? detailRow.student.gender} />
                <InfoItem label="NISN" value={detailProfile?.nisn ?? detailRow.nisn} />
                <InfoItem label="Tempat Lahir" value={detailProfile?.tempatLahir} />
                <InfoItem label="Tanggal Lahir" value={detailProfile?.tanggalLahir} />
                <InfoItem label="NIK" value={detailProfile?.nik} />
                <InfoItem label="Agama" value={detailProfile?.agama} />
                <InfoItem label="Alamat" value={detailProfile?.alamat} />
                <InfoItem label="RT/RW" value={`${detailProfile?.rt ?? ''}/${detailProfile?.rw ?? ''}`} />
                <InfoItem label="Dusun" value={detailProfile?.dusun} />
                <InfoItem label="Kelurahan" value={detailProfile?.kelurahan} />
                <InfoItem label="Kecamatan" value={detailProfile?.kecamatan} />
                <InfoItem label="Kode Pos" value={detailProfile?.kodePos} />
                <InfoItem label="Jenis Tinggal" value={detailProfile?.jenisTinggal} />
                <InfoItem label="Alat Transportasi" value={detailProfile?.alatTransportasi} />
                <InfoItem label="Telepon" value={detailProfile?.telepon} />
                <InfoItem label="HP" value={detailProfile?.hp ?? detailRow.student.studentPhone} />
                <InfoItem label="E-Mail" value={detailProfile?.email} />
                <InfoItem label="SKHUN" value={detailProfile?.skhun} />
                <InfoItem label="Penerima KPS" value={detailProfile?.penerimaKps} />
                <InfoItem label="No KPS" value={detailProfile?.nomorKps} />
                <InfoItem label="Rombel Saat Ini" value={detailProfile?.rombelSaatIni ?? getClassById(detailRow.student.classId)?.name} />
                <InfoItem label="No Peserta UN" value={detailProfile?.nomorPesertaUjianNasional} />
                <InfoItem label="No Seri Ijazah" value={detailProfile?.nomorSeriIjazah} />
                <InfoItem label="Penerima KIP" value={detailProfile?.penerimaKip} />
                <InfoItem label="Nomor KIP" value={detailProfile?.nomorKip} />
                <InfoItem label="Nama di KIP" value={detailProfile?.namaDiKip} />
                <InfoItem label="Nomor KKS" value={detailProfile?.nomorKks} />
                <InfoItem label="No Registrasi Akta Lahir" value={detailProfile?.nomorRegistrasiAktaLahir} />
                <InfoItem label="Bank" value={detailProfile?.bank} />
                <InfoItem label="No Rekening" value={detailProfile?.nomorRekeningBank} />
                <InfoItem label="Rekening Atas Nama" value={detailProfile?.rekeningAtasNama} />
                <InfoItem label="Layak PIP" value={detailProfile?.layakPip} />
                <InfoItem label="Alasan Layak PIP" value={detailProfile?.alasanLayakPip} />
                <InfoItem label="Kebutuhan Khusus" value={detailProfile?.kebutuhanKhusus} />
                <InfoItem label="Sekolah Asal" value={detailProfile?.sekolahAsal} />
                <InfoItem label="Anak Ke-" value={detailProfile?.anakKeBerapa} />
                <InfoItem label="Lintang" value={detailProfile?.lintang} />
                <InfoItem label="Bujur" value={detailProfile?.bujur} />
                <InfoItem label="No KK" value={detailProfile?.noKk} />
                <InfoItem label="Berat Badan" value={detailProfile?.beratBadan} />
                <InfoItem label="Tinggi Badan" value={detailProfile?.tinggiBadan} />
                <InfoItem label="Lingkar Kepala" value={detailProfile?.lingkarKepala} />
                <InfoItem label="Jml Saudara Kandung" value={detailProfile?.jumlahSaudaraKandung} />
                <InfoItem label="Jarak Rumah ke Sekolah (KM)" value={detailProfile?.jarakRumahKeSekolahKm} />
                <InfoItem label="Nama Ayah" value={detailProfile?.dataAyah?.nama ?? detailRow.student.parentName} />
                <InfoItem label="Th Lahir Ayah" value={detailProfile?.dataAyah?.tahunLahir} />
                <InfoItem label="Pendidikan Ayah" value={detailProfile?.dataAyah?.pendidikan} />
                <InfoItem label="Pekerjaan Ayah" value={detailProfile?.dataAyah?.pekerjaan} />
                <InfoItem label="Penghasilan Ayah" value={detailProfile?.dataAyah?.penghasilan} />
                <InfoItem label="NIK Ayah" value={detailProfile?.dataAyah?.nik} />
                <InfoItem label="Nama Ibu" value={detailProfile?.dataIbu?.nama} />
                <InfoItem label="Th Lahir Ibu" value={detailProfile?.dataIbu?.tahunLahir} />
                <InfoItem label="Pendidikan Ibu" value={detailProfile?.dataIbu?.pendidikan} />
                <InfoItem label="Pekerjaan Ibu" value={detailProfile?.dataIbu?.pekerjaan} />
                <InfoItem label="Penghasilan Ibu" value={detailProfile?.dataIbu?.penghasilan} />
                <InfoItem label="NIK Ibu" value={detailProfile?.dataIbu?.nik} />
                <InfoItem label="Nama Wali" value={detailProfile?.dataWali?.nama} />
                <InfoItem label="Th Lahir Wali" value={detailProfile?.dataWali?.tahunLahir} />
                <InfoItem label="Pendidikan Wali" value={detailProfile?.dataWali?.pendidikan} />
                <InfoItem label="Pekerjaan Wali" value={detailProfile?.dataWali?.pekerjaan} />
                <InfoItem label="Penghasilan Wali" value={detailProfile?.dataWali?.penghasilan} />
                <InfoItem label="NIK Wali" value={detailProfile?.dataWali?.nik} />
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Riwayat Kesehatan</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {HEALTH_CONDITION_LABELS.map((item) => {
                    const h = detailRow.student.healthHistory?.conditions[item.key]
                    const value = h?.checked ? `Ya${h.year ? ` (${h.year})` : ''}` : 'Tidak'
                    return <InfoItem key={item.key} label={item.label} value={value} />
                  })}
                  <InfoItem
                    label="Lain-lain"
                    value={
                      detailRow.student.healthHistory?.otherConditionChecked
                        ? `${detailRow.student.healthHistory.otherConditionName || 'Ya'}${detailRow.student.healthHistory.otherConditionYear ? ` (${detailRow.student.healthHistory.otherConditionYear})` : ''}`
                        : 'Tidak'
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
