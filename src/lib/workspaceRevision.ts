/** Revisi workspace dari server (optimistic concurrency); diperbarui oleh GET /api/workspace dan PUT sukses. */
let serverRevision: number | null = null

export function resetWorkspaceRevision(): void {
  serverRevision = null
}

export function setWorkspaceRevisionFromHeader(headerValue: string | null): void {
  if (headerValue == null || headerValue === '') {
    serverRevision = null
    return
  }
  const n = Number.parseInt(headerValue, 10)
  serverRevision = Number.isFinite(n) ? n : null
}

export function setWorkspaceRevisionAfterSave(revision: number): void {
  serverRevision = revision
}

/** null = belum pernah tarik dari server sesi ini; jangan PUT sampai ada nilai. */
export function getWorkspaceRevisionForPush(): number | null {
  return serverRevision
}
