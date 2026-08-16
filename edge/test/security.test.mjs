import assert from "node:assert/strict";
import test from "node:test";
import {
  applyCspNonce,
  contentSecurityPolicy,
  createCspNonce,
  SECURITY_HEADER_VALUES,
  secureResponse
} from "../src/security.mjs";

test("la CSP usa un nonce crittografico sui soli blocchi fiduciari", () => {
  const firstNonce = createCspNonce();
  const secondNonce = createCspNonce();
  assert.match(firstNonce, /^[A-Za-z0-9+/]{22}==$/);
  assert.notEqual(firstNonce, secondNonce);

  const template = '<style nonce="__CSP_NONCE__"></style><script nonce="__CSP_NONCE__"></script>';
  const html = applyCspNonce(template, firstNonce);
  assert.equal(html.split(`nonce="${firstNonce}"`).length - 1, 2);

  const policy = contentSecurityPolicy(firstNonce);
  assert.ok(policy.includes(`script-src 'nonce-${firstNonce}' 'strict-dynamic'`));
  assert.ok(policy.includes(`style-src 'nonce-${firstNonce}'`));
  assert.doesNotMatch(policy, /unsafe-inline|unsafe-eval/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /object-src 'none'/);
});

test("gli header di sicurezza vengono applicati alle risposte HTML", async () => {
  const policy = contentSecurityPolicy("test-nonce");
  const response = secureResponse(new Response("<h1>ok</h1>", {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": policy
    }
  }));

  for (const [name, value] of Object.entries(SECURITY_HEADER_VALUES)) {
    assert.equal(response.headers.get(name), value);
  }
  assert.equal(response.headers.get("Content-Security-Policy"), policy);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(await response.text(), "<h1>ok</h1>");
});

test("le risposte API non vengono memorizzate e gli asset conservano la cache", () => {
  const api = secureResponse(Response.json({ ok: true }));
  assert.equal(api.headers.get("Cache-Control"), "no-store");
  assert.equal(api.headers.get("Content-Security-Policy"), null);

  const asset = secureResponse(new Response("asset", {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" }
  }));
  assert.equal(asset.headers.get("Cache-Control"), "public, max-age=3600");
});
