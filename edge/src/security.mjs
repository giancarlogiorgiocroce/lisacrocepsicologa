const CSP_NONCE_ATTRIBUTE = 'nonce="__CSP_NONCE__"';

export function createCspNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function applyCspNonce(html, nonce) {
  const markerCount = html.split(CSP_NONCE_ATTRIBUTE).length - 1;
  if (markerCount !== 2) {
    throw new Error(`Attesi 2 marker CSP nel template, trovati ${markerCount}`);
  }
  return html.replaceAll(CSP_NONCE_ATTRIBUTE, `nonce="${nonce}"`);
}

export function contentSecurityPolicy(nonce) {
  return [
    "default-src 'none'",
    "base-uri 'none'",
    "connect-src 'self'",
    "font-src 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "img-src 'self' data:",
    "manifest-src 'self'",
    "media-src 'none'",
    "object-src 'none'",
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
    "script-src-attr 'none'",
    `style-src 'nonce-${nonce}'`,
    "style-src-attr 'none'",
    "upgrade-insecure-requests",
    "worker-src 'none'"
  ].join("; ");
}

export const SECURITY_HEADER_VALUES = Object.freeze({
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site",
  "Origin-Agent-Cluster": "?1",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-DNS-Prefetch-Control": "off",
  "X-Frame-Options": "DENY",
  "X-Permitted-Cross-Domain-Policies": "none",
  "X-XSS-Protection": "0"
});

export function secureResponse(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADER_VALUES)) {
    headers.set(name, value);
  }

  const contentType = headers.get("Content-Type") ?? "";
  if (contentType.toLowerCase().startsWith("text/html") && !headers.has("Content-Security-Policy")) {
    throw new Error("Risposta HTML priva di Content-Security-Policy");
  }
  if (!headers.has("Cache-Control") && /^(application\/json|text\/event-stream)\b/i.test(contentType)) {
    headers.set("Cache-Control", "no-store");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
