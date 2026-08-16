import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";
import siteTemplate from "../../index.html";
import contactImage from "../../images/contact-conversation-evanescent.jpg";
import heroImage from "../../images/hero.jpeg";
import { authorizeMcpRequest } from "./auth.mjs";
import { getPage } from "./content.mjs";
import { SECTION_PRESETS } from "./contracts.mjs";
import { listChanges, MutationError, rollbackChange, updateText } from "./mutations.mjs";
import { renderPageDocument } from "./rendering.mjs";
import { APP_VERSION } from "./version.mjs";

function textResult(payload) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload
  };
}

function errorResult(error) {
  const payload = {
    code: error instanceof MutationError ? error.code : "INTERNAL_ERROR",
    message: error instanceof Error ? error.message : "Errore sconosciuto"
  };
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
    isError: true
  };
}

function hasScope(auth, scope) {
  return auth.scopes.includes(scope);
}

function canAccessSite(auth, site) {
  return auth.siteSlug === null || auth.siteSlug === site;
}

function createServer(env, auth) {
  const server = new McpServer({
    name: "lisacroce-ai-cms",
    version: APP_VERSION
  });

  server.registerTool(
    "get_page",
    {
      title: "Leggi pagina",
      description: "Legge una pagina strutturata con sezioni, contratti e campi editabili. Usare sempre prima di una futura modifica.",
      inputSchema: {
        site: z.string().min(1).max(60),
        page: z.string().min(1).max(80)
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async ({ site, page }) => {
      if (!canAccessSite(auth, site)) {
        return errorResult(new MutationError("SITE_FORBIDDEN", "Il token non può accedere a questo sito"));
      }
      const result = await getPage(env.DB, site, page);
      if (!result) {
        return {
          content: [{ type: "text", text: `Pagina non trovata: ${site}/${page}` }],
          isError: true
        };
      }
      return textResult(result);
    }
  );

  server.registerTool(
    "list_section_presets",
    {
      title: "Elenca contratti sezione",
      description: "Elenca i contratti riconosciuti. In questa fase i blocchi sono leggibili ma non aggiungibili.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async () => textResult({ presets: SECTION_PRESETS })
  );

  server.registerTool(
    "list_changes",
    {
      title: "Elenca modifiche",
      description: "Legge le modifiche recenti, inclusi snapshot e versioni. Filtrabile per pagina e sezione.",
      inputSchema: {
        site: z.string().min(1).max(60),
        page: z.string().min(1).max(80).optional(),
        sectionId: z.string().min(1).max(80).optional(),
        limit: z.number().int().min(1).max(100).optional()
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => {
      if (!canAccessSite(auth, input.site)) {
        return errorResult(new MutationError("SITE_FORBIDDEN", "Il token non può accedere a questo sito"));
      }
      try {
        return textResult({ changes: await listChanges(env.DB, input) });
      } catch (error) {
        if (error instanceof MutationError) return errorResult(error);
        throw error;
      }
    }
  );

  if (hasScope(auth, "content:write")) {
    server.registerTool(
      "update_text",
      {
        title: "Aggiorna testo",
        description: "Aggiorna un campo plain_text già dichiarato dal contratto. Richiede la versione letta con get_page e crea revisione più change log.",
        inputSchema: {
          site: z.string().min(1).max(60),
          page: z.string().min(1).max(80),
          sectionId: z.string().min(1).max(80),
          path: z.string().min(1).max(160),
          value: z.string().min(1).max(1400),
          expectedVersion: z.number().int().positive()
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: false
        }
      },
      async (input) => {
        if (!canAccessSite(auth, input.site)) {
          return errorResult(new MutationError("SITE_FORBIDDEN", "Il token non può accedere a questo sito"));
        }
        try {
          return textResult(await updateText(env.DB, input, auth.actor));
        } catch (error) {
          if (error instanceof MutationError) return errorResult(error);
          throw error;
        }
      }
    );

    server.registerTool(
      "rollback_change",
      {
        title: "Annulla modifica",
        description: "Ripristina lo snapshot precedente soltanto se la sezione coincide ancora con lo stato prodotto dalla modifica indicata.",
        inputSchema: {
          site: z.string().min(1).max(60),
          changeId: z.number().int().positive()
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: false
        }
      },
      async (input) => {
        if (!canAccessSite(auth, input.site)) {
          return errorResult(new MutationError("SITE_FORBIDDEN", "Il token non può accedere a questo sito"));
        }
        try {
          return textResult(await rollbackChange(env.DB, input, auth.actor));
        } catch (error) {
          if (error instanceof MutationError) return errorResult(error);
          throw error;
        }
      }
    );
  }

  return server;
}

function jsonError(status, message) {
  return Response.json({ error: message }, { status });
}

const IMAGE_ASSETS = new Map([
  ["/images/hero.jpeg", { body: heroImage, contentType: "image/jpeg" }],
  ["/images/contact-conversation-evanescent.jpg", { body: contactImage, contentType: "image/jpeg" }]
]);

function imageResponse(request, asset) {
  return new Response(request.method === "HEAD" ? null : asset.body, {
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "public, max-age=3600"
    }
  });
}

function isProductionHost(hostname) {
  return hostname === "lisacroce.it";
}

function canonicalRedirect(url) {
  const target = new URL(url);
  target.protocol = "https:";
  target.hostname = "lisacroce.it";
  target.port = "";
  return Response.redirect(target, 308);
}

async function pageResponse(request, env, { indexable }) {
  const page = await getPage(env.DB, "lisa", "home");
  if (!page) return jsonError(404, "Pagina non disponibile");

  const html = renderPageDocument(page, siteTemplate);
  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  });
  if (!indexable) headers.set("X-Robots-Tag", "noindex, nofollow");

  return new Response(request.method === "HEAD" ? null : html, { headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const productionHost = isProductionHost(url.hostname);

    try {
      if (url.hostname === "www.lisacroce.it") {
        return canonicalRedirect(url);
      }

      if (url.pathname === "/health") {
        return Response.json({
          ok: true,
          service: "lisacroce-ai-cms",
          version: APP_VERSION,
          environment: productionHost ? "production" : "staging",
          transport: "streamable-http",
          dnsRequired: false
        });
      }

      if (productionHost && url.pathname === "/index.html") {
        return Response.redirect(new URL("/", url), 301);
      }

      if (productionHost && url.pathname === "/robots.txt") {
        return new Response("User-agent: *\nAllow: /\nSitemap: https://lisacroce.it/sitemap.xml\n", {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" }
        });
      }

      if (productionHost && url.pathname === "/sitemap.xml") {
        return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://lisacroce.it/</loc></url></urlset>\n', {
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" }
        });
      }

      if (productionHost && url.pathname === "/" && (request.method === "GET" || request.method === "HEAD")) {
        return pageResponse(request, env, { indexable: true });
      }

      if (url.pathname === "/preview/") {
        return Response.redirect(new URL("/preview", url), 301);
      }

      if (url.pathname === "/preview" && (request.method === "GET" || request.method === "HEAD")) {
        return pageResponse(request, env, { indexable: false });
      }

      const imageAsset = IMAGE_ASSETS.get(url.pathname);
      if (imageAsset && (request.method === "GET" || request.method === "HEAD")) {
        return imageResponse(request, imageAsset);
      }

      if (url.pathname !== "/mcp") {
        return jsonError(404, "Not found");
      }

      const auth = await authorizeMcpRequest(request, env);
      if (!auth.ok) {
        return jsonError(auth.status, auth.message);
      }

      const handler = createMcpHandler(() => createServer(env, auth), {
        route: "/mcp",
        responseMode: "auto",
        legacy: "stateless"
      });

      return await handler(request, env, ctx);
    } catch (error) {
      console.error(JSON.stringify({
        event: "request_failed",
        path: url.pathname,
        method: request.method,
        error: error instanceof Error ? error.message : "Unknown error"
      }));
      return jsonError(500, "Internal server error");
    }
  }
};
