const encoder = new TextEncoder();

async function digest(value) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(value))
  );
}

async function tokenHash(value) {
  const bytes = await digest(value);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function constantTimeEqual(left, right) {
  const [leftHash, rightHash] = await Promise.all([digest(left), digest(right)]);

  if (typeof crypto.subtle.timingSafeEqual === "function") {
    return crypto.subtle.timingSafeEqual(leftHash, rightHash);
  }

  // Node.js non espone ancora timingSafeEqual su SubtleCrypto: il fallback
  // mantiene i test locali eseguibili; Cloudflare Workers usa il metodo nativo.
  let difference = leftHash.length ^ rightHash.length;
  const length = Math.max(leftHash.length, rightHash.length);

  for (let index = 0; index < length; index += 1) {
    difference |= (leftHash[index] ?? 0) ^ (rightHash[index] ?? 0);
  }

  return difference === 0;
}

export async function authorizeTechnicalRead(request, expectedToken) {
  if (!expectedToken) {
    return { ok: false, status: 503, message: "AI_API_TOKEN non configurato" };
  }

  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match) {
    return { ok: false, status: 401, message: "Bearer token richiesto" };
  }

  if (!(await constantTimeEqual(match[1], expectedToken))) {
    return { ok: false, status: 401, message: "Bearer token non valido" };
  }

  return {
    ok: true,
    actor: "technical-smoke",
    role: "viewer",
    scopes: ["content:read"]
  };
}

function bearerToken(request) {
  const authorization = request.headers.get("authorization") ?? "";
  return /^Bearer\s+(.+)$/i.exec(authorization)?.[1] ?? null;
}

function parseScopes(value) {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.every((scope) => typeof scope === "string")) {
      return parsed;
    }
  } catch {
    // I token legacy possono usare scopes separati da spazi.
  }
  return value.split(/\s+/).filter(Boolean);
}

export async function authorizeMcpRequest(request, env) {
  const token = bearerToken(request);
  if (!token) {
    return { ok: false, status: 401, message: "Bearer token richiesto" };
  }

  if (env.AI_API_TOKEN && await constantTimeEqual(token, env.AI_API_TOKEN)) {
    return {
      ok: true,
      actor: "technical-smoke",
      role: "viewer",
      scopes: ["content:read"],
      siteSlug: null,
      channel: "technical"
    };
  }

  if (!env.DB) {
    return { ok: false, status: 503, message: "Database autenticazione non configurato" };
  }

  const hash = await tokenHash(token);
  const row = await env.DB.prepare(
    `SELECT at.actor, at.role, at.scopes, s.slug AS site_slug
     FROM auth_tokens at
     JOIN sites s ON s.id = at.site_id
     WHERE at.token_hash = ?1 AND at.status = 'active'
     LIMIT 1`
  ).bind(hash).first();

  if (!row) {
    return { ok: false, status: 401, message: "Bearer token non valido" };
  }

  const scopes = parseScopes(row.scopes);
  if (!scopes.includes("content:read")) {
    return { ok: false, status: 403, message: "Scope content:read richiesto" };
  }

  return {
    ok: true,
    actor: row.actor,
    role: row.role,
    scopes,
    siteSlug: row.site_slug,
    channel: "personal"
  };
}
