import { apiRequest } from './api'
import type { CounselingCaseStatus, CounselingLog, CounselingSessionType, SpLevel, SpRecord } from '../types/schema'

export type CriticalStudentRow = {
  studentId: string
  userId: string
  name: string
  nisn: string
  classId: string
  className: string
  totalPoints: number
  counselingStatus: CounselingCaseStatus
  lastSessionDate: string | null
  sessionCount: number
}

export type WaliCounselingSummaryRow = {
  studentId: string
  counselingStatus: 'perlu_penanganan' | 'sedang_dibimbing' | 'selesai' | 'belum_ada'
  lastSessionDate: string | null
  sessionCount: number
}

export async function fetchCriticalStudents(): Promise<CriticalStudentRow[]> {
  const res = await apiRequest('/api/counseling/critical-students', { method: 'GET' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as CriticalStudentRow[]
}

export async function fetchCounselingLogs(studentId: string): Promise<CounselingLog[]> {
  const q = new URLSearchParams({ studentId })
  const res = await apiRequest(`/api/counseling/logs?${q}`, { method: 'GET' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as CounselingLog[]
}

export async function createCounselingLog(body: {
  studentId: string
  date: string
  sessionType: CounselingSessionType
  analysis: string
  actionPlan: string
  status: CounselingCaseStatus
  attachmentUrl?: string | null
  sessionNo?: number
}): Promise<CounselingLog> {
  const res = await apiRequest('/api/counseling/logs', { method: 'POST', json: body })
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(j.message ?? `HTTP ${res.status}`)
  }
  return (await res.json()) as CounselingLog
}

export async function updateCounselingLog(
  id: string,
  body: Partial<{
    date: string
    sessionType: CounselingSessionType
    analysis: string
    actionPlan: string
    status: CounselingCaseStatus
    attachmentUrl: string | null
  }>,
): Promise<CounselingLog> {
  const res = await apiRequest(`/api/counseling/logs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    json: body,
  })
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(j.message ?? `HTTP ${res.status}`)
  }
  return (await res.json()) as CounselingLog
}

export async function fetchSpRecords(studentId: string): Promise<SpRecord[]> {
  const q = new URLSearchParams({ studentId })
  const res = await apiRequest(`/api/counseling/sp-records?${q}`, { method: 'GET' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as SpRecord[]
}

export async function upsertSpRecord(body: {
  studentId: string
  spLevel: SpLevel
  issueDate: string
  fileUrl: string
}): Promise<SpRecord> {
  const res = await apiRequest('/api/counseling/sp-records', { method: 'POST', json: body })
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(j.message ?? `HTTP ${res.status}`)
  }
  return (await res.json()) as SpRecord
}

export async function fetchWaliCounselingSummary(): Promise<WaliCounselingSummaryRow[]> {
  const res = await apiRequest('/api/counseling/wali-summary', { method: 'GET' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as WaliCounselingSummaryRow[]
}
