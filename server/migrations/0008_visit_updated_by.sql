ALTER TABLE visits ADD COLUMN updated_by INTEGER REFERENCES users(id);

UPDATE visits SET updated_by = user_id WHERE updated_by IS NULL;
