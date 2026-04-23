import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import type { Request, Response, NextFunction } from 'express'
import type { User } from '../src/types/schema.ts'
import type { DataState } from '../src/types/dataState.ts'
import { canSaveWorkspaceOnServer } from '../src/lib/serverPolicy.ts'
import {
  findAuthRowByCredential,
  loadWorkspacePayload,
  initDatabase,
  saveWorkspacePayload,
  upsertPasswordHash,
  ensureAuthRowsForUsers,
  pruneAuthUsers,
  getPool,
} from './db.ts'

const PORT = Number(process.env.PORT ?? 3001)
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-set-JWT_SECRET-in-production'

const PutWorkspaceSchema = z.object({
  snapshot: z.record(z.string(), z.unknown()),
})

type JwtPayload = { sub: string; role: string }

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const raw = req.headers.authorization
  const token = raw?.startsWith('Bearer ') ? raw.slice(7) : null
  if (!token) {
    res.status(401).json({ message: 'Tidak terautentikasi.' })
    return
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    ;(req as express.Request & { auth: JwtPayload }).auth = decoded
    next()
  } catch {
    res.status(401).json({ message: 'Sesi tidak valid atau kedaluwarsa.' })
  }
}

function toAuthUser(u: User) {
  const { password: _p, ...rest } = u
  return rest
}

function userById(ws: DataState, id: string): User | undefined {
  return ws.users.find((u) => u.id === id)
}

function canActorSetPassword(actor: User, target: User): boolean {
  if (actor.id === target.id) return true
  if (actor.role === 'super_admin') return true
  if (actor.role === 'kesiswaan' && target.role === 'siswa') return true
  return false
}

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '64mb' }))

app.get('/api/health', async (_req, res) => {
  try {
    await getPool().query('SELECT 1')
    res.json({ ok: true, database: 'mysql' })
  } catch {
    res.status(503).json({ ok: false, message: 'Basis data tidak terjangkau.' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const Body = z.object({
      credential: z.string().min(1),
      password: z.string().min(1),
    })
    const parsed = Body.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Permintaan tidak valid.' })
      return
    }
    const { credential, password } = parsed.data
    const row = await findAuthRowByCredential(credential)
    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      res.status(401).json({ message: 'NIP/NISN atau kata sandi salah.' })
      return
    }
    const ws = await loadWorkspacePayload()
    const user = userById(ws, row.user_id)
    if (!user) {
      res.status(500).json({ message: 'Profil pengguna tidak ditemukan di basis data.' })
      return
    }
    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: toAuthUser(user) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Kesalahan basis data saat login.' })
  }
})

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const { sub } = (req as express.Request & { auth: JwtPayload }).auth
    const ws = await loadWorkspacePayload()
    const user = userById(ws, sub)
    if (!user) {
      res.status(401).json({ message: 'Pengguna tidak ditemukan.' })
      return
    }
    res.json(toAuthUser(user))
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Kesalahan basis data.' })
  }
})

app.post('/api/auth/set-password', authMiddleware, async (req, res) => {
  try {
    const Body = z.object({
      userId: z.string().min(1),
      password: z.string().min(4).max(200),
    })
    const parsed = Body.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Data tidak valid.' })
      return
    }
    const auth = (req as express.Request & { auth: JwtPayload }).auth
    const ws = await loadWorkspacePayload()
    const actor = userById(ws, auth.sub)
    const target = userById(ws, parsed.data.userId)
    if (!actor || !target) {
      res.status(404).json({ message: 'Pengguna tidak ditemukan.' })
      return
    }
    if (!canActorSetPassword(actor, target)) {
      res.status(403).json({ message: 'Tidak diizinkan mengubah kata sandi akun ini.' })
      return
    }
    await upsertPasswordHash(target, parsed.data.password)
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Kesalahan basis data.' })
  }
})

app.get('/api/workspace', authMiddleware, async (_req, res) => {
  try {
    res.json(await loadWorkspacePayload())
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Kesalahan membaca workspace.' })
  }
})

app.put('/api/workspace', authMiddleware, async (req, res) => {
  try {
    const auth = (req as express.Request & { auth: JwtPayload }).auth
    const ws = await loadWorkspacePayload()
    const actor = userById(ws, auth.sub)
    if (!actor) {
      res.status(401).json({ message: 'Pengguna tidak ditemukan.' })
      return
    }
    const role = actor.role
    if (!canSaveWorkspaceOnServer(role)) {
      res.status(403).json({ message: 'Peran Anda tidak dapat menyimpan perubahan data ke server.' })
      return
    }

    const parsed = PutWorkspaceSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Format workspace tidak valid.' })
      return
    }
    const { snapshot } = parsed.data
    const merged = { ...ws, ...snapshot } as DataState
    if (!Array.isArray(merged.users) || !Array.isArray(merged.students)) {
      res.status(400).json({ message: 'Snapshot workspace tidak lengkap.' })
      return
    }

    merged.users = merged.users.map((u) => ({ ...u, password: '' }))
    await ensureAuthRowsForUsers(merged.users)
    await pruneAuthUsers(new Set(merged.users.map((u) => u.id)))
    await saveWorkspacePayload(merged)
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Kesalahan menyimpan workspace.' })
  }
})

async function main() {
  await initDatabase()
  app.listen(PORT, () => {
    console.log(`e-smandel API (MySQL) listening on http://127.0.0.1:${PORT}`)
    if (JWT_SECRET === 'dev-only-set-JWT_SECRET-in-production') {
      console.warn('[e-smandel] Using default JWT_SECRET; set JWT_SECRET for production.')
    }
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

// Tambahkan ini di server/index.ts
app.get('/', (req, res) => {
  res.send('API e-Smandel is running...');
});
