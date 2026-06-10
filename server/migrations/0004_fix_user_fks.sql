-- After 0003_roles renamed users -> users_old, FKs still pointed at users_old.
-- Recreate affected tables so they reference users, then drop users_old.

PRAGMA foreign_keys=OFF;

CREATE TABLE sessions_new (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO sessions_new SELECT * FROM sessions;
DROP TABLE sessions;
ALTER TABLE sessions_new RENAME TO sessions;
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE visits_new (
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
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  note_type TEXT NOT NULL DEFAULT 'basic' CHECK (note_type IN ('comprehensive', 'basic')),
  assessment TEXT NOT NULL DEFAULT ''
);
INSERT INTO visits_new SELECT * FROM visits;
DROP TABLE visits;
ALTER TABLE visits_new RENAME TO visits;
CREATE INDEX idx_visits_patient_date ON visits(patient_id, visit_date);

CREATE TABLE audit_log_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO audit_log_new SELECT * FROM audit_log;
DROP TABLE audit_log;
ALTER TABLE audit_log_new RENAME TO audit_log;
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

CREATE TABLE assignment_history_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  unit_id INTEGER NOT NULL REFERENCES units(id),
  shift TEXT NOT NULL,
  effective_from TEXT NOT NULL DEFAULT (datetime('now')),
  changed_by INTEGER NOT NULL REFERENCES users(id)
);
INSERT INTO assignment_history_new SELECT * FROM assignment_history;
DROP TABLE assignment_history;
ALTER TABLE assignment_history_new RENAME TO assignment_history;

CREATE TABLE status_history_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  status TEXT NOT NULL,
  effective_from TEXT NOT NULL DEFAULT (datetime('now')),
  changed_by INTEGER NOT NULL REFERENCES users(id)
);
INSERT INTO status_history_new SELECT * FROM status_history;
DROP TABLE status_history;
ALTER TABLE status_history_new RENAME TO status_history;

DROP TABLE IF EXISTS users_old;

PRAGMA foreign_keys=ON;
