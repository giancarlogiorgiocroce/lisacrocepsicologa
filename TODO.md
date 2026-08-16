# TODO

## Carosello Instagram

Riferimento: [`docs/INSTAGRAM_INTEGRATION.md`](docs/INSTAGRAM_INTEGRATION.md).

### Prerequisiti Meta

- [ ] Confermare che `@dott.ssa.lisa.croce.psicologa` sia un account Professionale Business o Creator.
- [ ] Creare o selezionare l'app Meta Business, aggiungere il prodotto Instagram e assegnare i ruoli corretti all'account di Lisa.
- [ ] Configurare Instagram API with Instagram Login e verificare che Standard Access sia sufficiente per il solo account proprietario.
- [ ] Richiedere esclusivamente `instagram_business_basic`; non richiedere permessi di pubblicazione, commenti o messaggi.
- [ ] Registrare le redirect URI necessarie al login e completare l'autorizzazione dell'account.
- [ ] Ottenere Instagram User ID e token, annotarne la scadenza e verificare una chiamata `/media` con la versione Graph scelta.

### Worker e dati

- [ ] Configurare `INSTAGRAM_ACCESS_TOKEN` come secret Cloudflare e ID/versione API come variabili non segrete.
- [ ] Creare un client Instagram isolato con timeout, convalida della risposta e campi richiesti fissi.
- [ ] Normalizzare `IMAGE`, `VIDEO` e `CAROUSEL_ALBUM`, usando il primo child valido come copertina degli album.
- [ ] Esporre `GET/HEAD /api/instagram-feed` con un contratto JSON minimo e senza token, cursori o errori Meta grezzi.
- [ ] Aggiungere cache edge e header browser, evitando una richiesta Meta per ogni visitatore.
- [ ] Aggiungere una migrazione D1 per l'ultimo payload valido e servirlo con `stale: true` durante errori temporanei.
- [ ] Gestire feed vuoto, token scaduto, `429`, timeout, `5xx`, JSON non valido e media privi di immagine.
- [ ] Aggiungere log strutturati e metriche essenziali senza caption complete, token o dati sensibili.

### Interfaccia a fondo pagina

- [ ] Inserire la sezione Instagram prima del footer, mantenendo sempre visibile un link statico al profilo.
- [ ] Implementare card responsive con CSS `scroll-snap` e progressive enhancement.
- [ ] Caricare il feed e le immagini in modo differito, riservando le dimensioni per evitare layout shift.
- [ ] Aggiungere controlli precedente/successivo accessibili da tastiera, focus visibile e nessun autoplay.
- [ ] Rispettare `prefers-reduced-motion` e verificare il carosello con lettore di schermo.
- [ ] Gestire caption, testo alternativo, video, album e immagini non disponibili con fallback coerenti.
- [ ] Verificare privacy policy, `rel="noopener noreferrer"`, CSP e domini CDN realmente restituiti da Meta.
- [ ] Decidere se usare direttamente la CDN Meta o un image proxy first-party compatibile con i termini della piattaforma.

### Test e operatività

- [ ] Aggiungere fixture e test unitari del normalizzatore per tutti i tipi di media e campi mancanti.
- [ ] Testare endpoint, cache hit/miss, fallback D1 e principali errori upstream senza dipendere dalla rete.
- [ ] Verificare che token e diagnostica Meta non compaiano in HTML, JSON pubblico, log o repository.
- [ ] Eseguire test responsive, tastiera, reduced motion, immagini lente e Core Web Vitals.
- [ ] Preparare un runbook per rinnovo/revoca del token e un avviso operativo prima della scadenza.
- [ ] Pianificare la revisione periodica della versione Graph, dei permessi e delle modifiche alla piattaforma Meta.
- [ ] Pubblicare prima in staging e completare uno smoke test con post reali prima della messa in produzione.

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
- [ ] Acquistare `lisacroce.it` e spostarne i nameserver su Cloudflare.
- [ ] Configurare route/custom domain soltanto dopo l'attivazione DNS.
