ALTER TABLE visits ADD COLUMN visit_mode TEXT CHECK (visit_mode IN ('telemed', 'in_person'));
