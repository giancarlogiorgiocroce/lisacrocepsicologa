import { contractFor } from "./contracts.mjs";

const SAFE_PATH = /^[A-Za-z][A-Za-z0-9]*(?:(?:\.[A-Za-z][A-Za-z0-9]*)|(?:\[\d+\]))*$/;
const FORBIDDEN_SEGMENTS = new Set(["__proto__", "prototype", "constructor"]);

export class MutationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "MutationError";
    this.code = code;
  }
}

function concreteTokens(path) {
  if (!SAFE_PATH.test(path)) {
    throw new MutationError("INVALID_PATH", "Il path richiesto non è valido");
  }
  const tokens = path.replaceAll("[", ".").replaceAll("]", "").split(".");
  if (tokens.some((token) => FORBIDDEN_SEGMENTS.has(token))) {
    throw new MutationError("INVALID_PATH", "Il path richiesto non è sicuro");
  }
  return tokens.map((token) => /^\d+$/.test(token) ? Number(token) : token);
}

function contractPath(path) {
  return path.replace(/\[\d+\]/g, "[]");
}

function validateTextValue(value, maxLength) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new MutationError("INVALID_VALUE", "Il valore deve essere testo non vuoto");
  }
  if (/[\u0000]/.test(value)) {
    throw new MutationError("INVALID_VALUE", "Il testo contiene caratteri non validi");
  }
  if (/<\s*\/?\s*[A-Za-z][^>]*>/.test(value)) {
    throw new MutationError("HTML_FORBIDDEN", "HTML non consentito nei campi di testo");
  }
  if (value.length > maxLength) {
    throw new MutationError("VALUE_TOO_LONG", `Il valore supera il limite di ${maxLength} caratteri`);
  }
}

function setExistingValue(data, tokens, value) {
  const clone = JSON.parse(JSON.stringify(data));
  let cursor = clone;

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const token = tokens[index];
    if ((typeof token === "number" && !Array.isArray(cursor)) || !Object.hasOwn(cursor, token)) {
      throw new MutationError("PATH_NOT_FOUND", "Il path richiesto non esiste nei dati della sezione");
    }
    cursor = cursor[token];
    if (cursor === null || typeof cursor !== "object") {
      throw new MutationError("PATH_NOT_FOUND", "Il path richiesto non esiste nei dati della sezione");
    }
  }

  const lastToken = tokens.at(-1);
  if ((typeof lastToken === "number" && !Array.isArray(cursor)) || !Object.hasOwn(cursor, lastToken)) {
    throw new MutationError("PATH_NOT_FOUND", "Il path richiesto non esiste nei dati della sezione");
  }
  const previousValue = cursor[lastToken];
  if (typeof previousValue !== "string") {
    throw new MutationError("TYPE_MISMATCH", "Il campo richiesto non contiene testo semplice");
  }
  cursor[lastToken] = value;
  return { clone, previousValue };
}

export function buildTextMutation(data, styleContract, path, value) {
  const tokens = concreteTokens(path);
  const contract = contractFor(styleContract);
  const field = contract?.editableFields.find((candidate) => candidate.path === contractPath(path));
  if (!field) {
    throw new MutationError("FIELD_NOT_EDITABLE", `Il campo ${path} non è modificabile per ${styleContract}`);
  }
  if (field.tool !== "update_text") {
    throw new MutationError("WRONG_TOOL", `Il campo ${path} richiede il tool ${field.tool}`);
  }
  if (field.kind !== "plain_text") {
    throw new MutationError("WRONG_FIELD_KIND", `Il campo ${path} non è plain_text`);
  }

  validateTextValue(value, field.maxLength);
  const { clone, previousValue } = setExistingValue(data, tokens, value);
  return { before: JSON.parse(JSON.stringify(data)), after: clone, previousValue, field };
}

async function findSection(db, { site, page, sectionId }) {
  return await db.prepare(
    `SELECT ps.id, ps.data_json, ps.style_contract, ps.version, ps.updated_at,
            p.id AS page_id, p.slug AS page_slug, s.id AS site_id, s.slug AS site_slug
     FROM page_sections ps
     JOIN pages p ON p.id = ps.page_id
     JOIN sites s ON s.id = p.site_id
     WHERE s.slug = ?1 AND p.slug = ?2 AND ps.section_key = ?3
       AND s.status = 'active' AND p.status IN ('draft', 'published')`
  ).bind(site, page, sectionId).first();
}

function parseJson(value, label) {
  try {
    return JSON.parse(value);
  } catch {
    throw new MutationError("INVALID_STORED_JSON", `${label} non contiene JSON valido`);
  }
}

function mutationGuard(db, sectionId, version, dataJson) {
  return db.prepare(
    `SELECT CASE
       WHEN EXISTS (
         SELECT 1 FROM page_sections
         WHERE id = ?1 AND version = ?2 AND data_json = ?3
       ) THEN 1
       ELSE json_extract('stale mutation guard', '$')
     END AS mutation_guard`
  ).bind(sectionId, version, dataJson);
}

