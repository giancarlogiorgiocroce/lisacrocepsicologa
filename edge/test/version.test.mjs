import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { APP_VERSION } from "../src/version.mjs";

test("la versione MCP coincide con package.json", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8")
  );

  assert.equal(APP_VERSION, packageJson.version);
});
