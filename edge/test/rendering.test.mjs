import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderPageDocument, renderSection } from "../src/rendering.mjs";

const pageModel = {
  site: { slug: "lisa", name: "Lisa Croce · Psicologa clinica" },
  page: { slug: "home", title: "Lisa Croce | Psicologa clinica" },
  sections: [
    {
      sectionId: "hero",
      styleContract: "home.hero",
      enabled: true,
      data: {
        eyebrow: "Bolzano · Online",
        title: "Dare forma",
        emphasis: "a ciò che senti.",
        intro: "Uno spazio di ascolto.",
        primaryCta: { label: "Prenota", href: "mailto:lisa@example.com" },
        secondaryCta: { label: "Scopri", href: "#ascolto" },
        image: { src: "images/hero.jpeg", alt: "Il mare", decorative: false },
        symbolicText: ["Uno", "Due", "Tre", "Quattro"]
      }
    },
    {
      sectionId: "ascolto",
      styleContract: "home.about",
      enabled: true,
      data: { kicker: "Chi sono", title: "Un incontro", paragraphs: ["Primo", "Secondo"], note: "Nota" }
    },
    {
      sectionId: "metodo",
      styleContract: "home.approach_steps",
      enabled: true,
      data: { kicker: "Visione", title: "Metodo", items: [{ number: "01", text: "Ascoltare" }] }
    },
    {
      sectionId: "servizi",
      styleContract: "home.services",
      enabled: true,
      data: { kicker: "Servizi", title: "Aree", primaryApproach: "Junghiana", approaches: ["Ipnosi"], areas: ["Ansia"] }
    },
    {
      sectionId: "percorsi",
      styleContract: "home.audiences",
      enabled: true,
      data: { kicker: "Percorsi", title: "Spazi", intro: "Introduzione", items: [{ title: "Adulti", text: "Percorso" }] }
    },
    {
      sectionId: "contatti",
      styleContract: "home.contact",
      enabled: true,
      data: {
        kicker: "Contatti",
        title: "Parliamone",
        intro: "Scrivimi",
        image: { src: "images/contact-conversation-evanescent.jpg", alt: "Dialogo" },
        channels: [{ key: "email", label: "Email", value: "lisa@example.com", href: "mailto:lisa@example.com", enabled: true }]
      }
    }
  ]
};

test("ogni styleContract produce le classi del markup statico", () => {
  const expectedMarkers = new Map([
    ["home.hero", ["hero-grid", "art-board", "art-overlay"]],
    ["home.about", ["container split", "text-large", "quiet"]],
    ["home.approach_steps", ["manifesto", "manifesto-line"]],
    ["home.services", ["service-top", "technique-stage", "chips"]],
    ["home.audiences", ["audience-intro", "cards", "card reveal"]],
    ["home.contact", ["contact-box", "contact-art", "contact-links"]]
  ]);

  for (const section of pageModel.sections) {
    const html = renderSection(section);
    for (const marker of expectedMarkers.get(section.styleContract)) {
      assert.match(html, new RegExp(marker));
    }
  }
});

test("il renderer fa escaping di testo e attributi", () => {
  const section = structuredClone(pageModel.sections[1]);
  section.data.title = "<script>alert('x')</script>";
  const html = renderSection(section);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;/);
});

test("il documento conserva shell, CSS e script ma sostituisce il main con D1", async () => {
  const template = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  const html = renderPageDocument(pageModel, template);
  assert.match(html, /<style>/);
  assert.match(html, /<footer>/);
  assert.match(html, /<main id="top" data-content-source="d1">/);
  assert.match(html, /Dare forma/);
  assert.match(html, /const words = \["Junghiana","Ipnosi"\];/);
  assert.doesNotMatch(html, /Non un protocollo\. Un incontro\./);
});

test("le sezioni disabilitate non vengono renderizzate", () => {
  const disabled = structuredClone(pageModel);
  disabled.sections[1].enabled = false;
  const html = disabled.sections.filter((section) => section.enabled).map(renderSection).join("");
  assert.doesNotMatch(html, /Un incontro/);
});
