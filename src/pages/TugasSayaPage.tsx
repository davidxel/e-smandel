import { useMemo } from 'react'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import type { StudentAssignmentStatus } from '../types/schema'

const STATUS_STYLES: Record<StudentAssignmentStatus, string> = {
  belum_mengerjakan: 'bg-amber-100 text-amber-800 border-amber-200',
  sudah_mengerjakan: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  terlambat: 'bg-red-100 text-red-800 border-red-200',
}

const STATUS_LABELS: Record<StudentAssignmentStatus, string> = {
  belum_mengerjakan: 'Belum Mengerjakan',
  sudah_mengerjakan: 'Sudah Mengerjakan',
  terlambat: 'Terlambat',
}

export function TugasSayaPage() {
  const user = useAuthStore((s) => s.user)
  const getStudentByUserId = useDataStore((s) => s.getStudentByUserId)
  const assignments = useDataStore((s) => s.assignments)
  const studentAssignments = useDataStore((s) => s.studentAssignments)
  const users = useDataStore((s) => s.users)
  const classes = useDataStore((s) => s.classes)

  const student = user ? getStudentByUserId(user.id) : undefined

  const groupedAssignments = useMemo(() => {
    if (!student) return []
    const rows = studentAssignments
      .filter((item) => item.studentId === student.id)
      .map((item) => {
        const assignment = assignments.find((entry) => entry.id === item.assignmentId)
        if (!assignment) return null
        const teacher = users.find((entry) => entry.id === assignment.teacherId)
        const className = classes.find((entry) => entry.id === assignment.classId)?.name ?? '—'
        return {
          item,
          assignment,
          teacherName: teacher?.name ?? '—',
          className,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.assignment.dueDate.localeCompare(b.assignment.dueDate))

    const map = new Map<string, typeof rows>()
    for (const row of rows) {
      const key = row.assignment.subject
      const current = map.get(key) ?? []
      current.push(row)
      map.set(key, current)
    }
    return Array.from(map.entries())
  }, [assignments, classes, student, studentAssignments, users])

  if (!user || !student) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Tugas Saya</h1>
        <p className="mt-1 text-sm text-slate-600">
          Semua tugas Anda ditampilkan per mata pelajaran dengan badge status yang jelas.
        </p>
      </div>

      {groupedAssignments.map(([subject, rows]) => (
        <section
          key={subject}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{subject}</h2>
              <p className="text-sm text-slate-500">{rows.length} tugas</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {rows.map((row) => (
              <article
                key={row.item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      {row.assignment.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.className} • Guru: {row.teacherName}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[row.item.status]}`}
                  >
                    {STATUS_LABELS[row.item.status]}
                  </span>
                </div>
                {row.assignment.description ? (
                  <p className="mt-3 text-sm text-slate-600">{row.assignment.description}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>Tenggat: {row.assignment.dueDate}</span>
                  <span>Update: {new Date(row.item.updatedAt).toLocaleString('id-ID')}</span>
                </div>
                {row.item.teacherNote ? (
                  <div className="mt-4 rounded-xl border border-brand-gold/30 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    Catatan guru: {row.item.teacherNote}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ))}

      {groupedAssignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
          Belum ada tugas yang ditugaskan untuk akun siswa ini.
        </div>
      ) : null}
    </div>
  )
}
