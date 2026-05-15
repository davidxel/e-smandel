import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import mysql from 'mysql2/promise'
import type { RowDataPacket } from 'mysql2/promise'
import { buildFreshWorkspaceData } from '../src/lib/workspaceState.ts'
import { UNCLASSIFIED_CLASS_ID, UNCLASSIFIED_CLASS_NAME } from '../src/lib/classConstants.ts'
import type { DataState } from '../src/types/dataState.ts'
import type { User } from '../src/types/schema.ts'
import type { LoginAppearance } from '../src/types/loginAppearance.ts'
import { mergeLoginAppearance } from '../src/types/loginAppearance.ts'

function stripWorkspaceForStorage(ws: DataState): DataState {
  return {
    ...ws,
    users: ws.users.map((u) => ({ ...u, password: '' })),
  }
}

let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) throw new Error('Basis data belum diinisialisasi. Panggil initDatabase() dulu.')
  return pool
}

async function getCurrentDatabase(conn: mysql.PoolConnection): Promise<string> {
  const [rows] = await conn.query<RowDataPacket[]>('SELECT DATABASE() AS db')
  const db = String(rows[0]?.db ?? '').trim()
  if (!db) throw new Error('DATABASE() kosong; pastikan koneksi MySQL memakai database yang benar.')
  return db
}

async function columnExists(
  conn: mysql.PoolConnection,
  table: string,
  column: string,
): Promise<boolean> {
  const db = await getCurrentDatabase(conn)
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = ? AND table_name = ? AND column_name = ?
     LIMIT 1`,
    [db, table, column],
  )
  return rows.length > 0
}

async function addColumnIfMissing(
  conn: mysql.PoolConnection,
  table: string,
  column: string,
  ddl: string,
): Promise<void> {
  const exists = await columnExists(conn, table, column)
  if (exists) return
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`)
}

function createPoolFromEnv(): mysql.Pool {
  const database = (process.env.MYSQL_DATABASE ?? 'e_smandel').trim()
  if (!database) {
    throw new Error('MYSQL_DATABASE kosong. Setel nama basis data, contoh: e_smandel')
  }
  return mysql.createPool({
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? 'root',
    password: process.env.MYSQL_PASSWORD ?? '',
    database,
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT ?? 10),
    enableKeepAlive: true,
    ...(process.env.MYSQL_SSL === '1' ? { ssl: {} } : {}),
  })
}

