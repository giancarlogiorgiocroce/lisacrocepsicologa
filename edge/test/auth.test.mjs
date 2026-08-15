import assert from "node:assert/strict";
import { test } from "node:test";
import { authorizeMcpRequest, authorizeTechnicalRead } from "../src/auth.mjs";

function request(authorization) {
  return new Request("http://localhost/mcp", {
    method: "POST",
    headers: authorization ? { authorization } : {}
  });
}

test("rifiuta configurazione priva di token", async () => {
  const result = await authorizeTechnicalRead(request(), "");
  assert.equal(result.ok, false);
  assert.equal(result.status, 503);
});

test("rifiuta token assente o errato", async () => {
  const missing = await authorizeTechnicalRead(request(), "secret");
  const wrong = await authorizeTechnicalRead(request("Bearer wrong"), "secret");
  assert.equal(missing.status, 401);
  assert.equal(wrong.status, 401);
});

test("il token tecnico ottiene solo content:read", async () => {
  const result = await authorizeTechnicalRead(request("Bearer secret"), "secret");
  assert.equal(result.ok, true);
  assert.deepEqual(result.scopes, ["content:read"]);
  assert.equal(result.role, "viewer");
});

test("un token personale attivo eredita sito e scope da D1", async () => {
  const db = {
    prepare() {
      return {
        bind() {
          return {
            async first() {
              return {
                actor: "lisa-editor",
                role: "editor",
                scopes: '["content:read","content:write"]',
                site_slug: "lisa"
              };
            }
          };
        }
      };
    }
  };
  const request = new Request("https://example.com/mcp", {
    headers: { authorization: "Bearer editor-token" }
  });
  const result = await authorizeMcpRequest(request, { AI_API_TOKEN: "technical-token", DB: db });
  assert.equal(result.ok, true);
  assert.equal(result.siteSlug, "lisa");
  assert.deepEqual(result.scopes, ["content:read", "content:write"]);
});

test("il token tecnico resta viewer anche quando esistono tool di scrittura", async () => {
  const request = new Request("https://example.com/mcp", {
    headers: { authorization: "Bearer technical-token" }
  });
  const result = await authorizeMcpRequest(request, { AI_API_TOKEN: "technical-token", DB: null });
  assert.equal(result.ok, true);
  assert.equal(result.role, "viewer");
  assert.deepEqual(result.scopes, ["content:read"]);
});
