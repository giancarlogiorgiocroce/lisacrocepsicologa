import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);

test("la homepage espone metadati SEO e social coerenti", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const title = "Lisa Croce | Psicologa clinica a Bolzano e online";
  const description = "Lisa Croce, psicologa clinica a Bolzano e online. Percorsi personalizzati per adolescenti e adulti nei momenti di difficoltà, crisi e cambiamento.";

  assert.ok(html.includes(`<title>${title}</title>`));
  assert.ok(html.includes(`<meta name="description" content="${description}"`));
  assert.match(html, /<link rel="canonical" href="https:\/\/lisacroce\.it\/"/);
  assert.match(html, /<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml" sizes="any"/);
  assert.match(html, /<meta property="og:title"/);
  assert.match(html, /<meta property="og:description"/);
  assert.match(html, /<meta property="og:url" content="https:\/\/lisacroce\.it\/"/);
});

test("favicon e titolo dinamico vengono inclusi nel Worker", async () => {
  const [favicon, server, migration] = await Promise.all([
    readFile(new URL("favicon.svg", root), "utf8"),
    readFile(new URL("edge/src/server.mjs", root), "utf8"),
    readFile(new URL("edge/migrations/0004_seo_metadata.sql", root), "utf8")
  ]);

  assert.match(favicon, /viewBox="0 0 64 64"/);
  assert.match(server, /"\/favicon\.svg"/);
  assert.match(server, /image\/svg\+xml/);
  assert.match(migration, /Psicologa clinica a Bolzano e online/);
});