async function migrate(conn: mysql.PoolConnection): Promise<void> {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS user_auth (
      user_id VARCHAR(64) NOT NULL PRIMARY KEY,
      password_hash VARCHAR(255) NOT NULL,
      nip VARCHAR(32) NULL,
      nisn VARCHAR(32) NULL,
      INDEX idx_user_auth_nip (nip),
      INDEX idx_user_auth_nisn (nisn)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS workspace (
      id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
      payload LONGTEXT NOT NULL,
      revision BIGINT UNSIGNED NOT NULL DEFAULT 1,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await addColumnIfMissing(
    conn,
    'workspace',
    'revision',
    '`revision` BIGINT UNSIGNED NOT NULL DEFAULT 1',
  )
  await conn.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      \`key\` VARCHAR(64) NOT NULL PRIMARY KEY,
      value_json LONGTEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS point_violations (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      points INT NOT NULL,
      category VARCHAR(16) NOT NULL,
      slug VARCHAR(128) NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_point_violations_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS point_history (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      student_id VARCHAR(64) NOT NULL,
      changer_id VARCHAR(64) NOT NULL,
      points_changed INT NOT NULL,
      reason TEXT NOT NULL,
      source VARCHAR(32) NOT NULL,
      timestamp DATETIME NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_point_history_student_ts (student_id, timestamp),
      INDEX idx_point_history_source (source)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS point_redemptions (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      student_id VARCHAR(64) NOT NULL,
      teacher_id VARCHAR(64) NOT NULL,
      activity_type VARCHAR(255) NOT NULL,
      points_restored INT NOT NULL,
      proof_photo_data_url LONGTEXT NOT NULL,
      timestamp DATETIME NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_point_redemptions_student_ts (student_id, timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS point_redemption_requests (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      student_id VARCHAR(64) NOT NULL,
      supervisor_teacher_id VARCHAR(64) NOT NULL,
      activity_type VARCHAR(255) NOT NULL,
      requested_points INT NOT NULL,
      status VARCHAR(16) NOT NULL,
      requested_at DATETIME NOT NULL,
      approved_at DATETIME NULL,
      approved_by VARCHAR(64) NULL,
      proof_photo_data_url LONGTEXT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_point_redemption_requests_student (student_id),
      INDEX idx_point_redemption_requests_supervisor (supervisor_teacher_id),
      INDEX idx_point_redemption_requests_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS master_classes (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_master_classes_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS assignments (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      teacher_id VARCHAR(64) NOT NULL,
      class_id VARCHAR(64) NOT NULL,
      subject VARCHAR(128) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      due_date DATE NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_assignments_teacher (teacher_id),
      INDEX idx_assignments_class_due (class_id, due_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS student_assignments (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      assignment_id VARCHAR(64) NOT NULL,
      student_id VARCHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL,
      teacher_note TEXT NOT NULL,
      updated_at DATETIME NOT NULL,
      db_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_student_assignments_assignment (assignment_id),
      INDEX idx_student_assignments_student (student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS teaching_journals (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      teacher_id VARCHAR(64) NOT NULL,
      class_id VARCHAR(64) NOT NULL,
      meeting_number INT NOT NULL,
      date DATE NOT NULL,
      text LONGTEXT NOT NULL,
      updated_at DATETIME NOT NULL,
      db_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_teaching_journals_teacher_date (teacher_id, date),
      INDEX idx_teaching_journals_class_date (class_id, date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS competitions (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      student_id VARCHAR(64) NOT NULL,
      competition_name VARCHAR(255) NOT NULL,
      level VARCHAR(64) NOT NULL,
      mentor_teacher_id VARCHAR(64) NOT NULL,
      quarantine_date DATE NOT NULL,
      competition_start_date DATE NOT NULL,
      competition_end_date DATE NOT NULL,
      status VARCHAR(32) NOT NULL,
      updated_at DATETIME NOT NULL,
      db_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_competitions_student (student_id),
      INDEX idx_competitions_mentor (mentor_teacher_id),
      INDEX idx_competitions_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS competition_status_history (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      student_id VARCHAR(64) NOT NULL,
      competition_id VARCHAR(191) NOT NULL,
      from_status VARCHAR(32) NULL,
      to_status VARCHAR(32) NOT NULL,
      changed_by_teacher_id VARCHAR(64) NOT NULL,
      changed_at DATETIME NOT NULL,
      note TEXT NOT NULL,
      db_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_comp_status_history_student (student_id),
      INDEX idx_comp_status_history_comp (competition_id),
      INDEX idx_comp_status_history_changed_at (changed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS wali_kelas_notes (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      teacher_id VARCHAR(64) NOT NULL,
      student_id VARCHAR(64) NOT NULL,
      note LONGTEXT NOT NULL,
      updated_at DATETIME NOT NULL,
      db_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_wali_kelas_notes_teacher_student (teacher_id, student_id),
      INDEX idx_wali_kelas_notes_student (student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(64) NOT NULL,
      nip VARCHAR(32) NULL,
      nisn VARCHAR(32) NULL,
      jabatan VARCHAR(255) NULL,
      is_piket TINYINT(1) NOT NULL DEFAULT 0,
      piket_schedule_days JSON NOT NULL,
      is_competition_mentor TINYINT(1) NOT NULL DEFAULT 0,
      is_walikelas TINYINT(1) NOT NULL DEFAULT 0,
      managed_class_id VARCHAR(64) NULL,
      taught_class_ids JSON NULL,
      is_kokurikuler_coordinator TINYINT(1) NOT NULL DEFAULT 0,
      profile_photo_data_url LONGTEXT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_app_users_role (role),
      INDEX idx_app_users_nip (nip),
      INDEX idx_app_users_nisn (nisn)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await addColumnIfMissing(conn, 'app_users', 'taught_class_ids', '`taught_class_ids` JSON NULL')
  await conn.query(`
    CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      class_id VARCHAR(64) NOT NULL,
      total_points INT NOT NULL DEFAULT 0,
      status_prestasi VARCHAR(32) NOT NULL DEFAULT 'normal',
      parent_name VARCHAR(255) NOT NULL DEFAULT '',
      parent_phone VARCHAR(32) NOT NULL DEFAULT '',
      student_phone VARCHAR(32) NOT NULL DEFAULT '',
      gender CHAR(1) NOT NULL DEFAULT 'L',
      dapodik_profile JSON NULL,
      health_history JSON NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_students_user (user_id),
      INDEX idx_students_class (class_id),
      INDEX idx_students_points (total_points)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await addColumnIfMissing(conn, 'students', 'dapodik_profile', '`dapodik_profile` JSON NULL')
  await addColumnIfMissing(conn, 'students', 'health_history', '`health_history` JSON NULL')

  await conn.query(`
    CREATE TABLE IF NOT EXISTS epoin_recommendations (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      student_id VARCHAR(64) NOT NULL,
      violation_id VARCHAR(64) NOT NULL,
      recommender_id VARCHAR(64) NOT NULL,
      note LONGTEXT NOT NULL,
      status VARCHAR(16) NOT NULL,
      processed_by VARCHAR(64) NULL,
      processed_at DATETIME NULL,
      agreement_letter_file_data_url LONGTEXT NULL,
      parent_statement_file_data_url LONGTEXT NULL,
      created_at DATETIME NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_epoin_rec_student (student_id),
      INDEX idx_epoin_rec_status (status),
      INDEX idx_epoin_rec_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      student_id VARCHAR(64) NOT NULL,
      teacher_id VARCHAR(64) NOT NULL,
      date DATE NOT NULL,
      period INT NOT NULL,
      status VARCHAR(32) NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_attendance_student_slot (student_id, date, period),
      INDEX idx_attendance_teacher_date (teacher_id, date),
      INDEX idx_attendance_status_date (status, date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS late_arrivals (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      date DATE NOT NULL,
      student_id VARCHAR(64) NOT NULL,
      nisn VARCHAR(32) NOT NULL,
      student_name VARCHAR(255) NOT NULL,
      class_name VARCHAR(128) NOT NULL,
      reason TEXT NOT NULL,
      created_by_user_id VARCHAR(64) NOT NULL,
      created_at DATETIME NOT NULL,
      follow_up_violation_id VARCHAR(64) NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_late_arrivals_date (date),
      INDEX idx_late_arrivals_student (student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS guest_visits (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      date DATE NOT NULL,
      name VARCHAR(255) NOT NULL,
      position VARCHAR(255) NOT NULL,
      purpose TEXT NOT NULL,
      created_by_user_id VARCHAR(64) NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_guest_visits_date (date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS kbm_logs (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      date DATE NOT NULL,
      period INT NOT NULL,
      teacher_id VARCHAR(64) NOT NULL,
      teacher_name VARCHAR(255) NOT NULL,
      class_id VARCHAR(64) NOT NULL,
      class_name VARCHAR(128) NOT NULL,
      note TEXT NOT NULL,
      created_by_user_id VARCHAR(64) NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_kbm_logs_date_period (date, period),
      INDEX idx_kbm_logs_teacher (teacher_id),
      INDEX idx_kbm_logs_class (class_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS kokurikuler_projects (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description LONGTEXT NOT NULL,
      coordinator_teacher_id VARCHAR(64) NOT NULL,
      class_id VARCHAR(64) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status VARCHAR(32) NOT NULL,
      updated_at DATETIME NOT NULL,
      db_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_kokurikuler_projects_coordinator (coordinator_teacher_id),
      INDEX idx_kokurikuler_projects_class (class_id),
      INDEX idx_kokurikuler_projects_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS kokurikuler_project_students (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      project_id VARCHAR(191) NOT NULL,
      student_id VARCHAR(64) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_kokurikuler_project_student (project_id, student_id),
      INDEX idx_kokurikuler_project_students_student (student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      actor_user_id VARCHAR(64) NOT NULL,
      action VARCHAR(64) NOT NULL,
      details JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_log_actor_ts (actor_user_id, created_at),
      INDEX idx_audit_log_action_ts (action, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS counseling_logs (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      student_id VARCHAR(64) NOT NULL,
      counselor_id VARCHAR(64) NOT NULL,
      session_date DATE NOT NULL,
      session_no INT NOT NULL,
      session_type VARCHAR(16) NOT NULL,
      analysis LONGTEXT NOT NULL,
      action_plan LONGTEXT NOT NULL,
      status VARCHAR(32) NOT NULL,
      attachment_url LONGTEXT NULL,
      created_at DATETIME NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_counseling_logs_student_date (student_id, session_date),
      INDEX idx_counseling_logs_counselor (counselor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS sp_records (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      student_id VARCHAR(64) NOT NULL,
      sp_level VARCHAR(8) NOT NULL,
      issue_date DATE NOT NULL,
      file_url LONGTEXT NOT NULL,
      issued_by_user_id VARCHAR(64) NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_sp_records_student_level (student_id, sp_level),
      INDEX idx_sp_records_student (student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS student_details (
      student_id VARCHAR(64) NOT NULL PRIMARY KEY,
      extra_columns JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  const [unclassRows] = await conn.query<RowDataPacket[]>(
    'SELECT id FROM master_classes WHERE id = ? LIMIT 1',
    [UNCLASSIFIED_CLASS_ID],
  )
  if (unclassRows.length === 0) {
    await conn.execute('INSERT INTO master_classes (id, name) VALUES (?, ?)', [
      UNCLASSIFIED_CLASS_ID,
      UNCLASSIFIED_CLASS_NAME,
    ])
  }
}

export async function appendAuditLog(
  actorUserId: string,
  action: string,
  details: unknown,
): Promise<void> {
  const p = getPool()
  const payload = details === undefined || details === null ? null : JSON.stringify(details)
  await p.execute(
    'INSERT INTO audit_log (actor_user_id, action, details) VALUES (?, ?, ?)',
    [actorUserId, action, payload],
  )
}

const LOGIN_APPEARANCE_KEY = 'login_appearance'

export async function getLoginAppearance(): Promise<LoginAppearance> {
  const p = getPool()
  const [rows] = await p.query<RowDataPacket[]>(
    'SELECT value_json FROM app_settings WHERE `key` = ? LIMIT 1',
    [LOGIN_APPEARANCE_KEY],
  )
  const raw = rows[0]?.value_json
  if (raw == null || raw === '') return mergeLoginAppearance(null)
  const str = Buffer.isBuffer(raw)
    ? raw.toString('utf8')
    : typeof raw === 'string'
      ? raw
      : JSON.stringify(raw)
  try {
    return mergeLoginAppearance(JSON.parse(str) as unknown)
  } catch {
    return mergeLoginAppearance(null)
  }
}

export async function upsertLoginAppearance(appearance: LoginAppearance): Promise<void> {
  const p = getPool()
  const json = JSON.stringify(appearance)
  await p.execute(
    'INSERT INTO app_settings (`key`, value_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_json = VALUES(value_json)',
    [LOGIN_APPEARANCE_KEY, json],
  )
}

async function seedIfEmpty(p: mysql.Pool): Promise<void> {
  const conn = await p.getConnection()
  try {
    const [rows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) AS c FROM user_auth')
    const count = Number(rows[0]?.c ?? 0)
    if (count > 0) return

    const fresh = buildFreshWorkspaceData()
    await conn.beginTransaction()
    try {
      for (const u of fresh.users) {
        await conn.execute(
          'INSERT INTO user_auth (user_id, password_hash, nip, nisn) VALUES (?, ?, ?, ?)',
          [
            u.id,
            bcrypt.hashSync(u.password, 10),
            u.nip?.trim() || null,
            u.nisn?.trim() || null,
          ],
        )
      }
      const payload = JSON.stringify(stripWorkspaceForStorage(fresh))
      await conn.execute('INSERT INTO workspace (id, payload, revision) VALUES (1, ?, 1)', [payload])
      await conn.commit()
    } catch (e) {
      await conn.rollback()
      throw e
    }
  } finally {
    conn.release()
  }
}

/** Inisialisasi pool, tabel, dan seed demo jika kosong. */
export async function initDatabase(): Promise<void> {
  if (pool) return
  pool = createPoolFromEnv()
  const conn = await pool.getConnection()
  try {
    await migrate(conn)
  } finally {
    conn.release()
  }
  await seedIfEmpty(pool)
}

export type WorkspaceSaveResult =
  | { ok: true; newRevision: number }
  | { ok: false; conflict: true; currentRevision: number }

export async function loadWorkspacePayload(): Promise<{ state: DataState; revision: number }> {
  const p = getPool()
  const [rows] = await p.query<RowDataPacket[]>(
    'SELECT payload, revision FROM workspace WHERE id = 1 LIMIT 1',
  )
  const raw = rows[0]?.payload
  const revision =
    rows[0] != null && rows[0].revision != null && rows[0].revision !== ''
      ? Number(rows[0].revision)
      : 0
  if (raw == null) return { state: buildFreshWorkspaceData(), revision }
  const str = Buffer.isBuffer(raw)
    ? raw.toString('utf8')
    : typeof raw === 'string'
      ? raw
      : JSON.stringify(raw)
  const ws = JSON.parse(str) as DataState

  const [violationRows] = await p.query<RowDataPacket[]>(
    'SELECT id, name, points, category, slug FROM point_violations ORDER BY name ASC',
  )
  if (violationRows.length > 0) {
    ws.violations = violationRows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      points: Number(r.points),
      category: String(r.category) as DataState['violations'][number]['category'],
      slug: String(r.slug),
    }))
  }

  const [historyRows] = await p.query<RowDataPacket[]>(
    'SELECT id, student_id, changer_id, points_changed, reason, source, timestamp FROM point_history ORDER BY timestamp DESC',
  )
  if (historyRows.length > 0) {
    ws.pointHistory = historyRows.map((r) => ({
      id: String(r.id),
      studentId: String(r.student_id),
      changerId: String(r.changer_id),
      pointsChanged: Number(r.points_changed),
      reason: String(r.reason),
      source: String(r.source) as DataState['pointHistory'][number]['source'],
      timestamp: new Date(r.timestamp).toISOString(),
    }))
  }

  const [redemptionRows] = await p.query<RowDataPacket[]>(
    `SELECT id, student_id, teacher_id, activity_type, points_restored, proof_photo_data_url, timestamp
     FROM point_redemptions ORDER BY timestamp DESC`,
  )
  if (redemptionRows.length > 0) {
    ws.pointRedemptions = redemptionRows.map((r) => ({
      id: String(r.id),
      studentId: String(r.student_id),
      teacherId: String(r.teacher_id),
      activityType: String(r.activity_type),
      pointsRestored: Number(r.points_restored),
      proofPhotoDataUrl: String(r.proof_photo_data_url),
      timestamp: new Date(r.timestamp).toISOString(),
    }))
  }

  const [requestRows] = await p.query<RowDataPacket[]>(
    `SELECT id, student_id, supervisor_teacher_id, activity_type, requested_points, status, requested_at, approved_at, approved_by, proof_photo_data_url
     FROM point_redemption_requests ORDER BY requested_at DESC`,
  )
  if (requestRows.length > 0) {
    ws.pointRedemptionRequests = requestRows.map((r) => ({
      id: String(r.id),
      studentId: String(r.student_id),
      supervisorTeacherId: String(r.supervisor_teacher_id),
      activityType: String(r.activity_type),
      requestedPoints: Number(r.requested_points),
      status: String(r.status) as DataState['pointRedemptionRequests'][number]['status'],
      requestedAt: new Date(r.requested_at).toISOString(),
      approvedAt: r.approved_at ? new Date(r.approved_at).toISOString() : null,
      approvedBy: r.approved_by ? String(r.approved_by) : null,
      proofPhotoDataUrl: r.proof_photo_data_url ? String(r.proof_photo_data_url) : null,
    }))
  }

  const [classRows] = await p.query<RowDataPacket[]>(
    'SELECT id, name FROM master_classes ORDER BY name ASC',
  )
  if (classRows.length > 0) {
    ws.classes = classRows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
    }))
  }

  const [assignmentRows] = await p.query<RowDataPacket[]>(
    `SELECT id, teacher_id, class_id, subject, title, description, due_date, created_at
     FROM assignments ORDER BY created_at DESC`,
  )
  if (assignmentRows.length > 0) {
    ws.assignments = assignmentRows.map((r) => ({
      id: String(r.id),
      teacherId: String(r.teacher_id),
      classId: String(r.class_id),
      subject: String(r.subject),
      title: String(r.title),
      description: String(r.description),
      dueDate: new Date(r.due_date).toISOString().slice(0, 10),
      createdAt: new Date(r.created_at).toISOString(),
    }))
  }

  const [studentAssignmentRows] = await p.query<RowDataPacket[]>(
    `SELECT id, assignment_id, student_id, status, teacher_note, updated_at
     FROM student_assignments ORDER BY updated_at DESC`,
  )
  if (studentAssignmentRows.length > 0) {
    ws.studentAssignments = studentAssignmentRows.map((r) => ({
      id: String(r.id),
      assignmentId: String(r.assignment_id),
      studentId: String(r.student_id),
      status: String(r.status) as DataState['studentAssignments'][number]['status'],
      teacherNote: String(r.teacher_note),
      updatedAt: new Date(r.updated_at).toISOString(),
    }))
  }

  const [teachingJournalRows] = await p.query<RowDataPacket[]>(
    `SELECT id, teacher_id, class_id, meeting_number, date, text, updated_at
     FROM teaching_journals ORDER BY updated_at DESC`,
  )
  if (teachingJournalRows.length > 0) {
    ws.teachingJournals = teachingJournalRows.map((r) => ({
      id: String(r.id),
      teacherId: String(r.teacher_id),
      classId: String(r.class_id),
      meetingNumber: Number(r.meeting_number),
      date: new Date(r.date).toISOString().slice(0, 10),
      text: String(r.text),
      updatedAt: new Date(r.updated_at).toISOString(),
    }))
  }

  const [competitionRows] = await p.query<RowDataPacket[]>(
    `SELECT id, student_id, competition_name, level, mentor_teacher_id, quarantine_date, competition_start_date, competition_end_date, status, updated_at
     FROM competitions ORDER BY updated_at DESC`,
  )
  if (competitionRows.length > 0) {
    ws.competitions = competitionRows.map((r) => ({
      id: String(r.id),
      studentId: String(r.student_id),
      competitionName: String(r.competition_name),
      level: String(r.level) as DataState['competitions'][number]['level'],
      mentorTeacherId: String(r.mentor_teacher_id),
      quarantineDate: new Date(r.quarantine_date).toISOString().slice(0, 10),
      competitionStartDate: new Date(r.competition_start_date).toISOString().slice(0, 10),
      competitionEndDate: new Date(r.competition_end_date).toISOString().slice(0, 10),
      status: String(r.status) as DataState['competitions'][number]['status'],
      updatedAt: new Date(r.updated_at).toISOString(),
    }))
  }

  const [competitionHistoryRows] = await p.query<RowDataPacket[]>(
    `SELECT id, student_id, competition_id, from_status, to_status, changed_by_teacher_id, changed_at, note
     FROM competition_status_history ORDER BY changed_at DESC`,
  )
  if (competitionHistoryRows.length > 0) {
    ws.competitionStatusHistory = competitionHistoryRows.map((r) => ({
      id: String(r.id),
      studentId: String(r.student_id),
      competitionId: String(r.competition_id),
      fromStatus: r.from_status ? String(r.from_status) as DataState['competitionStatusHistory'][number]['fromStatus'] : null,
      toStatus: String(r.to_status) as DataState['competitionStatusHistory'][number]['toStatus'],
      changedByTeacherId: String(r.changed_by_teacher_id),
      changedAt: new Date(r.changed_at).toISOString(),
      note: String(r.note),
    }))
  }

  const [waliNoteRows] = await p.query<RowDataPacket[]>(
    `SELECT id, teacher_id, student_id, note, updated_at
     FROM wali_kelas_notes ORDER BY updated_at DESC`,
  )
  if (waliNoteRows.length > 0) {
    ws.waliKelasNotes = waliNoteRows.map((r) => ({
      id: String(r.id),
      teacherId: String(r.teacher_id),
      studentId: String(r.student_id),
      note: String(r.note),
      updatedAt: new Date(r.updated_at).toISOString(),
    }))
  }

  const [appUserRows] = await p.query<RowDataPacket[]>(
    `SELECT id, name, role, nip, nisn, jabatan, is_piket, piket_schedule_days, is_competition_mentor, is_walikelas, managed_class_id, taught_class_ids, is_kokurikuler_coordinator, profile_photo_data_url
     FROM app_users ORDER BY name ASC`,
  )
  if (appUserRows.length > 0) {
    ws.users = appUserRows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      role: String(r.role) as DataState['users'][number]['role'],
      password: '',
      nip: r.nip ? String(r.nip) : null,
      nisn: r.nisn ? String(r.nisn) : null,
      jabatan: r.jabatan ? String(r.jabatan) : null,
      isPiket: Boolean(r.is_piket),
      piketScheduleDays: Array.isArray(r.piket_schedule_days)
        ? (r.piket_schedule_days as number[])
        : JSON.parse(String(r.piket_schedule_days ?? '[]')) as number[],
      isCompetitionMentor: Boolean(r.is_competition_mentor),
      is_walikelas: Boolean(r.is_walikelas),
      managed_class_id: r.managed_class_id ? String(r.managed_class_id) : null,
      taught_class_ids: r.taught_class_ids
        ? (typeof r.taught_class_ids === 'string'
            ? JSON.parse(r.taught_class_ids)
            : r.taught_class_ids)
        : [],
      isKokurikulerCoordinator: Boolean(r.is_kokurikuler_coordinator),
      profilePhotoDataUrl: r.profile_photo_data_url ? String(r.profile_photo_data_url) : null,
    }))
  }

  const [studentRows] = await p.query<RowDataPacket[]>(
    `SELECT id, user_id, class_id, total_points, status_prestasi, parent_name, parent_phone, student_phone, gender, dapodik_profile, health_history
     FROM students ORDER BY id ASC`,
  )
  const [studentDetailRows] = await p.query<RowDataPacket[]>(
    'SELECT student_id, extra_columns FROM student_details',
  )
  const extraByStudent = new Map<string, Record<string, string>>()
  for (const dr of studentDetailRows) {
    const sid = String(dr.student_id)
    const raw = dr.extra_columns
    const parsed =
      typeof raw === 'string'
        ? (JSON.parse(raw) as Record<string, string>)
        : (raw as Record<string, string>)
    if (parsed && typeof parsed === 'object') extraByStudent.set(sid, parsed)
  }
  if (studentRows.length > 0) {
    ws.students = studentRows.map((r) => ({
      id: String(r.id),
      userId: String(r.user_id),
      classId: String(r.class_id),
      totalPoints: Number(r.total_points),
      statusPrestasi: String(r.status_prestasi) as DataState['students'][number]['statusPrestasi'],
      parentName: String(r.parent_name ?? ''),
      parentPhone: String(r.parent_phone ?? ''),
      studentPhone: String(r.student_phone ?? ''),
      gender: (String(r.gender ?? 'L') === 'P' ? 'P' : 'L') as 'L' | 'P',
      dapodikProfile: r.dapodik_profile
        ? (typeof r.dapodik_profile === 'string'
            ? JSON.parse(r.dapodik_profile)
            : r.dapodik_profile)
        : null,
      dapodikExtraColumns: extraByStudent.get(String(r.id)) ?? null,
      healthHistory: r.health_history
        ? (typeof r.health_history === 'string'
            ? JSON.parse(r.health_history)
            : r.health_history)
        : {
            conditions: {
              alergi: { checked: false, year: '' },
              tbc: { checked: false, year: '' },
              sakit_kuning: { checked: false, year: '' },
              hati: { checked: false, year: '' },
              jantung: { checked: false, year: '' },
              geger_otak: { checked: false, year: '' },
              typus: { checked: false, year: '' },
              maag: { checked: false, year: '' },
              mata: { checked: false, year: '' },
              epilepsi: { checked: false, year: '' },
              kecelakaan: { checked: false, year: '' },
            },
            otherConditionName: '',
            otherConditionChecked: false,
            otherConditionYear: '',
          },
    }))
  }

  const [recRows] = await p.query<RowDataPacket[]>(
    `SELECT id, student_id, violation_id, recommender_id, note, status, processed_by, processed_at,
            agreement_letter_file_data_url, parent_statement_file_data_url, created_at
     FROM epoin_recommendations
     ORDER BY created_at DESC`,
  )
  if (recRows.length > 0) {
    ws.epoinRecommendations = recRows.map((r) => ({
      id: String(r.id),
      studentId: String(r.student_id),
      violationId: String(r.violation_id),
      recommenderId: String(r.recommender_id),
      note: String(r.note ?? ''),
      status: String(r.status) as DataState['epoinRecommendations'][number]['status'],
      processedBy: r.processed_by ? String(r.processed_by) : null,
      processedAt: r.processed_at ? new Date(r.processed_at).toISOString() : null,
      agreementLetterFileDataUrl: r.agreement_letter_file_data_url
        ? String(r.agreement_letter_file_data_url)
        : null,
      parentStatementFileDataUrl: r.parent_statement_file_data_url
        ? String(r.parent_statement_file_data_url)
        : null,
      createdAt: new Date(r.created_at).toISOString(),
    }))
  }

  const [attendanceRows] = await p.query<RowDataPacket[]>(
    `SELECT id, student_id, teacher_id, date, period, status
     FROM attendance ORDER BY date DESC, period DESC`,
  )
  if (attendanceRows.length > 0) {
    ws.attendance = attendanceRows.map((r) => ({
      id: String(r.id),
      studentId: String(r.student_id),
      teacherId: String(r.teacher_id),
      date: new Date(r.date).toISOString().slice(0, 10),
      period: Number(r.period),
      status: String(r.status) as DataState['attendance'][number]['status'],
    }))
  }

  const [projectRows] = await p.query<RowDataPacket[]>(
    `SELECT id, title, description, coordinator_teacher_id, class_id, start_date, end_date, status, updated_at
     FROM kokurikuler_projects ORDER BY updated_at DESC`,
  )
  if (projectRows.length > 0) {
    const [projectStudentRows] = await p.query<RowDataPacket[]>(
      'SELECT project_id, student_id FROM kokurikuler_project_students',
    )
    const studentsByProject = new Map<string, string[]>()
    for (const row of projectStudentRows) {
      const projectId = String(row.project_id)
      const studentId = String(row.student_id)
      const arr = studentsByProject.get(projectId)
      if (arr) arr.push(studentId)
      else studentsByProject.set(projectId, [studentId])
    }
    ws.kokurikulerProjects = projectRows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      description: String(r.description),
      coordinatorTeacherId: String(r.coordinator_teacher_id),
      classId: String(r.class_id),
      studentIds: studentsByProject.get(String(r.id)) ?? [],
      startDate: new Date(r.start_date).toISOString().slice(0, 10),
      endDate: new Date(r.end_date).toISOString().slice(0, 10),
      status: String(r.status) as DataState['kokurikulerProjects'][number]['status'],
      updatedAt: new Date(r.updated_at).toISOString(),
    }))
  }

  const [lateRows] = await p.query<RowDataPacket[]>(
    `SELECT id, date, student_id, nisn, student_name, class_name, reason, created_by_user_id, created_at, follow_up_violation_id
     FROM late_arrivals ORDER BY created_at DESC`,
  )
  if (lateRows.length > 0) {
    ws.lateArrivals = lateRows.map((r) => ({
      id: String(r.id),
      date: new Date(r.date).toISOString().slice(0, 10),
      studentId: String(r.student_id),
      nisn: String(r.nisn),
      studentName: String(r.student_name),
      className: String(r.class_name),
      reason: String(r.reason),
      createdByUserId: String(r.created_by_user_id),
      createdAt: new Date(r.created_at).toISOString(),
      followUpViolationId: r.follow_up_violation_id ? String(r.follow_up_violation_id) : null,
    }))
  }

  const [guestRows] = await p.query<RowDataPacket[]>(
    `SELECT id, date, name, position, purpose, created_by_user_id, created_at
     FROM guest_visits ORDER BY created_at DESC`,
  )
  if (guestRows.length > 0) {
    ws.guestVisits = guestRows.map((r) => ({
      id: String(r.id),
      date: new Date(r.date).toISOString().slice(0, 10),
      name: String(r.name),
      position: String(r.position),
      purpose: String(r.purpose),
      createdByUserId: String(r.created_by_user_id),
      createdAt: new Date(r.created_at).toISOString(),
    }))
  }

  const [kbmRows] = await p.query<RowDataPacket[]>(
    `SELECT id, date, period, teacher_id, teacher_name, class_id, class_name, note, created_by_user_id, created_at
     FROM kbm_logs ORDER BY created_at DESC`,
  )
  if (kbmRows.length > 0) {
    ws.kbmLogs = kbmRows.map((r) => ({
      id: String(r.id),
      date: new Date(r.date).toISOString().slice(0, 10),
      period: Number(r.period),
      teacherId: String(r.teacher_id),
      teacherName: String(r.teacher_name),
      classId: String(r.class_id),
      className: String(r.class_name),
      note: String(r.note),
      createdByUserId: String(r.created_by_user_id),
      createdAt: new Date(r.created_at).toISOString(),
    }))
  }

  return { state: ws, revision }
}

export async function saveWorkspacePayload(
  payload: DataState,
  expectedRevision: number,
): Promise<WorkspaceSaveResult> {
  const p = getPool()
  const json = JSON.stringify(stripWorkspaceForStorage(payload))
  const conn = await p.getConnection()
  try {
    await conn.beginTransaction()
    const [revRows] = await conn.query<RowDataPacket[]>(
      'SELECT revision FROM workspace WHERE id = 1 FOR UPDATE',
    )
    const currentRev =
      revRows.length > 0 && revRows[0].revision != null && revRows[0].revision !== ''
        ? Number(revRows[0].revision)
        : 0
    if (currentRev !== expectedRevision) {
      await conn.rollback()
      return { ok: false, conflict: true, currentRevision: currentRev }
    }
    const newRev = currentRev + 1

    await conn.query('DELETE FROM point_violations')
    for (const v of payload.violations) {
      await conn.execute(
        'INSERT INTO point_violations (id, name, points, category, slug) VALUES (?, ?, ?, ?, ?)',
        [v.id, v.name, v.points, v.category, v.slug],
      )
    }

    await conn.query('DELETE FROM point_history')
    for (const h of payload.pointHistory) {
      await conn.execute(
        `INSERT INTO point_history (id, student_id, changer_id, points_changed, reason, source, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [h.id, h.studentId, h.changerId, h.pointsChanged, h.reason, h.source, h.timestamp.slice(0, 19).replace('T', ' ')],
      )
    }

    await conn.query('DELETE FROM point_redemptions')
    for (const r of payload.pointRedemptions) {
      await conn.execute(
        `INSERT INTO point_redemptions
          (id, student_id, teacher_id, activity_type, points_restored, proof_photo_data_url, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id,
          r.studentId,
          r.teacherId,
          r.activityType,
          r.pointsRestored,
          r.proofPhotoDataUrl,
          r.timestamp.slice(0, 19).replace('T', ' '),
        ],
      )
    }

    await conn.query('DELETE FROM point_redemption_requests')
    for (const req of payload.pointRedemptionRequests) {
      await conn.execute(
        `INSERT INTO point_redemption_requests
          (id, student_id, supervisor_teacher_id, activity_type, requested_points, status, requested_at, approved_at, approved_by, proof_photo_data_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.id,
          req.studentId,
          req.supervisorTeacherId,
          req.activityType,
          req.requestedPoints,
          req.status,
          req.requestedAt.slice(0, 19).replace('T', ' '),
          req.approvedAt ? req.approvedAt.slice(0, 19).replace('T', ' ') : null,
          req.approvedBy,
          req.proofPhotoDataUrl,
        ],
      )
    }

    await conn.query('DELETE FROM master_classes')
    for (const cls of payload.classes) {
      await conn.execute('INSERT INTO master_classes (id, name) VALUES (?, ?)', [cls.id, cls.name])
    }

    await conn.query('DELETE FROM assignments')
    for (const assignment of payload.assignments) {
      await conn.execute(
        `INSERT INTO assignments
          (id, teacher_id, class_id, subject, title, description, due_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          assignment.id,
          assignment.teacherId,
          assignment.classId,
          assignment.subject,
          assignment.title,
          assignment.description,
          assignment.dueDate,
          assignment.createdAt.slice(0, 19).replace('T', ' '),
        ],
      )
    }

    await conn.query('DELETE FROM student_assignments')
    for (const sa of payload.studentAssignments) {
      await conn.execute(
        `INSERT INTO student_assignments
          (id, assignment_id, student_id, status, teacher_note, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          sa.id,
          sa.assignmentId,
          sa.studentId,
          sa.status,
          sa.teacherNote,
          sa.updatedAt.slice(0, 19).replace('T', ' '),
        ],
      )
    }

    await conn.query('DELETE FROM teaching_journals')
    for (const journal of payload.teachingJournals) {
      await conn.execute(
        `INSERT INTO teaching_journals
          (id, teacher_id, class_id, meeting_number, date, text, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          journal.id,
          journal.teacherId,
          journal.classId,
          journal.meetingNumber,
          journal.date,
          journal.text,
          journal.updatedAt.slice(0, 19).replace('T', ' '),
        ],
      )
    }

    await conn.query('DELETE FROM competitions')
    for (const comp of payload.competitions) {
      await conn.execute(
        `INSERT INTO competitions
          (id, student_id, competition_name, level, mentor_teacher_id, quarantine_date, competition_start_date, competition_end_date, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          comp.id,
          comp.studentId,
          comp.competitionName,
          comp.level,
          comp.mentorTeacherId,
          comp.quarantineDate,
          comp.competitionStartDate,
          comp.competitionEndDate,
          comp.status,
          comp.updatedAt.slice(0, 19).replace('T', ' '),
        ],
      )
    }

    await conn.query('DELETE FROM competition_status_history')
    for (const h of payload.competitionStatusHistory) {
      await conn.execute(
        `INSERT INTO competition_status_history
          (id, student_id, competition_id, from_status, to_status, changed_by_teacher_id, changed_at, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          h.id,
          h.studentId,
          h.competitionId,
          h.fromStatus,
          h.toStatus,
          h.changedByTeacherId,
          h.changedAt.slice(0, 19).replace('T', ' '),
          h.note,
        ],
      )
    }

    await conn.query('DELETE FROM wali_kelas_notes')
    for (const note of payload.waliKelasNotes) {
      await conn.execute(
        `INSERT INTO wali_kelas_notes
          (id, teacher_id, student_id, note, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          note.id,
          note.teacherId,
          note.studentId,
          note.note,
          note.updatedAt.slice(0, 19).replace('T', ' '),
        ],
      )
    }

    await conn.query('DELETE FROM app_users')
    for (const u of payload.users) {
      await conn.execute(
        `INSERT INTO app_users
          (id, name, role, nip, nisn, jabatan, is_piket, piket_schedule_days, is_competition_mentor, is_walikelas, managed_class_id, taught_class_ids, is_kokurikuler_coordinator, profile_photo_data_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          u.id,
          u.name,
          u.role,
          u.nip,
          u.nisn,
          u.jabatan,
          u.isPiket ? 1 : 0,
          JSON.stringify(u.piketScheduleDays ?? []),
          u.isCompetitionMentor ? 1 : 0,
          u.is_walikelas ? 1 : 0,
          u.managed_class_id,
          JSON.stringify((u as unknown as { taught_class_ids?: string[] }).taught_class_ids ?? []),
          u.isKokurikulerCoordinator ? 1 : 0,
          u.profilePhotoDataUrl,
        ],
      )
    }

    await conn.query('DELETE FROM student_details')
    await conn.query('DELETE FROM students')
    for (const s of payload.students) {
      await conn.execute(
        `INSERT INTO students
          (id, user_id, class_id, total_points, status_prestasi, parent_name, parent_phone, student_phone, gender, dapodik_profile, health_history)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.id,
          s.userId,
          s.classId,
          s.totalPoints,
          s.statusPrestasi,
          s.parentName,
          s.parentPhone,
          s.studentPhone,
          s.gender,
          s.dapodikProfile ? JSON.stringify(s.dapodikProfile) : null,
          (s as unknown as { healthHistory?: unknown }).healthHistory
            ? JSON.stringify((s as unknown as { healthHistory: unknown }).healthHistory)
            : null,
        ],
      )
      const extra = (s as unknown as { dapodikExtraColumns?: Record<string, string> | null })
        .dapodikExtraColumns
      if (extra && typeof extra === 'object' && Object.keys(extra).length > 0) {
        await conn.execute(
          'INSERT INTO student_details (student_id, extra_columns) VALUES (?, ?)',
          [s.id, JSON.stringify(extra)],
        )
      }
    }

    await conn.query('DELETE FROM epoin_recommendations')
    for (const rec of payload.epoinRecommendations ?? []) {
      await conn.execute(
        `INSERT INTO epoin_recommendations
          (id, student_id, violation_id, recommender_id, note, status, processed_by, processed_at, agreement_letter_file_data_url, parent_statement_file_data_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          rec.id,
          rec.studentId,
          rec.violationId,
          rec.recommenderId,
          rec.note ?? '',
          rec.status,
          rec.processedBy,
          rec.processedAt ? rec.processedAt.slice(0, 19).replace('T', ' ') : null,
          rec.agreementLetterFileDataUrl,
          rec.parentStatementFileDataUrl,
          rec.createdAt.slice(0, 19).replace('T', ' '),
        ],
      )
    }

    await conn.query('DELETE FROM attendance')
    for (const a of payload.attendance) {
      await conn.execute(
        `INSERT INTO attendance
          (id, student_id, teacher_id, date, period, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [a.id, a.studentId, a.teacherId, a.date, a.period, a.status],
      )
    }

    await conn.query('DELETE FROM kokurikuler_projects')
    for (const project of payload.kokurikulerProjects) {
      await conn.execute(
        `INSERT INTO kokurikuler_projects
          (id, title, description, coordinator_teacher_id, class_id, start_date, end_date, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          project.id,
          project.title,
          project.description,
          project.coordinatorTeacherId,
          project.classId,
          project.startDate,
          project.endDate,
          project.status,
          project.updatedAt.slice(0, 19).replace('T', ' '),
        ],
      )
    }

    await conn.query('DELETE FROM kokurikuler_project_students')
    for (const project of payload.kokurikulerProjects) {
      for (const studentId of project.studentIds) {
        await conn.execute(
          'INSERT INTO kokurikuler_project_students (project_id, student_id) VALUES (?, ?)',
          [project.id, studentId],
        )
      }
    }

    await conn.query('DELETE FROM late_arrivals')
    for (const late of payload.lateArrivals) {
      await conn.execute(
        `INSERT INTO late_arrivals
          (id, date, student_id, nisn, student_name, class_name, reason, created_by_user_id, created_at, follow_up_violation_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          late.id,
          late.date,
          late.studentId,
          late.nisn,
          late.studentName,
          late.className,
          late.reason,
          late.createdByUserId,
          late.createdAt.slice(0, 19).replace('T', ' '),
          late.followUpViolationId,
        ],
      )
    }

    await conn.query('DELETE FROM guest_visits')
    for (const g of payload.guestVisits) {
      await conn.execute(
        `INSERT INTO guest_visits
          (id, date, name, position, purpose, created_by_user_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [g.id, g.date, g.name, g.position, g.purpose, g.createdByUserId, g.createdAt.slice(0, 19).replace('T', ' ')],
      )
    }

    await conn.query('DELETE FROM kbm_logs')
    for (const k of payload.kbmLogs) {
      await conn.execute(
        `INSERT INTO kbm_logs
          (id, date, period, teacher_id, teacher_name, class_id, class_name, note, created_by_user_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          k.id,
          k.date,
          k.period,
          k.teacherId,
          k.teacherName,
          k.classId,
          k.className,
          k.note,
          k.createdByUserId,
          k.createdAt.slice(0, 19).replace('T', ' '),
        ],
      )
    }

    await conn.execute(
      `INSERT INTO workspace (id, payload, revision) VALUES (1, ?, ?)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload), revision = VALUES(revision), updated_at = CURRENT_TIMESTAMP`,
      [json, newRev],
    )

    await conn.commit()
    return { ok: true, newRevision: newRev }
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

export async function findAuthRowByCredential(
  credential: string,
): Promise<{ user_id: string; password_hash: string } | undefined> {
  const c = credential.trim()
  const p = getPool()
  const [rows] = await p.query<RowDataPacket[]>(
    'SELECT user_id, password_hash FROM user_auth WHERE nip = ? OR nisn = ? LIMIT 1',
    [c, c],
  )
  const r = rows[0]
  if (!r) return undefined
  return { user_id: String(r.user_id), password_hash: String(r.password_hash) }
}

export async function upsertPasswordHash(user: User, plain: string): Promise<void> {
  const p = getPool()
  const hash = bcrypt.hashSync(plain, 10)
  const nip = user.nip?.trim() || null
  const nisn = user.nisn?.trim() || null
  await p.execute(
    `INSERT INTO user_auth (user_id, password_hash, nip, nisn) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), nip = VALUES(nip), nisn = VALUES(nisn)`,
    [user.id, hash, nip, nisn],
  )
}

export async function ensureAuthRowsForUsers(users: User[]): Promise<void> {
  const p = getPool()
  const defaultFor = (u: User) => (u.role === 'siswa' ? 'siswa123' : 'demo1234')
  const ids = users.map((u) => u.id)
  if (ids.length === 0) return
  const placeholders = ids.map(() => '?').join(',')
  const [existingRows] = await p.query<RowDataPacket[]>(
    `SELECT user_id FROM user_auth WHERE user_id IN (${placeholders})`,
    ids,
  )
  const existing = new Set(existingRows.map((r) => String(r.user_id)))
  for (const u of users) {
    if (!existing.has(u.id)) {
      await upsertPasswordHash(u, defaultFor(u))
    }
  }
}

export async function pruneAuthUsers(validIds: Set<string>): Promise<void> {
  const p = getPool()
  const ids = [...validIds]
  if (ids.length === 0) return
  const placeholders = ids.map(() => '?').join(',')
  await p.execute(`DELETE FROM user_auth WHERE user_id NOT IN (${placeholders})`, ids)
}

export type CounselingSnapshot = {
  lastStatus: string | null
  lastSessionDate: string | null
  sessionCount: number
}

/** Ringkasan log konseling per siswa (untuk dashboard & wali) */
export async function getCounselingSnapshotsByStudentIds(
  studentIds: string[],
): Promise<Map<string, CounselingSnapshot>> {
  const map = new Map<string, CounselingSnapshot>()
  for (const id of studentIds) {
    map.set(id, { lastStatus: null, lastSessionDate: null, sessionCount: 0 })
  }
  if (studentIds.length === 0) return map
  const p = getPool()
  const ph = studentIds.map(() => '?').join(',')
  const [countRows] = await p.query<RowDataPacket[]>(
    `SELECT student_id, COUNT(*) AS c FROM counseling_logs WHERE student_id IN (${ph}) GROUP BY student_id`,
    studentIds,
  )
  for (const r of countRows) {
    const sid = String(r.student_id)
    const prev = map.get(sid)
    if (prev) prev.sessionCount = Number(r.c)
  }
  const [latestRows] = await p.query<RowDataPacket[]>(
    `SELECT t.student_id, t.status, t.session_date
     FROM (
       SELECT student_id, status, session_date,
         ROW_NUMBER() OVER (
           PARTITION BY student_id ORDER BY session_date DESC, session_no DESC, created_at DESC
         ) AS rn
       FROM counseling_logs
       WHERE student_id IN (${ph})
     ) t WHERE t.rn = 1`,
    studentIds,
  )
  for (const r of latestRows) {
    const sid = String(r.student_id)
    const prev = map.get(sid)
    if (prev) {
      prev.lastStatus = String(r.status)
      prev.lastSessionDate = r.session_date
        ? new Date(r.session_date).toISOString().slice(0, 10)
        : null
    }
  }
  return map
}

function mapCounselingRow(r: RowDataPacket) {
  return {
    id: String(r.id),
    studentId: String(r.student_id),
    counselorId: String(r.counselor_id),
    date: new Date(r.session_date).toISOString().slice(0, 10),
    sessionNo: Number(r.session_no),
    sessionType: String(r.session_type) as 'individu' | 'kelompok',
    analysis: String(r.analysis),
    actionPlan: String(r.action_plan),
    status: String(r.status) as 'perlu_penanganan' | 'sedang_dibimbing' | 'selesai',
    attachmentUrl: r.attachment_url ? String(r.attachment_url) : null,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listCounselingLogsForStudent(studentId: string) {
  const p = getPool()
  const [rows] = await p.query<RowDataPacket[]>(
    `SELECT id, student_id, counselor_id, session_date, session_no, session_type, analysis, action_plan, status, attachment_url, created_at
     FROM counseling_logs WHERE student_id = ?
     ORDER BY session_date DESC, session_no DESC, created_at DESC`,
    [studentId],
  )
  return rows.map(mapCounselingRow)
}

export async function getNextCounselingSessionNo(studentId: string): Promise<number> {
  const p = getPool()
  const [rows] = await p.query<RowDataPacket[]>(
    'SELECT COALESCE(MAX(session_no), 0) + 1 AS n FROM counseling_logs WHERE student_id = ?',
    [studentId],
  )
  return Number(rows[0]?.n ?? 1)
}

export async function insertCounselingLogRow(input: {
  studentId: string
  counselorId: string
  sessionDate: string
  sessionNo?: number
  sessionType: string
  analysis: string
  actionPlan: string
  status: string
  attachmentUrl: string | null
}) {
  const p = getPool()
  const id = randomUUID()
  const sessionNo =
    input.sessionNo !== undefined && input.sessionNo !== null
      ? Number(input.sessionNo)
      : await getNextCounselingSessionNo(input.studentId)
  await p.execute(
    `INSERT INTO counseling_logs
      (id, student_id, counselor_id, session_date, session_no, session_type, analysis, action_plan, status, attachment_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      id,
      input.studentId,
      input.counselorId,
      input.sessionDate.slice(0, 10),
      sessionNo,
      input.sessionType,
      input.analysis,
      input.actionPlan,
      input.status,
      input.attachmentUrl,
    ],
  )
  const [rows] = await p.query<RowDataPacket[]>(
    `SELECT id, student_id, counselor_id, session_date, session_no, session_type, analysis, action_plan, status, attachment_url, created_at
     FROM counseling_logs WHERE id = ? LIMIT 1`,
    [id],
  )
  return mapCounselingRow(rows[0])
}

export async function updateCounselingLogRow(
  logId: string,
  counselorId: string,
  patch: {
    sessionDate?: string
    sessionType?: string
    analysis?: string
    actionPlan?: string
    status?: string
    attachmentUrl?: string | null
  },
  opts?: { bypassCounselorCheck?: boolean },
): Promise<ReturnType<typeof mapCounselingRow> | null> {
  const p = getPool()
  const [check] = await p.query<RowDataPacket[]>(
    'SELECT counselor_id FROM counseling_logs WHERE id = ? LIMIT 1',
    [logId],
  )
  if (!check[0]) return null
  if (!opts?.bypassCounselorCheck && String(check[0].counselor_id) !== counselorId) return null
  const sets: string[] = []
  const vals: unknown[] = []
  if (patch.sessionDate !== undefined) {
    sets.push('session_date = ?')
    vals.push(patch.sessionDate.slice(0, 10))
  }
  if (patch.sessionType !== undefined) {
    sets.push('session_type = ?')
    vals.push(patch.sessionType)
  }
  if (patch.analysis !== undefined) {
    sets.push('analysis = ?')
    vals.push(patch.analysis)
  }
  if (patch.actionPlan !== undefined) {
    sets.push('action_plan = ?')
    vals.push(patch.actionPlan)
  }
  if (patch.status !== undefined) {
    sets.push('status = ?')
    vals.push(patch.status)
  }
  if (patch.attachmentUrl !== undefined) {
    sets.push('attachment_url = ?')
    vals.push(patch.attachmentUrl)
  }
  if (sets.length === 0) {
    const [rows] = await p.query<RowDataPacket[]>(
      `SELECT id, student_id, counselor_id, session_date, session_no, session_type, analysis, action_plan, status, attachment_url, created_at
       FROM counseling_logs WHERE id = ? LIMIT 1`,
      [logId],
    )
    return rows[0] ? mapCounselingRow(rows[0]) : null
  }
  vals.push(logId)
  await p.execute(`UPDATE counseling_logs SET ${sets.join(', ')} WHERE id = ?`, vals)
  const [rows] = await p.query<RowDataPacket[]>(
    `SELECT id, student_id, counselor_id, session_date, session_no, session_type, analysis, action_plan, status, attachment_url, created_at
     FROM counseling_logs WHERE id = ? LIMIT 1`,
    [logId],
  )
  return rows[0] ? mapCounselingRow(rows[0]) : null
}

export async function listSpRecordsForStudent(studentId: string) {
  const p = getPool()
  const [rows] = await p.query<RowDataPacket[]>(
    `SELECT id, student_id, sp_level, issue_date, file_url, issued_by_user_id, created_at
     FROM sp_records WHERE student_id = ? ORDER BY issue_date DESC, sp_level ASC`,
    [studentId],
  )
  return rows.map((r) => ({
    id: String(r.id),
    studentId: String(r.student_id),
    spLevel: String(r.sp_level) as 'SP1' | 'SP2' | 'SP3',
    issueDate: new Date(r.issue_date).toISOString().slice(0, 10),
    fileUrl: String(r.file_url),
    issuedByUserId: String(r.issued_by_user_id),
    createdAt: new Date(r.created_at).toISOString(),
  }))
}

export async function upsertSpRecordRow(input: {
  studentId: string
  spLevel: string
  issueDate: string
  fileUrl: string
  issuedByUserId: string
}) {
  const p = getPool()
  const id = randomUUID()
  await p.execute(
    `INSERT INTO sp_records (id, student_id, sp_level, issue_date, file_url, issued_by_user_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE issue_date = VALUES(issue_date), file_url = VALUES(file_url), issued_by_user_id = VALUES(issued_by_user_id)`,
    [id, input.studentId, input.spLevel, input.issueDate.slice(0, 10), input.fileUrl, input.issuedByUserId],
  )
  const [rows] = await p.query<RowDataPacket[]>(
    `SELECT id, student_id, sp_level, issue_date, file_url, issued_by_user_id, created_at
     FROM sp_records WHERE student_id = ? AND sp_level = ? LIMIT 1`,
    [input.studentId, input.spLevel],
  )
  const r = rows[0]
  if (!r) throw new Error('sp_records upsert failed')
  return {
    id: String(r.id),
    studentId: String(r.student_id),
    spLevel: String(r.sp_level) as 'SP1' | 'SP2' | 'SP3',
    issueDate: new Date(r.issue_date).toISOString().slice(0, 10),
    fileUrl: String(r.file_url),
    issuedByUserId: String(r.issued_by_user_id),
    createdAt: new Date(r.created_at).toISOString(),
  }
}
