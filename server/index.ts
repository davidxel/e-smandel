import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import type { Request, Response, NextFunction } from 'express'
import type { User } from '../src/types/schema.ts'
import type { DataState } from '../src/types/dataState.ts'
import { canSaveWorkspaceOnServer } from '../src/lib/serverPolicy.ts'
import {
  appendAuditLog,
  findAuthRowByCredential,
  loadWorkspacePayload,
  initDatabase,
  saveWorkspacePayload,
  upsertPasswordHash,
  ensureAuthRowsForUsers,
  pruneAuthUsers,
  getPool,
  getCounselingSnapshotsByStudentIds,
  listCounselingLogsForStudent,
  insertCounselingLogRow,
  updateCounselingLogRow,
  listSpRecordsForStudent,
  upsertSpRecordRow,
} from './db.ts'
import { BK_CRITICAL_POINTS_THRESHOLD, SP_THRESHOLDS } from '../src/lib/bkCounselingConstants.ts'

const PORT = Number(process.env.PORT ?? 3001)
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const JWT_SECRET_RAW = process.env.JWT_SECRET
const JWT_SECRET =
  JWT_SECRET_RAW && JWT_SECRET_RAW.trim().length > 0
    ? JWT_SECRET_RAW.trim()
    : 'dev-only-set-JWT_SECRET-in-production'

if (IS_PRODUCTION && JWT_SECRET === 'dev-only-set-JWT_SECRET-in-production') {
  console.error('[e-smandel] Production requires a strong JWT_SECRET environment variable.')
  process.exit(1)
}

const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter((s) => s.length > 0)

if (IS_PRODUCTION && CORS_ORIGINS.length === 0) {
  console.error(
    '[e-smandel] Production requires CORS_ORIGINS (comma-separated), e.g. https://app.sekolah.id,http://localhost:5173',
  )
  process.exit(1)
}

const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT ?? '12mb'

const PutWorkspaceSchema = z.object({
  snapshot: z.record(z.string(), z.unknown()),
  expectedRevision: z.number().int().nonnegative(),
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

if (IS_PRODUCTION) {
  app.set('trust proxy', 1)
}

app.use(
  cors({
    origin:
      CORS_ORIGINS.length > 0
        ? (origin, cb) => {
            if (!origin) {
              cb(null, true)
              return
            }
            if (CORS_ORIGINS.includes(origin)) {
              cb(null, true)
              return
            }
            cb(null, false)
          }
        : true,
    credentials: true,
  }),
)

app.use(express.json({ limit: JSON_BODY_LIMIT }))

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 120),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan masuk. Silakan coba lagi setelah beberapa menit.' },
})

app.get('/api/health', async (_req, res) => {
  try {
    await getPool().query('SELECT 1')
    res.json({ ok: true, database: 'mysql' })
  } catch {
    res.status(503).json({ ok: false, message: 'Basis data tidak terjangkau.' })
  }
})

function studentById(ws: DataState, studentId: string) {
  return ws.students.find((s) => s.id === studentId)
}

function canWaliViewStudent(actor: User, st: { classId: string }): boolean {
  return !!(actor.is_walikelas && actor.managed_class_id && actor.managed_class_id === st.classId)
}

app.post('/api/auth/login', loginLimiter, async (req, res) => {
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
    const { state: ws } = await loadWorkspacePayload()
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
    const { state: ws } = await loadWorkspacePayload()
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
      password: z.string().min(8).max(200),
    })
    const parsed = Body.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        message: 'Data tidak valid. Kata sandi minimal 8 karakter.',
      })
      return
    }
    const auth = (req as express.Request & { auth: JwtPayload }).auth
    const { state: ws } = await loadWorkspacePayload()
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
    void appendAuditLog(auth.sub, 'password.set', {
      targetUserId: parsed.data.userId,
      targetRole: target.role,
    }).catch((err) => console.error('[audit]', err))
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Kesalahan basis data.' })
  }
})

app.get('/api/workspace', authMiddleware, async (_req, res) => {
  try {
    const { state, revision } = await loadWorkspacePayload()
    res.setHeader('X-Workspace-Revision', String(revision))
    res.json(state)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Kesalahan membaca workspace.' })
  }
})

