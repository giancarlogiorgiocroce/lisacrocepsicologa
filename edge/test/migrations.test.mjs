import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const initUrl = new URL("../migrations/0001_init.sql", import.meta.url);
const seedUrl = new URL("../migrations/0002_seed_lisa_home.sql", import.meta.url);

test("la migrazione iniziale contiene dati, audit, auth e media", async () => {
  const sql = await readFile(initUrl, "utf8");
  for (const table of [
    "sites",
    "pages",
    "page_sections",
    "section_revisions",
    "change_log",
    "auth_tokens",
    "media_assets",
    "media_usages"
  ]) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`));
  }
});

test("il seed contiene i sei sectionId del sito corrente", async () => {
  const sql = await readFile(seedUrl, "utf8");
  for (const sectionId of ["hero", "ascolto", "metodo", "servizi", "percorsi", "contatti"]) {
    assert.match(sql, new RegExp(`'${sectionId}'`));
  }
});

test("la migrazione contenuti aggiunge versioni e riferimenti audit", async () => {
  const sql = await readFile(new URL("../migrations/0003_content_versions.sql", import.meta.url), "utf8");
  assert.match(sql, /ALTER TABLE page_sections ADD COLUMN version/i);
  assert.match(sql, /ALTER TABLE change_log ADD COLUMN section_id/i);
  assert.match(sql, /ALTER TABLE section_revisions ADD COLUMN change_id/i);
  assert.match(sql, /rollback_of_change_id/i);
});
