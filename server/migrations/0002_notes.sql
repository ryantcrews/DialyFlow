ALTER TABLE visits ADD COLUMN note_type TEXT NOT NULL DEFAULT 'basic' CHECK (note_type IN ('comprehensive', 'basic'));
ALTER TABLE visits ADD COLUMN assessment TEXT NOT NULL DEFAULT '';
UPDATE visits SET note_type = 'comprehensive' WHERE monthly_note = 1;
