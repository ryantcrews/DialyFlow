-- Expand roles: clinician -> physician, add physician_assistant
-- Uses RENAME (DROP users fails under D1 FK enforcement)

CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'physician', 'physician_assistant')),
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO users_new (
  id, email, password_hash, salt, role, name, active,
  must_change_password, failed_login_count, locked_until, created_at
)
SELECT
  id, email, password_hash, salt,
  CASE WHEN role = 'clinician' THEN 'physician' ELSE role END,
  name, active, must_change_password, failed_login_count, locked_until, created_at
FROM users;

ALTER TABLE users RENAME TO users_old;
ALTER TABLE users_new RENAME TO users;
