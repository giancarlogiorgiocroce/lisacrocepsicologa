function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeHref(value) {
  const href = String(value ?? "").trim();
  if (/^#[A-Za-z][A-Za-z0-9_-]*$/.test(href)) return href;
  if (/^(?:mailto:|tel:)[^\u0000-\u001f<>]+$/i.test(href)) return href;
  if (/^https:\/\/[^\s<>]+$/i.test(href)) return href;
  if (/^\/(?!\/)(?!.*\.\.)(?:[^\s<>]*)$/.test(href)) return href;
  return "#";
}

function safeImageSource(value) {
  const source = String(value ?? "").trim();
  if (/^images\/[A-Za-z0-9._/-]+$/.test(source) && !source.includes("..")) {
    return source;
  }
  if (/^https:\/\/[^\s<>]+$/i.test(source)) return source;
  return "";
}

function sectionId(section) {
  return escapeHtml(section.sectionId);
}

function renderHero(section) {
  const data = section.data;
  const symbolicText = Array.isArray(data.symbolicText) ? data.symbolicText : [];
  const overlay = symbolicText.map((text, index) => {
    const className = index === symbolicText.length - 1 ? ' class="overlay-closing"' : "";
    return `<p${className}>${escapeHtml(text)}</p>`;
  }).join("\n            ");

  return `    <section class="hero" data-section-id="${sectionId(section)}">
      <div class="container hero-grid">
        <div class="reveal">
          <div class="small-label">${escapeHtml(data.eyebrow)}</div>
          <h1>${escapeHtml(data.title)} <em>${escapeHtml(data.emphasis)}</em></h1>
          <p class="lead">${escapeHtml(data.intro)}</p>
          <div class="hero-actions">
            <a class="button dark" href="${escapeHtml(safeHref(data.primaryCta?.href))}">${escapeHtml(data.primaryCta?.label)}</a>
            <a class="button" href="${escapeHtml(safeHref(data.secondaryCta?.href))}">${escapeHtml(data.secondaryCta?.label)}</a>
          </div>
        </div>

        <figure class="art-board reveal" tabindex="0">
          <img class="hero-photo" src="${escapeHtml(safeImageSource(data.image?.src))}" alt="${escapeHtml(data.image?.alt)}" />
          <div class="image-cue" aria-hidden="true">
            <span>Il mare e l’inconscio</span>
            <span>Scopri il significato ↗</span>
          </div>
          <figcaption class="art-overlay">
            ${overlay}
          </figcaption>
        </figure>
      </div>
    </section>`;
}

function renderAbout(section) {
  const data = section.data;
  const paragraphs = (Array.isArray(data.paragraphs) ? data.paragraphs : [])
    .map((paragraph) => `<p class="text-large">${escapeHtml(paragraph)}</p>`)
    .join("\n          ");

  return `    <section id="${sectionId(section)}" data-section-id="${sectionId(section)}">
      <div class="container split">
        <div class="section-title reveal">
          <div class="kicker">${escapeHtml(data.kicker)}</div>
          <h2>${escapeHtml(data.title)}</h2>
        </div>
        <div class="reveal">
          ${paragraphs}
          <div class="rule"></div>
          <p class="quiet">${escapeHtml(data.note)}</p>
        </div>
      </div>
    </section>`;
}

function renderApproachSteps(section) {
  const data = section.data;
  const items = (Array.isArray(data.items) ? data.items : [])
    .map((item) => `<div class="manifesto-line"><span>${escapeHtml(item.number)}</span><p>${escapeHtml(item.text)}</p></div>`)
    .join("\n          ");

  return `    <section id="${sectionId(section)}" data-section-id="${sectionId(section)}">
      <div class="container split">
        <div class="section-title reveal">
          <div class="kicker">${escapeHtml(data.kicker)}</div>
          <h2>${escapeHtml(data.title)}</h2>
        </div>
        <div class="manifesto reveal">
          ${items}
        </div>
      </div>
    </section>`;
}

function renderServices(section) {
  const data = section.data;
  const approaches = Array.isArray(data.approaches) ? data.approaches : [];
  const areas = (Array.isArray(data.areas) ? data.areas : [])
    .map((area) => `<span class="chip">${escapeHtml(area)}</span>`)
    .join("\n          ");

  return `    <section id="${sectionId(section)}" class="services" data-section-id="${sectionId(section)}">
      <div class="container">
        <div class="service-top">
          <div class="reveal">
            <div class="kicker">${escapeHtml(data.kicker)}</div>
            <h2>${escapeHtml(data.title)}</h2>
          </div>
          <div class="technique-stage reveal">
            <small>Approcci e strumenti</small>
            <div class="technique-word" id="techniqueWord">${escapeHtml(data.primaryApproach)}</div>
            <p>${escapeHtml(approaches.join(" · "))}</p>
          </div>
        </div>
        <div class="chips reveal" aria-label="Aree di intervento">
          ${areas}
        </div>
      </div>
    </section>`;
}

function renderAudiences(section) {
  const data = section.data;
  const cards = (Array.isArray(data.items) ? data.items : [])
    .map((item) => `<article class="card reveal"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`)
    .join("\n          ");

  return `    <section class="audiences" data-section-id="${sectionId(section)}">
      <div class="container">
        <div class="audience-intro reveal">
          <div><div class="kicker">${escapeHtml(data.kicker)}</div><h2>${escapeHtml(data.title)}</h2></div>
          <p>${escapeHtml(data.intro)}</p>
        </div>
        <div class="cards">
          ${cards}
        </div>
      </div>
    </section>`;
}

function contactAriaLabel(channel) {
  if (channel.key === "email") return "Scrivi un’email a Lisa Croce";
  if (channel.key === "telefono") return "Telefona a Lisa Croce";
  if (channel.key === "instagram") return "Apri Instagram di Lisa Croce";
  return `Apri ${channel.label ?? "contatto"}`;
}

function renderContact(section) {
  const data = section.data;
  const channels = (Array.isArray(data.channels) ? data.channels : [])
    .filter((channel) => channel.enabled)
    .map((channel) => {
      const href = safeHref(channel.href);
      const external = href.startsWith("https://") ? ' target="_blank" rel="noopener"' : "";
      return `<a href="${escapeHtml(href)}"${external} aria-label="${escapeHtml(contactAriaLabel(channel))}"><span class="contact-link-label">${escapeHtml(channel.label)}</span><span class="contact-arrow" aria-hidden="true">→</span></a>`;
    })
    .join("\n          ");

  return `    <section id="${sectionId(section)}" class="contact" data-section-id="${sectionId(section)}">
      <div class="container contact-box reveal">
        <div>
          <div class="kicker">${escapeHtml(data.kicker)}</div>
          <h2>${escapeHtml(data.title)}</h2>
          <p class="lead">${escapeHtml(data.intro)}</p>
        </div>
        <div class="contact-art"><img src="${escapeHtml(safeImageSource(data.image?.src))}" alt="${escapeHtml(data.image?.alt)}" /></div>
        <div class="contact-links">
          ${channels}
        </div>
      </div>
    </section>`;
}

const RENDERERS = Object.freeze({
  "home.hero": renderHero,
  "home.about": renderAbout,
  "home.approach_steps": renderApproachSteps,
  "home.services": renderServices,
  "home.audiences": renderAudiences,
  "home.contact": renderContact
});

export function renderSection(section) {
  const renderer = RENDERERS[section.styleContract];
  if (!renderer) {
    throw new Error(`Renderer mancante per ${section.styleContract}`);
  }
  return renderer(section);
}

function scriptJson(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

export function renderPageDocument(pageModel, template) {
  const enabledSections = pageModel.sections.filter((section) => section.enabled);
  const main = `<main id="top" data-content-source="d1">\n${enabledSections.map(renderSection).join("\n\n")}\n  </main>`;
  const service = enabledSections.find((section) => section.styleContract === "home.services");
  const techniques = service
    ? [service.data.primaryApproach, ...(Array.isArray(service.data.approaches) ? service.data.approaches : [])].filter(Boolean)
    : [];

  const withMain = template.replace(/<main id="top">[\s\S]*?<\/main>/, main);
  if (withMain === template) throw new Error("Template privo di <main id=\"top\">");

  return withMain
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(pageModel.page.title)}</title>`)
    .replace(/const words = \[[\s\S]*?\];/, `const words = ${scriptJson(techniques)};`);
}
