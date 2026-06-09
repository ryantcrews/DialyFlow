-- Users and auth
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'clinician')),
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Units and patients
CREATE TABLE units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob TEXT NOT NULL,
  sticky_note TEXT NOT NULL DEFAULT '',
  unit_id INTEGER NOT NULL REFERENCES units(id),
  shift TEXT NOT NULL CHECK (shift IN ('MWF AM', 'MWF PM', 'TTS AM', 'TTS PM')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hospitalized', 'discharged', 'transferred', 'deceased')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_patients_unit_shift ON patients(unit_id, shift);
CREATE INDEX idx_patients_status ON patients(status);
CREATE UNIQUE INDEX idx_patients_unit_identity ON patients(unit_id, lower(first_name), lower(last_name), dob) WHERE active = 1;

CREATE TABLE assignment_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  unit_id INTEGER NOT NULL REFERENCES units(id),
  shift TEXT NOT NULL,
  effective_from TEXT NOT NULL DEFAULT (datetime('now')),
  changed_by INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  status TEXT NOT NULL,
  effective_from TEXT NOT NULL DEFAULT (datetime('now')),
  changed_by INTEGER NOT NULL REFERENCES users(id)
);

-- Visits and audit
CREATE TABLE visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  visit_date TEXT NOT NULL,
  seen_on_hd INTEGER NOT NULL DEFAULT 0,
  monthly_note INTEGER NOT NULL DEFAULT 0,
  cipa INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  visit_logged INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_visits_patient_date ON visits(patient_id, visit_date);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