app.put('/api/workspace', authMiddleware, async (req, res) => {
  try {
    const auth = (req as express.Request & { auth: JwtPayload }).auth
    const { state: ws } = await loadWorkspacePayload()
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
    const { snapshot, expectedRevision } = parsed.data
    const merged = { ...ws, ...snapshot } as DataState
    if (!Array.isArray(merged.users) || !Array.isArray(merged.students)) {
      res.status(400).json({ message: 'Snapshot workspace tidak lengkap.' })
      return
    }

    merged.users = merged.users.map((u) => ({ ...u, password: '' }))
    await ensureAuthRowsForUsers(merged.users)
    await pruneAuthUsers(new Set(merged.users.map((u) => u.id)))
    const saveResult = await saveWorkspacePayload(merged, expectedRevision)
    if (!saveResult.ok) {
      res.status(409).json({
        message:
          'Data di server sudah diubah pengguna lain. Muat ulang halaman lalu ulangi pengeditan jika perlu.',
        revision: saveResult.currentRevision,
      })
      return
    }
    res.setHeader('X-Workspace-Revision', String(saveResult.newRevision))
    void appendAuditLog(actor.id, 'workspace.save', {
      newRevision: saveResult.newRevision,
    }).catch((err) => console.error('[audit]', err))
    res.json({ ok: true, revision: saveResult.newRevision })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Kesalahan menyimpan workspace.' })
  }
})

const CounselingStatusZ = z.enum(['perlu_penanganan', 'sedang_dibimbing', 'selesai'])
const SessionTypeZ = z.enum(['individu', 'kelompok'])
const SpLevelZ = z.enum(['SP1', 'SP2', 'SP3'])

function canBkManageCounseling(actor: User): boolean {
  return actor.role === 'bk' || actor.role === 'super_admin'
}

app.get('/api/counseling/critical-students', authMiddleware, async (req, res) => {
  try {
    const auth = (req as express.Request & { auth: JwtPayload }).auth
    const { state } = await loadWorkspacePayload()
    const actor = userById(state, auth.sub)
    if (!actor || !canBkManageCounseling(actor)) {
      res.status(403).json({ message: 'Hanya Guru BK yang dapat mengakses modul ini.' })
      return
    }
    const critical = state.students.filter((s) => s.totalPoints >= BK_CRITICAL_POINTS_THRESHOLD)
    const ids = critical.map((s) => s.id)
    const snap = await getCounselingSnapshotsByStudentIds(ids)
    const rows = critical.map((st) => {
      const u = state.users.find((x) => x.id === st.userId)
      const cl = state.classes.find((c) => c.id === st.classId)
      const sn = snap.get(st.id) ?? { lastStatus: null, lastSessionDate: null, sessionCount: 0 }
      const counselingStatus =
        sn.sessionCount === 0 || !sn.lastStatus
          ? 'perlu_penanganan'
          : CounselingStatusZ.safeParse(sn.lastStatus).success
            ? (sn.lastStatus as 'perlu_penanganan' | 'sedang_dibimbing' | 'selesai')
            : 'perlu_penanganan'
      return {
        studentId: st.id,
        userId: st.userId,
        name: u?.name ?? '—',
        nisn: u?.nisn ?? '—',
        classId: st.classId,
        className: cl?.name ?? '—',
        totalPoints: st.totalPoints,
        counselingStatus,
        lastSessionDate: sn.lastSessionDate,
        sessionCount: sn.sessionCount,
      }
    })
    rows.sort((a, b) => b.totalPoints - a.totalPoints)
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Gagal memuat daftar siswa prioritas BK.' })
  }
})

app.get('/api/counseling/wali-summary', authMiddleware, async (req, res) => {
  try {
    const auth = (req as express.Request & { auth: JwtPayload }).auth
    const { state } = await loadWorkspacePayload()
    const actor = userById(state, auth.sub)
    if (!actor || !actor.is_walikelas || !actor.managed_class_id) {
      res.status(403).json({ message: 'Hanya wali kelas yang dapat melihat ringkasan konseling.' })
      return
    }
    const classId = actor.managed_class_id
    const classStudents = state.students.filter((s) => s.classId === classId)
    const ids = classStudents.map((s) => s.id)
    const snap = await getCounselingSnapshotsByStudentIds(ids)
    const body = classStudents.map((st) => {
      const sn = snap.get(st.id) ?? { lastStatus: null, lastSessionDate: null, sessionCount: 0 }
      const counselingStatus =
        sn.sessionCount === 0
          ? 'belum_ada'
          : sn.lastStatus && CounselingStatusZ.safeParse(sn.lastStatus).success
            ? (sn.lastStatus as z.infer<typeof CounselingStatusZ>)
            : 'perlu_penanganan'
      return {
        studentId: st.id,
        counselingStatus,
        lastSessionDate: sn.lastSessionDate,
        sessionCount: sn.sessionCount,
      }
    })
    res.json(body)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Gagal memuat ringkasan konseling.' })
  }
})

