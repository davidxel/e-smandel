import { useState } from 'react'
import { Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { FileUploader } from '../../components/ui/FileUploader'
import { PaginatedTable } from '../../components/ui/PaginatedTable'
import { parseStudentSpreadsheetDataUrl } from '../../lib/excelStudents'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import type { Student } from '../../types/schema'

type Row = { student: Student; name: string; nisn: string }

export function AdminSiswaPage() {
  const students = useDataStore((s) => s.students)
  const classes = useDataStore((s) => s.classes)
  const addStudent = useDataStore((s) => s.addStudent)
  const updateStudent = useDataStore((s) => s.updateStudent)
  const deleteStudent = useDataStore((s) => s.deleteStudent)
  const importStudentsFromRows = useDataStore((s) => s.importStudentsFromRows)
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
  const [editing, setEditing] = useState<Student | null>(null)
  const [eNama, setENama] = useState('')
  const [eNisn, setENisn] = useState('')
  const [eClassId, setEClassId] = useState('')
  const [ePoin, setEPoin] = useState(0)
  const [eParentName, setEParentName] = useState('')
  const [eParentPhone, setEParentPhone] = useState('')
  const [eStudentPhone, setEStudentPhone] = useState('')
  const [eGender, setEGender] = useState<'L' | 'P'>('L')

  const rows: Row[] = students
    .map((student) => {
      const u = getUserById(student.userId)
      if (!u || u.role !== 'siswa') return null
      return { student, name: u.name, nisn: u.nisn ?? '' }
    })
    .filter((x): x is Row => x !== null)

  const resetAdd = () => {
    setNama('')
    setNisn('')
    setClassId('')
    setPass('siswa123')
    setParentName('')
    setParentPhone('')
    setStudentPhone('')
    setGender('L')
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!classId) {
      showToast('Pilih kelas.', 'error')
      return
    }
    try {
      addStudent({
        name: nama,
        nisn,
        classId,
        password: pass || 'siswa123',
        parentName,
        parentPhone,
        studentPhone,
        gender,
      })
      showToast('Siswa ditambahkan.', 'success')
      resetAdd()
    } catch (err) {
      showToast(String(err), 'error')
    }
  }

  const openEdit = (r: Row) => {
    setEditing(r.student)
    setENama(r.name)
    setENisn(r.nisn)
    setEClassId(r.student.classId)
    setEPoin(r.student.totalPoints)
    setEParentName(r.student.parentName)
    setEParentPhone(r.student.parentPhone)
    setEStudentPhone(r.student.studentPhone)
    setEGender(r.student.gender)
  }

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    updateStudent(editing.id, {
      name: eNama,
      nisn: eNisn,
      classId: eClassId,
      totalPoints: ePoin,
      parentName: eParentName,
      parentPhone: eParentPhone,
      studentPhone: eStudentPhone,
      gender: eGender,
    })
    showToast('Data siswa diperbarui.', 'success')
    setEditing(null)
  }

  const handleImport = (dataUrl: string) => {
    const { rows: parsed, error } = parseStudentSpreadsheetDataUrl(dataUrl)
    if (error) {
      showToast(error, 'error')
      return
    }
    if (!parsed.length) {
      showToast('Tidak ada baris data.', 'error')
      return
    }
    const { created, errors } = importStudentsFromRows(parsed)
    if (created) showToast(`${created} siswa diimpor.`, 'success')
    if (errors.length) {
      showToast(
        `${errors.length} baris bermasalah. Lihat konsol untuk detail.`,
        'error',
      )
      console.warn(errors)
    }
  }

  const currentUserId = useAuthStore((s) => s.user?.id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">
          Data siswa
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          CRUD siswa, impor Excel/CSV (kolom: NISN, Nama, Kelas). Nilai awal poin
          siswa dimulai dari 0.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Upload className="h-4 w-4 text-brand-navy" />
          Impor massal
        </h2>
        <FileUploader
          className="mt-3"
          label="Berkas Excel (.xlsx / .xls)"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          description="Header disarankan: NISN, Nama, Kelas (nama kelas harus sama persis dengan master kelas)."
          maxSizeMb={8}
          onDataUrl={(url) => handleImport(url)}
        />
      </div>

      <form
        onSubmit={handleAdd}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
      >
        <h2 className="sm:col-span-2 lg:col-span-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Plus className="h-4 w-4 text-brand-navy" />
          Tambah siswa
        </h2>
        <div>
          <label className="text-xs font-medium text-slate-600">Nama</label>
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
          <label className="text-xs font-medium text-slate-600">
            Kata sandi awal
          </label>
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-navy py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-dark"
          >
            Simpan
          </button>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Nama Orang Tua</label>
          <input
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">No. WA/Telp Orang Tua</label>
          <input
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">No. HP Siswa</label>
          <input
            value={studentPhone}
            onChange={(e) => setStudentPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </form>

      {editing ? (
        <form
          onSubmit={saveEdit}
          className="space-y-4 rounded-2xl border border-brand-gold/40 bg-amber-50/50 p-6"
        >
          <h3 className="text-sm font-semibold text-slate-800">Edit siswa</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium">Nama</label>
              <input
                required
                value={eNama}
                onChange={(e) => setENama(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">NISN</label>
              <input
                required
                value={eNisn}
                onChange={(e) => setENisn(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Kelas</label>
              <select
                value={eClassId}
                onChange={(e) => setEClassId(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Total poin</label>
              <input
                type="number"
                value={ePoin}
                onChange={(e) => setEPoin(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Jenis Kelamin</label>
              <select
                value={eGender}
                onChange={(e) => setEGender(e.target.value as 'L' | 'P')}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Nama Orang Tua</label>
              <input
                value={eParentName}
                onChange={(e) => setEParentName(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">No. WA/Telp Orang Tua</label>
              <input
                value={eParentPhone}
                onChange={(e) => setEParentPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">No. HP Siswa</label>
              <input
                value={eStudentPhone}
                onChange={(e) => setEStudentPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white"
            >
              Simpan perubahan
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm"
            >
              Batal
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <PaginatedTable
          rows={rows}
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
    </div>
  )
}
