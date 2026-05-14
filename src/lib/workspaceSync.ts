import { apiRequest, getAccessToken, setAccessToken } from './api'
import { canSaveWorkspaceOnServer } from './serverPolicy'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { useUiStore } from '../store/uiStore'
import {
  getWorkspaceRevisionForPush,
  resetWorkspaceRevision,
  setWorkspaceRevisionAfterSave,
} from './workspaceRevision'
import { pullWorkspaceFromServer } from './pullWorkspace'

const DEBOUNCE_MS = 1500
let timer: ReturnType<typeof setTimeout> | null = null

function buildSnapshot(): Record<string, unknown> {
  const s = useDataStore.getState()
  return {
    users: s.users.map((u) => ({ ...u, password: '' })),
    students: s.students,
    classes: s.classes,
    assignments: s.assignments,
    studentAssignments: s.studentAssignments,
    teachingJournals: s.teachingJournals,
    violations: s.violations,
    attendance: s.attendance,
    pointHistory: s.pointHistory,
    pointRedemptions: s.pointRedemptions,
    pointRedemptionRequests: s.pointRedemptionRequests,
    lateArrivals: s.lateArrivals,
    guestVisits: s.guestVisits,
    kbmLogs: s.kbmLogs,
    competitions: s.competitions,
    competitionStatusHistory: s.competitionStatusHistory,
    waliKelasNotes: s.waliKelasNotes,
    kokurikulerProjects: s.kokurikulerProjects,
  }
}

async function pushWorkspace(): Promise<void> {
  const user = useAuthStore.getState().user
  if (!user || !canSaveWorkspaceOnServer(user.role)) return
  if (!getAccessToken()) return
  const expectedRevision = getWorkspaceRevisionForPush()
  if (expectedRevision === null) {
    await pullWorkspaceFromServer()
    return
  }
  const snapshot = buildSnapshot()
  const res = await apiRequest('/api/workspace', {
    method: 'PUT',
    json: { snapshot, expectedRevision },
  })
  if (res.status === 401) {
    setAccessToken(null)
    resetWorkspaceRevision()
    useAuthStore.setState({ user: null })
    window.location.assign('/')
    return
  }
  if (res.status === 409) {
    await pullWorkspaceFromServer()
    useUiStore.getState().showToast(
      'Data di server sudah diubah orang lain. Tampilan telah disegarkan; silakan ulangi perubahan terakhir Anda.',
      'error',
    )
    return
  }
  if (res.ok) {
    try {
      const body = (await res.json()) as { revision?: number }
      if (typeof body.revision === 'number' && Number.isFinite(body.revision)) {
        setWorkspaceRevisionAfterSave(body.revision)
      }
    } catch {
      /* ignore */
    }
  }
}

export async function flushWorkspacePushNowAsync(): Promise<void> {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  await pushWorkspace()
}

export function flushWorkspacePushNow(): void {
  void flushWorkspacePushNowAsync()
}

function scheduleWorkspacePush(): void {
  const user = useAuthStore.getState().user
  if (!user || !canSaveWorkspaceOnServer(user.role)) return
  if (!getAccessToken()) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void pushWorkspace()
  }, DEBOUNCE_MS)
}

useDataStore.subscribe(() => {
  scheduleWorkspacePush()
})
