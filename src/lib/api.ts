/** Basis URL API (kosong = relatif, cocok dengan proxy Vite `/api`). */
export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE as string | undefined
  if (base && base.length > 0) {
    const b = base.replace(/\/$/, '')
    return path.startsWith('/') ? `${b}${path}` : `${b}/${path}`
  }
  return path.startsWith('/') ? path : `/${path}`
}

export function getAccessToken(): string | null {
  try {
    return sessionStorage.getItem('e-smandel-token')
  } catch {
    return null
  }
}

export function setAccessToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem('e-smandel-token', token)
    else sessionStorage.removeItem('e-smandel-token')
  } catch {
    /* ignore */
  }
}

export async function apiRequest(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<Response> {
  const headers = new Headers(init?.headers)
  if (init?.json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  const t = getAccessToken()
  if (t) headers.set('Authorization', `Bearer ${t}`)
  return fetch(apiUrl(path), {
    ...init,
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  })
}

export async function apiSetPassword(userId: string, password: string): Promise<{ ok: boolean; message?: string }> {
  const res = await apiRequest('/api/auth/set-password', {
    method: 'POST',
    json: { userId, password },
  })
  if (res.ok) return { ok: true }
  let message: string | undefined
  try {
    const j = (await res.json()) as { message?: string }
    message = j.message
  } catch {
    /* ignore */
  }
  return { ok: false, message: message ?? `Gagal (${res.status})` }
}
