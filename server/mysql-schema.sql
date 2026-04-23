-- Skema e-smandel (disinkronkan dengan server/db.ts migrate()).
-- Jalankan manual jika perlu, atau biarkan API membuat tabel otomatis saat startup.

CREATE TABLE IF NOT EXISTS user_auth (
  user_id VARCHAR(64) NOT NULL PRIMARY KEY,
  password_hash VARCHAR(255) NOT NULL,
  nip VARCHAR(32) NULL,
  nisn VARCHAR(32) NULL,
  INDEX idx_user_auth_nip (nip),
  INDEX idx_user_auth_nisn (nisn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workspace (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  payload LONGTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS point_violations (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  points INT NOT NULL,
  category VARCHAR(16) NOT NULL,
  slug VARCHAR(128) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_point_violations_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS master_classes (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_master_classes_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wali_kelas_notes (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  teacher_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(64) NOT NULL,
  note LONGTEXT NOT NULL,
  updated_at DATETIME NOT NULL,
  db_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_wali_kelas_notes_teacher_student (teacher_id, student_id),
  INDEX idx_wali_kelas_notes_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  is_kokurikuler_coordinator TINYINT(1) NOT NULL DEFAULT 0,
  profile_photo_data_url LONGTEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_app_users_role (role),
  INDEX idx_app_users_nip (nip),
  INDEX idx_app_users_nisn (nisn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_students_user (user_id),
  INDEX idx_students_class (class_id),
  INDEX idx_students_points (total_points)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kokurikuler_project_students (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(191) NOT NULL,
  student_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_kokurikuler_project_student (project_id, student_id),
  INDEX idx_kokurikuler_project_students_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
