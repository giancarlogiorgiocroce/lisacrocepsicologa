ALTER TABLE page_sections ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE change_log ADD COLUMN page_id INTEGER REFERENCES pages(id) ON DELETE CASCADE;
ALTER TABLE change_log ADD COLUMN section_id INTEGER REFERENCES page_sections(id) ON DELETE CASCADE;
ALTER TABLE change_log ADD COLUMN path TEXT;
ALTER TABLE change_log ADD COLUMN section_version INTEGER;
ALTER TABLE change_log ADD COLUMN rollback_of_change_id INTEGER REFERENCES change_log(id) ON DELETE SET NULL;

ALTER TABLE section_revisions ADD COLUMN change_id INTEGER REFERENCES change_log(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_changes_page_section ON change_log(page_id, section_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_revisions_change ON section_revisions(change_id);

UPDATE page_sections
SET data_json = json_set(
      data_json,
      '$.title', 'Dare forma',
      '$.emphasis', 'a ciò che senti.'
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE style_contract = 'home.hero'
  AND json_extract(data_json, '$.title') = 'Dare forma a ciò che senti.';
