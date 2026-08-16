# Lisa Croce AI CMS — Worker MCP

Base locale e deployment Cloudflare del CMS conversazionale.

## Avvio

1. Copiare `.dev.vars.example` in `.dev.vars` e sostituire il token di esempio.
2. Installare le dipendenze con `npm install`.
3. Applicare le migrazioni locali con `npm run db:migrate:local`.
4. Avviare con `npm run dev`.

Endpoint locali:

- health: `http://localhost:8787/health`
- preview dinamica: `http://localhost:8787/preview`
- MCP Streamable HTTP: `http://localhost:8787/mcp`

Il client deve inviare `Authorization: Bearer <TOKEN>`. Il secret tecnico `AI_API_TOKEN` è limitato alla lettura; i token editor sono salvati in `auth_tokens` soltanto come hash SHA-256 e richiedono gli scope `content:read content:write`.

La versione applicativa è `0.2.3`, condivisa dall'handshake MCP e dalla risposta `/health`. Le dipendenze dirette sono fissate a versioni esatte nel manifest e nel lockfile per ottenere build riproducibili.

## Staging Cloudflare

- health: `https://lisacroce-mcp-staging.giancarlo-giorgio-croce.workers.dev/health`
- preview dinamica: `https://lisacroce-mcp-staging.giancarlo-giorgio-croce.workers.dev/preview`
- MCP Streamable HTTP: `https://lisacroce-mcp-staging.giancarlo-giorgio-croce.workers.dev/mcp`
- D1: `lisacroce-mcp-staging-db`
- R2: `lisacroce-mcp-staging-media-bucket`

Lo staging è stato pubblicato e verificato il 15 agosto 2026 con Worker `0.2.0` (versione Cloudflare `14943c9f-f1bf-431a-831a-28d0d5f5aa42`). La preview restituisce le sei sezioni da D1, le immagini statiche rispondono `200`, l'accesso MCP anonimo restituisce `401` e i test remoti di aggiornamento, protezione stale e rollback sono riusciti.

## Produzione

- sito canonico: `https://www.lisacroce.it/`
- preview dinamica non indicizzabile: `https://www.lisacroce.it/preview`
- health: `https://www.lisacroce.it/health`
- MCP Streamable HTTP: `https://www.lisacroce.it/mcp`

La produzione è stata pubblicata e verificata il 16 agosto 2026 con Worker `0.2.3` (versione Cloudflare `da887786-efa8-44cc-b069-d308bc89d06e`). La homepage viene renderizzata da D1, espone titolo, descrizione, canonical, metadati social e favicon coerenti, l'apice reindirizza al dominio canonico `www`, `/preview` invia `X-Robots-Tag: noindex, nofollow`, gli asset rispondono `200` e l'accesso MCP anonimo restituisce `401`.

`AI_API_TOKEN` è configurato come secret Cloudflare. I token editor usati negli smoke test sono stati generati solo in memoria, memorizzati in D1 come hash e rimossi al termine. Prima di configurare un client stabile, creare un token editor dedicato e custodirne il valore nel gestore segreti scelto.

## Tool MCP

- `get_page` — legge `lisa/home` con sezioni, contratti e versioni.
- `list_section_presets` — elenca i contratti noti, ancora non aggiungibili.
- `list_changes` — legge il change log della pagina.
- `update_text` — aggiorna un campo testuale contrattualizzato; richiede ruolo editor ed `expectedVersion`.
- `rollback_change` — ripristina una modifica; rifiuta rollback su una versione di sezione non più corrente.

Le scritture usano una transazione D1 batch con controllo di versione ottimistico. Ogni aggiornamento registra audit e revisione; contenuto HTML libero, path non contrattualizzati e protocolli URL non sicuri vengono rifiutati.

## Sicurezza HTTP

Il Worker applica centralmente gli header di sicurezza a risposte HTML, API, asset, redirect ed errori. La CSP usa un nonce crittografico diverso per ogni documento e autorizza soltanto i due blocchi inline fiduciari del template, senza `unsafe-inline` o `unsafe-eval`. Sono inoltre attivi HSTS, protezione anti-framing, MIME sniffing disabilitato, Referrer Policy, Permissions Policy, isolamento same-origin/same-site e `no-store` per JSON e stream MCP non già configurati.

La configurazione effettiva vive nel Worker perché Cloudflare non interpreta file `.htaccess`. Il file `robots.txt` può essere esteso dai Content Signals gestiti da Cloudflare; sitemap e URL canonici restano impostati su `https://www.lisacroce.it/`.

## Verifica

Da `edge/`:

- `npm test`
- `npx wrangler types --check`
- `npx wrangler deploy --dry-run --outdir dist`

## DNS

La zona `lisacroce.it` usa i nameserver Cloudflare. Due Worker Routes intercettano il dominio principale e `www.lisacroce.it`; l'apice e le richieste HTTP vengono reindirizzati in modo permanente verso `https://www.lisacroce.it`, preservando percorso e query string. `workers.dev` resta disponibile per verifiche e rollback.
