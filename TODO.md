# TODO

- [ ] Valutare un carosello con gli ultimi post Instagram, scegliendo una soluzione rispettosa della privacy, con fallback statico e senza rallentare il caricamento della pagina.

## AI CMS via MCP

### Base locale (senza DNS)

- [x] Inventariare i blocchi visibili della one-page corrente.
- [x] Assegnare `sectionId`, `type` e `styleContract` ai blocchi principali.
- [x] Creare lo scaffold Worker stateless con Streamable HTTP.
- [x] Preparare schema e seed D1 per il sito `lisa` e la pagina `home`.
- [x] Esporre i primi tool read-only `get_page` e `list_section_presets`.
- [x] Installare le dipendenze e verificare test, migrazioni locali e dry-run Wrangler.

### Contenuti e rendering

- [x] Integrare il renderer dinamico mantenendo invariati markup e CSS correnti.
- [x] Implementare `update_text`, revisioni e change log.
- [ ] Implementare CTA, contatti e liste itemizzate con tool specializzati.
- [x] Aggiungere rollback con protezione da stato stale.

### Media e autenticazione

- [ ] Implementare catalogo D1/R2 e `upload_image_file` direct-only.
- [x] Separare token tecnico read-only e token editor hashato in D1.
- [ ] Aggiungere OAuth/PKCE quando sarà definito il client MCP finale.

### Cloudflare e dominio

- [x] Pubblicare una prima versione su `*.workers.dev` per gli smoke MCP.
- [x] Creare e collegare le risorse Cloudflare remote D1/R2.
- [x] Applicare le migrazioni remote, configurare `AI_API_TOKEN` come secret e verificare gli endpoint protetti.
- [x] Acquistare `lisacroce.it` e spostarne i nameserver su Cloudflare.
- [x] Configurare le Worker Routes per `lisacroce.it` e `www.lisacroce.it` dopo l'attivazione DNS.
