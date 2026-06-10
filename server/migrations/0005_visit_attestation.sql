ALTER TABLE visits ADD COLUMN attested_at TEXT;
ALTER TABLE visits ADD COLUMN attested_by INTEGER REFERENCES users(id);

CREATE INDEX idx_visits_attested_at ON visits(attested_at);
CREATE INDEX idx_visits_visit_date ON visits(visit_date);