app.get('/api/counseling/logs', authMiddleware, async (req, res) => {
  try {
    const auth = (req as express.Request & { auth: JwtPayload }).auth
    const studentId = z.string().min(1).safeParse(req.query.studentId)
    if (!studentId.success) {
      res.status(400).json({ message: 'Parameter studentId wajib.' })
      return
    }
    const { state } = await loadWorkspacePayload()
    const actor = userById(state, auth.sub)
    if (!actor) {
      res.status(401).json({ message: 'Pengguna tidak ditemukan.' })
      return
    }
    const st = studentById(state, studentId.data)
    if (!st) {
      res.status(404).json({ message: 'Siswa tidak ditemukan.' })
      return
    }
    const bk = canBkManageCounseling(actor)
    const waliOk = canWaliViewStudent(actor, st)
    if (!bk && !waliOk) {
      res.status(403).json({ message: 'Tidak diizinkan melihat log konseling siswa ini.' })
      return
    }
    const logs = await listCounselingLogsForStudent(studentId.data)
    res.json(logs)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Gagal memuat log konseling.' })
  }
})

app.post('/api/counseling/logs', authMiddleware, async (req, res) => {
  try {
    const auth = (req as express.Request & { auth: JwtPayload }).auth
    const { state } = await loadWorkspacePayload()
    const actor = userById(state, auth.sub)
    if (!actor || !canBkManageCounseling(actor)) {
      res.status(403).json({ message: 'Hanya Guru BK yang dapat menambah log konseling.' })
      return
    }
    const Body = z.object({
      studentId: z.string().min(1),
      date: z.string().min(8),
      sessionType: SessionTypeZ,
      analysis: z.string().min(1),
      actionPlan: z.string().min(1),
      status: CounselingStatusZ,
      attachmentUrl: z.string().nullable().optional(),
      sessionNo: z.number().int().positive().optional(),
    })
    const parsed = Body.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Data log konseling tidak valid.' })
      return
    }
    if (!studentById(state, parsed.data.studentId)) {
      res.status(404).json({ message: 'Siswa tidak ditemukan.' })
      return
    }
    const row = await insertCounselingLogRow({
      studentId: parsed.data.studentId,
      counselorId: actor.id,
      sessionDate: parsed.data.date,
      sessionNo: parsed.data.sessionNo,
      sessionType: parsed.data.sessionType,
      analysis: parsed.data.analysis,
      actionPlan: parsed.data.actionPlan,
      status: parsed.data.status,
      attachmentUrl: parsed.data.attachmentUrl ?? null,
    })
    void appendAuditLog(actor.id, 'counseling.log.create', { logId: row.id, studentId: parsed.data.studentId }).catch(
      (err) => console.error('[audit]', err),
    )
    res.status(201).json(row)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Gagal menyimpan log konseling.' })
  }
})

