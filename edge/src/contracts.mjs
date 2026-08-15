export const SECTION_CONTRACTS = Object.freeze({
  "home.hero": {
    styleContract: "home.hero",
    editableFields: [
      { path: "eyebrow", kind: "plain_text", maxLength: 100, tool: "update_text" },
      { path: "title", kind: "plain_text", maxLength: 80, tool: "update_text" },
      { path: "emphasis", kind: "plain_text", maxLength: 100, tool: "update_text" },
      { path: "intro", kind: "plain_text", maxLength: 700, tool: "update_text" },
      { path: "primaryCta", kind: "link", tool: "update_cta" },
      { path: "secondaryCta", kind: "link", tool: "update_cta" },
      { path: "image.alt", kind: "plain_text", maxLength: 220, tool: "update_text" },
      { path: "symbolicText[]", kind: "plain_text", maxLength: 500, tool: "update_text" }
    ]
  },
  "home.about": {
    styleContract: "home.about",
    editableFields: [
      { path: "kicker", kind: "plain_text", maxLength: 60, tool: "update_text" },
      { path: "title", kind: "plain_text", maxLength: 140, tool: "update_text" },
      { path: "paragraphs[]", kind: "plain_text", maxLength: 900, tool: "update_text" },
      { path: "note", kind: "plain_text", maxLength: 1400, tool: "update_text" }
    ]
  },
  "home.approach_steps": {
    styleContract: "home.approach_steps",
    editableFields: [
      { path: "kicker", kind: "plain_text", maxLength: 60, tool: "update_text" },
      { path: "title", kind: "plain_text", maxLength: 140, tool: "update_text" },
      { path: "items[].text", kind: "plain_text", maxLength: 240, tool: "update_text" }
    ]
  },
  "home.services": {
    styleContract: "home.services",
    editableFields: [
      { path: "kicker", kind: "plain_text", maxLength: 60, tool: "update_text" },
      { path: "title", kind: "plain_text", maxLength: 120, tool: "update_text" },
      { path: "primaryApproach", kind: "plain_text", maxLength: 120, tool: "update_text" },
      { path: "approaches[]", kind: "plain_text", maxLength: 120, tool: "update_text" },
      { path: "areas[]", kind: "plain_text", maxLength: 160, tool: "update_text" }
    ]
  },
  "home.audiences": {
    styleContract: "home.audiences",
    editableFields: [
      { path: "kicker", kind: "plain_text", maxLength: 60, tool: "update_text" },
      { path: "title", kind: "plain_text", maxLength: 140, tool: "update_text" },
      { path: "intro", kind: "plain_text", maxLength: 700, tool: "update_text" },
      { path: "items[].title", kind: "plain_text", maxLength: 80, tool: "update_text" },
      { path: "items[].text", kind: "plain_text", maxLength: 700, tool: "update_text" }
    ]
  },
  "home.contact": {
    styleContract: "home.contact",
    editableFields: [
      { path: "kicker", kind: "plain_text", maxLength: 60, tool: "update_text" },
      { path: "title", kind: "plain_text", maxLength: 140, tool: "update_text" },
      { path: "intro", kind: "plain_text", maxLength: 700, tool: "update_text" },
      { path: "image.alt", kind: "plain_text", maxLength: 220, tool: "update_text" },
      { path: "channels[].label", kind: "plain_text", maxLength: 60, tool: "update_contact_channel" },
      { path: "channels[].value", kind: "plain_text", maxLength: 240, tool: "update_contact_channel" },
      { path: "channels[].href", kind: "link", tool: "update_contact_channel" },
      { path: "channels[].enabled", kind: "boolean", tool: "update_contact_channel" }
    ]
  }
});

export const SECTION_PRESETS = Object.freeze(
  Object.entries(SECTION_CONTRACTS).map(([id, contract]) => ({
    id,
    title: id,
    styleContract: contract.styleContract,
    addable: false,
    allowsHtml: false
  }))
);

export function contractFor(styleContract) {
  return SECTION_CONTRACTS[styleContract] ?? null;
}
