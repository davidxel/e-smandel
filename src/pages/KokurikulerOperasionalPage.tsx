import { useMemo, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'
import type { KokurikulerProjectStatus } from '../types/schema'

const STATUS_LABEL: Record<KokurikulerProjectStatus, string> = {
  rencana: 'Rencana',
  berjalan: 'Berjalan',
  selesai: 'Selesai',
}

export function KokurikulerOperasionalPage() {
  const user = useAuthStore((s) => s.user)
  const users = useDataStore((s) => s.users)
  const classes = useDataStore((s) => s.classes)
  const students = useDataStore((s) => s.students)
  const projects = useDataStore((s) => s.kokurikulerProjects)
  const upsertProject = useDataStore((s) => s.upsertKokurikulerProject)
  const updateProjectStatus = useDataStore((s) => s.updateKokurikulerProjectStatus)
  const deleteProject = useDataStore((s) => s.deleteKokurikulerProject)
  const showToast = useUiStore((s) => s.showToast)

  const actorId = user?.id ?? ''
  const isPlanner = user?.role === 'super_admin' || user?.role === 'kurikulum'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coordinatorTeacherId, setCoordinatorTeacherId] = useState('')
  const [classId, setClassId] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusDraft, setStatusDraft] = useState<Record<string, KokurikulerProjectStatus>>({})

  const coordinatorRows = users.filter((u) => u.role === 'guru_mapel' && u.isKokurikulerCoordinator)
  const classStudents = useMemo(
    () => students.filter((s) => (classId ? s.classId === classId : false)),
    [students, classId],
  )
  const scopedProjects = useMemo(() => {
    if (isPlanner) return projects
    if (user?.role === 'guru_mapel' && user.isKokurikulerCoordinator) {
      return projects.filter((p) => p.coordinatorTeacherId === user.id)
    }
    return []
  }, [isPlanner, projects, user])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const res = upsertProject({
      actorId,
      title,
      description,
      coordinatorTeacherId,
      classId,
      studentIds: selectedStudentIds,
      startDate,
      endDate,
    })
    showToast(
      res.ok ? 'Projek kokurikuler disimpan.' : res.message ?? 'Gagal menyimpan projek.',
      res.ok ? 'success' : 'error',
    )
    if (res.ok) {
      setTitle('')
      setDescription('')
      setCoordinatorTeacherId('')
      setClassId('')
      setSelectedStudentIds([])
      setStartDate('')
      setEndDate('')
    }
  }

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Operasional Projek Kokurikuler</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola projek kokurikuler, peserta siswa, koordinator, dan progres pelaksanaan.
        </p>
      </div>

      {isPlanner ? (
        <form
          onSubmit={submit}
          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"
        >
          <div>
            <label className="text-xs font-medium text-slate-600">Judul Projek</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Koordinator</label>
            <select
              required
              value={coordinatorTeacherId}
              onChange={(e) => setCoordinatorTeacherId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">— Pilih koordinator —</option>
              {coordinatorRows.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Kelas Target</label>
            <select
              required
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value)
                setSelectedStudentIds([])
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">— Pilih kelas —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Periode Projek</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <input
                required
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                required
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-600">Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 min-h-[72px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-medium text-slate-600">Peserta Siswa</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {classStudents.map((s) => {
                const su = users.find((u) => u.id === s.userId)
                return (
                  <label key={s.id} className="inline-flex items-center gap-2 rounded border border-slate-200 px-2 py-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                      className="h-4 w-4 accent-brand-navy"
                    />
                    {su?.name ?? s.userId}
                  </label>
                )
              })}
            </div>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white"
            >
              Simpan Projek
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Daftar Projek Kokurikuler</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Projek</th>
                <th className="px-3 py-2">Koordinator</th>
                <th className="px-3 py-2">Kelas</th>
                <th className="px-3 py-2">Peserta</th>
                <th className="px-3 py-2">Periode</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {scopedProjects.map((p) => {
                const canEdit =
                  isPlanner ||
                  (user?.role === 'guru_mapel' &&
                    user.isKokurikulerCoordinator &&
                    p.coordinatorTeacherId === user.id)
                return (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <p className="font-medium">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.description || '—'}</p>
                    </td>
                    <td className="px-3 py-2">
                      {users.find((u) => u.id === p.coordinatorTeacherId)?.name ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      {classes.find((c) => c.id === p.classId)?.name ?? '—'}
                    </td>
                    <td className="px-3 py-2">{p.studentIds.length}</td>
                    <td className="px-3 py-2">
                      {p.startDate} s.d. {p.endDate}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        disabled={!canEdit}
                        value={statusDraft[p.id] ?? p.status}
                        onChange={(e) =>
                          setStatusDraft((prev) => ({
                            ...prev,
                            [p.id]: e.target.value as KokurikulerProjectStatus,
                          }))
                        }
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                      >
                        {(Object.keys(STATUS_LABEL) as KokurikulerProjectStatus[]).map((k) => (
                          <option key={k} value={k}>
                            {STATUS_LABEL[k]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => {
                            const res = updateProjectStatus({
                              actorId,
                              projectId: p.id,
                              status: statusDraft[p.id] ?? p.status,
                            })
                            showToast(
                              res.ok ? 'Status projek diperbarui.' : res.message ?? 'Gagal mengubah status.',
                              res.ok ? 'success' : 'error',
                            )
                          }}
                          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs disabled:opacity-40"
                        >
                          Simpan
                        </button>
                        {isPlanner ? (
                          <button
                            type="button"
                            onClick={() => {
                              deleteProject(p.id)
                              showToast('Projek kokurikuler dihapus.', 'info')
                            }}
                            className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700"
                          >
                            Hapus
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {scopedProjects.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-xs text-slate-500" colSpan={7}>
                    Belum ada projek kokurikuler.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
