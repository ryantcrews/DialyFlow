CREATE TABLE shift_sessions (
  unit_id INTEGER NOT NULL REFERENCES units(id),
  shift TEXT NOT NULL CHECK (shift IN ('MWF AM', 'MWF PM', 'TTS AM', 'TTS PM')),
  session_date TEXT NOT NULL,
  visit_mode TEXT CHECK (visit_mode IN ('telemed', 'in_person')),
  visit_mode_set_by INTEGER REFERENCES users(id),
  visit_mode_set_at TEXT,
  PRIMARY KEY (unit_id, shift, session_date)
);
