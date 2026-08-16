import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("la configurazione pubblica dominio principale e www", async () => {
  const config = JSON.parse(
    await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8")
  );

  assert.deepEqual(config.routes, [
    { pattern: "lisacroce.it/*", zone_name: "lisacroce.it" },
    { pattern: "www.lisacroce.it/*", zone_name: "lisacroce.it" }
  ]);
});

test("la produzione usa www come host canonico e mantiene la preview noindex", async () => {
  const source = await readFile(new URL("../src/server.mjs", import.meta.url), "utf8");

  assert.match(source, /hostname === "www\.lisacroce\.it"/);
  assert.match(source, /hostname === "lisacroce\.it" \|\| hostname === "www\.lisacroce\.it"/);
  assert.match(source, /target\.hostname = "www\.lisacroce\.it"/);
  assert.match(source, /url\.protocol !== "https:"/);
  assert.match(source, /productionHost && url\.pathname === "\/"/);
  assert.match(source, /pageResponse\(request, env, \{ indexable: true \}\)/);
  assert.match(source, /pageResponse\(request, env, \{ indexable: false \}\)/);
  assert.match(source, /secureResponse\(await routeRequest/);
});