async function runMutationBatch(db, section, mutation) {
  try {
    return await db.batch([
      mutationGuard(db, section.id, section.version, mutation.beforeJson),
      db.prepare(
        `UPDATE page_sections
         SET data_json = ?1, version = version + 1,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?2`
      ).bind(mutation.afterJson, section.id),
      db.prepare(
        `INSERT INTO change_log (
           site_id, page_id, section_id, actor, action, target, path,
           before_json, after_json, section_version, rollback_of_change_id
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
      ).bind(
        section.site_id,
        section.page_id,
        section.id,
        mutation.actor,
        mutation.action,
        mutation.target,
        mutation.path,
        mutation.beforeJson,
        mutation.afterJson,
        section.version + 1,
        mutation.rollbackOfChangeId ?? null
      ),
      db.prepare(
        `INSERT INTO section_revisions (
           section_id, change_id, actor, action, before_json, after_json
         ) VALUES (?1, last_insert_rowid(), ?2, ?3, ?4, ?5)`
      ).bind(section.id, mutation.actor, mutation.action, mutation.beforeJson, mutation.afterJson)
    ]);
  } catch (error) {
    const current = await db.prepare("SELECT version, data_json FROM page_sections WHERE id = ?1")
      .bind(section.id)
      .first();
    if (!current || current.version !== section.version || current.data_json !== mutation.beforeJson) {
      throw new MutationError("STALE_VERSION", "La sezione è cambiata: rileggere get_page prima di modificare");
    }
    throw error;
  }
}

export async function updateText(db, input, actor) {
  const section = await findSection(db, input);
  if (!section) throw new MutationError("SECTION_NOT_FOUND", "Sezione non trovata");
  if (section.version !== input.expectedVersion) {
    throw new MutationError("STALE_VERSION", "Versione obsoleta: rileggere get_page prima di modificare");
  }

  const before = parseJson(section.data_json, "data_json");
  const planned = buildTextMutation(before, section.style_contract, input.path, input.value);
  const afterJson = JSON.stringify(planned.after);
  const results = await runMutationBatch(db, section, {
    actor,
    action: "update_text",
    target: `${input.site}/${input.page}/${input.sectionId}/${input.path}`,
    path: input.path,
    beforeJson: section.data_json,
    afterJson
  });

  return {
    changeId: results[2].meta.last_row_id,
    site: input.site,
    page: input.page,
    sectionId: input.sectionId,
    path: input.path,
    previousValue: planned.previousValue,
    value: input.value,
    version: section.version + 1
  };
}

export async function listChanges(db, input) {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
  const { results } = await db.prepare(
    `SELECT cl.id, cl.actor, cl.action, cl.target, cl.path, cl.before_json,
            cl.after_json, cl.section_version, cl.rollback_of_change_id,
            cl.created_at, p.slug AS page_slug, ps.section_key
     FROM change_log cl
     JOIN sites s ON s.id = cl.site_id
     LEFT JOIN pages p ON p.id = cl.page_id
     LEFT JOIN page_sections ps ON ps.id = cl.section_id
     WHERE s.slug = ?1
       AND (?2 IS NULL OR p.slug = ?2)
       AND (?3 IS NULL OR ps.section_key = ?3)
     ORDER BY cl.id DESC
     LIMIT ?4`
  ).bind(input.site, input.page ?? null, input.sectionId ?? null, limit).all();

  return results.map((row) => ({
    changeId: row.id,
    actor: row.actor,
    action: row.action,
    target: row.target,
    path: row.path,
    page: row.page_slug,
    sectionId: row.section_key,
    before: row.before_json == null ? null : parseJson(row.before_json, "before_json"),
    after: row.after_json == null ? null : parseJson(row.after_json, "after_json"),
    sectionVersion: row.section_version,
    rollbackOfChangeId: row.rollback_of_change_id,
    createdAt: row.created_at
  }));
}

export async function rollbackChange(db, input, actor) {
  const change = await db.prepare(
    `SELECT cl.*, p.slug AS page_slug, ps.section_key, ps.data_json, ps.version,
            ps.id AS current_section_id, p.id AS current_page_id, s.id AS current_site_id
     FROM change_log cl
     JOIN sites s ON s.id = cl.site_id
     JOIN pages p ON p.id = cl.page_id
     JOIN page_sections ps ON ps.id = cl.section_id
     WHERE s.slug = ?1 AND cl.id = ?2`
  ).bind(input.site, input.changeId).first();

  if (!change || change.before_json == null || change.after_json == null) {
    throw new MutationError("CHANGE_NOT_FOUND", "Modifica reversibile non trovata");
  }
  if (change.data_json !== change.after_json || change.version !== change.section_version) {
    throw new MutationError("STALE_ROLLBACK", "Rollback bloccato: la sezione contiene modifiche successive");
  }

  const section = {
    id: change.current_section_id,
    site_id: change.current_site_id,
    page_id: change.current_page_id,
    version: change.version
  };
  const results = await runMutationBatch(db, section, {
    actor,
    action: "rollback_change",
    target: `${input.site}/${change.page_slug}/${change.section_key}/rollback/${change.id}`,
    path: change.path,
    beforeJson: change.data_json,
    afterJson: change.before_json,
    rollbackOfChangeId: change.id
  });

  return {
    changeId: results[2].meta.last_row_id,
    rolledBackChangeId: change.id,
    site: input.site,
    page: change.page_slug,
    sectionId: change.section_key,
    version: change.version + 1
  };
}
