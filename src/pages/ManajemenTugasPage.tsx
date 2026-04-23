import { useMemo, useState } from 'react'
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'
import type { StudentAssignmentStatus } from '../types/schema'

const STATUS_OPTIONS: { value: StudentAssignmentStatus; label: string }[] = [
  { value: 'belum_mengerjakan', label: 'Belum Mengerjakan' },
  { value: 'sudah_mengerjakan', label: 'Sudah Mengerjakan' },
  { value: 'terlambat', label: 'Terlambat' },
]

export function ManajemenTugasPage() {
  const user = useAuthStore((s) => s.user)
  const showToast = useUiStore((s) => s.showToast)
  const classes = useDataStore((s) => s.classes)
  const students = useDataStore((s) => s.students)
  const users = useDataStore((s) => s.users)
  const assignments = useDataStore((s) => s.assignments)
  const studentAssignments = useDataStore((s) => s.studentAssignments)
  const createAssignment = useDataStore((s) => s.createAssignment)
  const deleteAssignment = useDataStore((s) => s.deleteAssignment)
  const updateAssignment = useDataStore((s) => s.updateAssignment)
  const updateStudentAssignment = useDataStore((s) => s.updateStudentAssignment)

  const teacherAssignments = useMemo(
    () =>
      assignments
        .filter((assignment) => assignment.teacherId === user?.id)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [assignments, user?.id],
  )

  const [classId, setClassId] = useState(user?.managed_class_id ?? classes[0]?.id ?? '')
  const [subject, setSubject] = useState(user?.jabatan?.replace(/^Guru\s+/i, '') ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('')
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null)
  const [studentSearch, setStudentSearch] = useState('')

  const selectedAssignment =
    teacherAssignments.find((assignment) => assignment.id === selectedAssignmentId) ??
    teacherAssignments[0]

  const progressRows = useMemo(() => {
    if (!selectedAssignment) return []
    return students
      .filter((student) => student.classId === selectedAssignment.classId)
      .map((student) => {
        const studentUser = users.find((item) => item.id === student.userId)
        const progress = studentAssignments.find(
          (item) =>
            item.assignmentId === selectedAssignment.id && item.studentId === student.id,
        )
        return {
          student,
          studentName: studentUser?.name ?? '—',
          nisn: studentUser?.nisn ?? '—',
          progress,
        }
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName))
  }, [selectedAssignment, studentAssignments, students, users])

  const filteredProgressRows = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    if (!q) return progressRows
    return progressRows.filter((row) =>
      `${row.studentName} ${row.nisn}`.toLowerCase().includes(q),
    )
  }, [progressRows, studentSearch])

  const completionStats = useMemo(() => {
    const total = progressRows.length
    const done = progressRows.filter((row) => row.progress?.status === 'sudah_mengerjakan').length
    const late = progressRows.filter((row) => row.progress?.status === 'terlambat').length
    return {
      total,
      done,
      late,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
    }
  }, [progressRows])

  const resetFormForCreate = () => {
    setTitle('')
    setDescription('')
    setDueDate('')
  }

  const resetFormForNewDefault = () => {
    setClassId(user?.managed_class_id ?? classes[0]?.id ?? '')
    setSubject(user?.jabatan?.replace(/^Guru\s+/i, '') ?? '')
    setTitle('')
    setDescription('')
    setDueDate('')
  }

  const startEditSelected = () => {
    if (!selectedAssignment) return
    setEditingAssignmentId(selectedAssignment.id)
    setClassId(selectedAssignment.classId)
    setSubject(selectedAssignment.subject)
    setTitle(selectedAssignment.title)
    setDescription(selectedAssignment.description)
    setDueDate(selectedAssignment.dueDate)
  }

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) return
    if (editingAssignmentId) {
      const result = updateAssignment(editingAssignmentId, {
        classId,
        subject,
        title,
        description,
        dueDate,
      })
      if (!result.ok) {
        showToast(result.message ?? 'Gagal memperbarui tugas.', 'error')
        return
      }
      setSelectedAssignmentId(editingAssignmentId)
      setEditingAssignmentId(null)
      resetFormForCreate()
      showToast('Tugas berhasil diperbarui.', 'success')
      return
    }

    const result = createAssignment({
      teacherId: user.id,
      classId,
      subject,
      title,
      description,
      dueDate,
    })
    if (!result.ok) {
      showToast(result.message ?? 'Gagal membuat tugas.', 'error')
      return
    }
    setSelectedAssignmentId(result.assignmentId ?? '')
    resetFormForCreate()
    showToast('Tugas berhasil dibuat untuk seluruh siswa di kelas.', 'success')
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Manajemen Tugas</h1>
        <p className="mt-1 text-sm text-slate-600">
          Buat tugas baru, pantau progres satu kelas, dan beri catatan singkat per siswa.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"
      >
        <h2 className="md:col-span-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
          {editingAssignmentId ? (
            <>
              <Pencil className="h-4 w-4 text-brand-navy" />
              Ubah tugas
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 text-brand-navy" />
              Tambah tugas baru
            </>
          )}
        </h2>
        <div>
          <label className="text-xs font-medium text-slate-600">Kelas</label>
          <select
            required
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">— Pilih kelas —</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Mata pelajaran</label>
          <input
            required
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Judul tugas</label>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Tenggat</label>
          <input
            required
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-600">Deskripsi</label>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <div className="flex gap-2">
            {editingAssignmentId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingAssignmentId(null)
                  resetFormForNewDefault()
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Batal
              </button>
            ) : null}
            <button
              type="submit"
              className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-dark"
            >
              {editingAssignmentId ? 'Simpan perubahan' : 'Simpan tugas'}
            </button>
          </div>
        </div>
      </form>

      <div className="grid gap-4 lg:grid-cols-[340px,1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <ClipboardList className="h-4 w-4 text-brand-navy" />
            Daftar tugas mapel
          </h2>
          <div className="mt-4 space-y-3">
            {teacherAssignments.map((assignment) => {
              const className = classes.find((item) => item.id === assignment.classId)?.name ?? '—'
              const isActive = selectedAssignment?.id === assignment.id
              return (
                <button
                  key={assignment.id}
                  type="button"
                  onClick={() => {
                    setSelectedAssignmentId(assignment.id)
                    setEditingAssignmentId(null)
                    setStudentSearch('')
                  }}
                  className={`w-full rounded-xl border p-3 text-left ${
                    isActive
                      ? 'border-brand-navy bg-brand-navy/5'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{assignment.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {assignment.subject} • {className}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-500">{assignment.dueDate}</span>
                  </div>
                </button>
              )
            })}
            {teacherAssignments.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada tugas yang dibuat.</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          {selectedAssignment ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      {selectedAssignment.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedAssignment.subject} •{' '}
                      {classes.find((item) => item.id === selectedAssignment.classId)?.name ?? '—'} •
                      Tenggat {selectedAssignment.dueDate}
                    </p>
                    {selectedAssignment.description ? (
                      <p className="mt-2 text-sm text-slate-600">
                        {selectedAssignment.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={startEditSelected}
                      className="inline-flex items-center gap-2 rounded-lg border border-brand-navy/20 bg-brand-navy/5 px-3 py-2 text-xs font-semibold text-brand-navy hover:bg-brand-navy/10"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit tugas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus tugas "${selectedAssignment.title}"?`)) {
                          deleteAssignment(selectedAssignment.id)
                          setSelectedAssignmentId('')
                          setEditingAssignmentId(null)
                          setStudentSearch('')
                          resetFormForNewDefault()
                          showToast('Tugas dihapus.', 'info')
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus tugas
                    </button>
                  </div>
                </div>
                <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Progres penyelesaian kelas
                      </p>
                      <p className="text-xs text-slate-500">
                        {completionStats.percent}% siswa sudah mengumpulkan.
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div>Sudah: {completionStats.done}</div>
                      <div>Terlambat: {completionStats.late}</div>
                      <div>Total: {completionStats.total}</div>
                    </div>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${completionStats.percent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-600">
                    Cari siswa (nama atau NISN)
                  </label>
                  <input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Ketik untuk memfilter…"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Siswa</th>
                      <th className="px-3 py-2">NISN</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProgressRows.map((row) => (
                      <tr key={row.student.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-800">{row.studentName}</td>
                        <td className="px-3 py-2 font-mono text-xs">{row.nisn}</td>
                        <td className="px-3 py-2">
                          <select
                            value={row.progress?.status ?? 'belum_mengerjakan'}
                            onChange={(event) => {
                              updateStudentAssignment({
                                assignmentId: selectedAssignment.id,
                                studentId: row.student.id,
                                status: event.target.value as StudentAssignmentStatus,
                              })
                              showToast(`Status ${row.studentName} diperbarui.`, 'success')
                            }}
                            className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
                          >
                            {STATUS_OPTIONS.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            defaultValue={row.progress?.teacherNote ?? ''}
                            onBlur={(event) => {
                              updateStudentAssignment({
                                assignmentId: selectedAssignment.id,
                                studentId: row.student.id,
                                teacherNote: event.target.value,
                              })
                            }}
                            placeholder="Feedback singkat untuk siswa"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                    {filteredProgressRows.length === 0 ? (
                      <tr>
                        <td
                          className="px-3 py-5 text-center text-sm text-slate-500"
                          colSpan={4}
                        >
                          Tidak ada siswa yang cocok dengan pencarian.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
              Pilih tugas di panel kiri untuk melihat progres siswa.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
