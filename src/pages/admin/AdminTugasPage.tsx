import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { useUiStore } from '../../store/uiStore'
import type { Assignment, StudentAssignmentStatus } from '../../types/schema'

const STATUS_OPTIONS: { value: StudentAssignmentStatus; label: string }[] = [
  { value: 'belum_mengerjakan', label: 'Belum Mengerjakan' },
  { value: 'sudah_mengerjakan', label: 'Sudah Mengerjakan' },
  { value: 'terlambat', label: 'Terlambat' },
]

export function AdminTugasPage() {
  const user = useAuthStore((s) => s.user)
  const showToast = useUiStore((s) => s.showToast)
  const classes = useDataStore((s) => s.classes)
  const users = useDataStore((s) => s.users)
  const students = useDataStore((s) => s.students)
  const assignments = useDataStore((s) => s.assignments)
  const studentAssignments = useDataStore((s) => s.studentAssignments)
  const createAssignment = useDataStore((s) => s.createAssignment)
  const updateAssignment = useDataStore((s) => s.updateAssignment)
  const deleteAssignment = useDataStore((s) => s.deleteAssignment)
  const updateStudentAssignment = useDataStore((s) => s.updateStudentAssignment)

  const [filterClassId, setFilterClassId] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [editing, setEditing] = useState<Assignment | null>(null)

  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [teacherId, setTeacherId] = useState('')
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')

  const teacherOptions = users.filter((item) => item.role === 'guru_mapel')

  const filteredAssignments = useMemo(
    () =>
      assignments
        .filter((assignment) => !filterClassId || assignment.classId === filterClassId)
        .filter((assignment) =>
          !filterSubject
            ? true
            : assignment.subject.toLowerCase().includes(filterSubject.toLowerCase()),
        )
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [assignments, filterClassId, filterSubject],
  )

  const selectedAssignment = editing ?? filteredAssignments[0] ?? null

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
          progress,
        }
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName))
  }, [selectedAssignment, studentAssignments, students, users])

  const resetForm = () => {
    setEditing(null)
    setTeacherId('')
    setSubject('')
    setTitle('')
    setDescription('')
    setDueDate('')
    setClassId(classes[0]?.id ?? '')
  }

  const openEdit = (assignment: Assignment) => {
    setEditing(assignment)
    setTeacherId(assignment.teacherId)
    setSubject(assignment.subject)
    setTitle(assignment.title)
    setDescription(assignment.description)
    setDueDate(assignment.dueDate)
    setClassId(assignment.classId)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!teacherId) {
      showToast('Pilih guru mapel terlebih dahulu.', 'error')
      return
    }
    if (editing) {
      const result = updateAssignment(editing.id, {
        teacherId,
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
      showToast('Tugas berhasil diperbarui.', 'success')
      resetForm()
      return
    }
    const result = createAssignment({
      teacherId,
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
    showToast('Tugas global berhasil dibuat.', 'success')
    resetForm()
  }

  if (!user) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">CRUD Tugas Global</h1>
        <p className="mt-1 text-sm text-slate-600">
          Super Admin dapat melihat, membuat, mengubah, dan menghapus tugas di semua kelas.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2 lg:grid-cols-3"
      >
        <h2 className="md:col-span-2 lg:col-span-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
          {editing ? <Pencil className="h-4 w-4 text-brand-navy" /> : <Plus className="h-4 w-4 text-brand-navy" />}
          {editing ? 'Edit tugas' : 'Tambah tugas global'}
        </h2>
        <div>
          <label className="text-xs font-medium text-slate-600">Guru mapel</label>
          <select
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">— Pilih guru —</option>
            {teacherOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Kelas</label>
          <select
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
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
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Judul tugas</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Tenggat</label>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="lg:col-span-3">
          <label className="text-xs font-medium text-slate-600">Deskripsi</label>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="lg:col-span-3 flex gap-2">
          <button
            type="submit"
            className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-dark"
          >
            {editing ? 'Simpan perubahan' : 'Buat tugas'}
          </button>
          {editing ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              Batal
            </button>
          ) : null}
        </div>
      </form>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-600">Filter kelas</label>
          <select
            value={filterClassId}
            onChange={(event) => setFilterClassId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Semua kelas</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Filter mapel</label>
          <input
            value={filterSubject}
            onChange={(event) => setFilterSubject(event.target.value)}
            placeholder="Contoh: Matematika"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Judul</th>
              <th className="px-3 py-2">Mapel</th>
              <th className="px-3 py-2">Kelas</th>
              <th className="px-3 py-2">Guru</th>
              <th className="px-3 py-2">Tenggat</th>
              <th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.map((assignment) => (
              <tr key={assignment.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-800">{assignment.title}</td>
                <td className="px-3 py-2">{assignment.subject}</td>
                <td className="px-3 py-2">
                  {classes.find((item) => item.id === assignment.classId)?.name ?? '—'}
                </td>
                <td className="px-3 py-2">
                  {users.find((item) => item.id === assignment.teacherId)?.name ?? '—'}
                </td>
                <td className="px-3 py-2">{assignment.dueDate}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(assignment)}
                    className="inline-flex rounded p-1.5 text-brand-navy hover:bg-brand-navy/10"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Hapus tugas "${assignment.title}"?`)) {
                        deleteAssignment(assignment.id)
                        if (editing?.id === assignment.id) resetForm()
                        showToast('Tugas dihapus.', 'info')
                      }
                    }}
                    className="inline-flex rounded p-1.5 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAssignment ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Siswa</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {progressRows.map((row) => (
                <tr key={row.student.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800">{row.studentName}</td>
                  <td className="px-3 py-2">
                    <select
                      value={row.progress?.status ?? 'belum_mengerjakan'}
                      onChange={(event) => {
                        updateStudentAssignment({
                          assignmentId: selectedAssignment.id,
                          studentId: row.student.id,
                          status: event.target.value as StudentAssignmentStatus,
                        })
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
                      onBlur={(event) =>
                        updateStudentAssignment({
                          assignmentId: selectedAssignment.id,
                          studentId: row.student.id,
                          teacherNote: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
