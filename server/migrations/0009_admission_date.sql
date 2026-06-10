ALTER TABLE patients ADD COLUMN admission_date TEXT;

UPDATE patients SET admission_date = date(created_at) WHERE admission_date IS NULL;

CREATE INDEX idx_patients_admission_date ON patients(admission_date);