app.put('/api/counseling/logs/:logId', authMiddleware, async (req, res) => {
  try {
    const auth = (req as express.Request & { auth: JwtPayload }).auth
    const logId = z.string().min(1).safeParse(req.params.logId)
    if (!logId.success) {
      res.status(400).json({ message: 'ID log tidak valid.' })
      return
    }
    const { state } = await loadWorkspacePayload()
    const actor = userById(state, auth.sub)
    if (!actor || !canBkManageCounseling(actor)) {
      res.status(403).json({ message: 'Hanya Guru BK yang dapat memperbarui log konseling.' })
      return
    }
    const Patch = z
      .object({
        date: z.string().min(8).optional(),
        sessionType: SessionTypeZ.optional(),
        analysis: z.string().min(1).optional(),
        actionPlan: z.string().min(1).optional(),
        status: CounselingStatusZ.optional(),
        attachmentUrl: z.string().nullable().optional(),
      })
      .strict()
    const parsed = Patch.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Data pembaruan tidak valid.' })
      return
    }
    const bypass = actor.role === 'super_admin'
    const updated = await updateCounselingLogRow(
      logId.data,
      actor.id,
      {
        sessionDate: parsed.data.date,
        sessionType: parsed.data.sessionType,
        analysis: parsed.data.analysis,
        actionPlan: parsed.data.actionPlan,
        status: parsed.data.status,
        attachmentUrl: parsed.data.attachmentUrl,
      },
      { bypassCounselorCheck: bypass },
    )
    if (!updated) {
      res.status(404).json({ message: 'Log tidak ditemukan atau bukan milik Anda.' })
      return
    }
    void appendAuditLog(actor.id, 'counseling.log.update', { logId: logId.data }).catch((err) =>
      console.error('[audit]', err),
    )
    res.json(updated)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Gagal memperbarui log konseling.' })
  }
})

app.get('/api/counseling/sp-records', authMiddleware, async (req, res) => {
  try {
    const auth = (req as express.Request & { auth: JwtPayload }).auth
    const studentId = z.string().min(1).safeParse(req.query.studentId)
    if (!studentId.success) {
      res.status(400).json({ message: 'Parameter studentId wajib.' })
      return
    }
    const { state } = await loadWorkspacePayload()
    const actor = userById(state, auth.sub)
    if (!actor) {
      res.status(401).json({ message: 'Pengguna tidak ditemukan.' })
      return
    }
    const st = studentById(state, studentId.data)
    if (!st) {
      res.status(404).json({ message: 'Siswa tidak ditemukan.' })
      return
    }
    const bk = canBkManageCounseling(actor)
    const waliOk = canWaliViewStudent(actor, st)
    if (!bk && !waliOk) {
      res.status(403).json({ message: 'Tidak diizinkan.' })
      return
    }
    const rows = await listSpRecordsForStudent(studentId.data)
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Gagal memuat riwayat SP.' })
  }
})

app.post('/api/counseling/sp-records', authMiddleware, async (req, res) => {
  try {
    const auth = (req as express.Request & { auth: JwtPayload }).auth
    const { state } = await loadWorkspacePayload()
    const actor = userById(state, auth.sub)
    if (!actor || !canBkManageCounseling(actor)) {
      res.status(403).json({ message: 'Hanya Guru BK yang dapat mencatat SP.' })
      return
    }
    const Body = z.object({
      studentId: z.string().min(1),
      spLevel: SpLevelZ,
      issueDate: z.string().min(8),
      fileUrl: z.string().min(1),
    })
    const parsed = Body.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Data SP tidak valid.' })
      return
    }
    const st = studentById(state, parsed.data.studentId)
    if (!st) {
      res.status(404).json({ message: 'Siswa tidak ditemukan.' })
      return
    }
    const need = SP_THRESHOLDS[parsed.data.spLevel]
    if (st.totalPoints < need) {
      res.status(400).json({
        message: `Total poin siswa belum mencapai ambang ${parsed.data.spLevel} (minimum ${need} poin).`,
      })
      return
    }
    const row = await upsertSpRecordRow({
      studentId: parsed.data.studentId,
      spLevel: parsed.data.spLevel,
      issueDate: parsed.data.issueDate,
      fileUrl: parsed.data.fileUrl,
      issuedByUserId: actor.id,
    })
    void appendAuditLog(actor.id, 'counseling.sp.upsert', {
      studentId: parsed.data.studentId,
      spLevel: parsed.data.spLevel,
    }).catch((err) => console.error('[audit]', err))
    res.json(row)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Gagal menyimpan SP.' })
  }
})

app.get('/', (_req, res) => {
  res.send('API e-Smandel is running...')
})

async function main() {
  await initDatabase()
  app.listen(PORT, () => {
    console.log(`e-smandel API (MySQL) listening on http://127.0.0.1:${PORT}`)
    if (JWT_SECRET === 'dev-only-set-JWT_SECRET-in-production') {
      console.warn('[e-smandel] Using default JWT_SECRET; set JWT_SECRET for production.')
    }
    if (CORS_ORIGINS.length === 0) {
      console.warn('[e-smandel] CORS allows any origin; set CORS_ORIGINS for production.')
    }
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
