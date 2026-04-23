import { apiRequest, getAccessToken } from './api'
import { useDataStore } from '../store/dataStore'

export async function pullWorkspaceFromServer(): Promise<boolean> {
  if (!getAccessToken()) return false
  const res = await apiRequest('/api/workspace', { method: 'GET' })
  if (!res.ok) return false
  const data = (await res.json()) as Record<string, unknown>
  useDataStore.setState((prev) => ({ ...prev, ...data }))
  return true
}
