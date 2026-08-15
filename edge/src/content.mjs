import { contractFor } from "./contracts.mjs";

function parseData(value) {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("Contenuto D1 non valido: data_json non è JSON");
  }
}

export async function getPage(db, siteSlug, pageSlug) {
  const page = await db
    .prepare(
      `SELECT p.id, p.slug, p.title, p.status, s.slug AS site_slug, s.name AS site_name
       FROM pages p
       JOIN sites s ON s.id = p.site_id
       WHERE s.slug = ?1 AND p.slug = ?2 AND s.status = 'active' AND p.status = 'published'`
    )
    .bind(siteSlug, pageSlug)
    .first();

  if (!page) return null;

  const { results } = await db
    .prepare(
      `SELECT section_key, type, style_contract, section_order, enabled, data_json, version, updated_at
       FROM page_sections
       WHERE page_id = ?1
       ORDER BY section_order ASC, id ASC`
    )
    .bind(page.id)
    .all();

  return {
    site: {
      slug: page.site_slug,
      name: page.site_name
    },
    page: {
      slug: page.slug,
      title: page.title,
      status: page.status
    },
    sections: results.map((section) => ({
      sectionId: section.section_key,
      type: section.type,
      styleContract: section.style_contract,
      order: section.section_order,
      enabled: Boolean(section.enabled),
      version: section.version,
      updatedAt: section.updated_at,
      data: parseData(section.data_json),
      editableFields: contractFor(section.style_contract)?.editableFields ?? []
    }))
  };
}
