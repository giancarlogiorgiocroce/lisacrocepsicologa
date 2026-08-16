# Integrazione Instagram: note tecniche e decisioni

Ricerca verificata il 16 agosto 2026. Questo documento riguarda il carosello degli ultimi post da mostrare prima del footer del sito di Lisa Croce.

## Decisione consigliata

Usare **Instagram API with Instagram Login** attraverso il Worker Cloudflare già presente in `edge/`.

- L'account Instagram deve essere **Professionale**, quindi Business o Creator. I profili personali non sono supportati dall'API attuale.
- Per leggere i post dell'account di Lisa è sufficiente il permesso minimo `instagram_business_basic`.
- Non serve `instagram_business_content_publish`: il sito deve leggere i post, non pubblicarli su Instagram.
- Se l'app serve soltanto un account posseduto o gestito da noi e aggiunto nell'App Dashboard, **Standard Access** dovrebbe essere sufficiente. Advanced Access e App Review diventano necessari se in futuro l'app servirà account di terzi.
- Questa modalità usa `graph.instagram.com` e non richiede di collegare una Pagina Facebook all'account professionale.
- Non usare la vecchia Instagram Basic Display API: è stata dismessa e non è una base valida per una nuova integrazione.

La scelta va confermata nel Meta App Dashboard durante il setup, perché nomi dei prodotti, versioni e requisiti di revisione possono cambiare.

## Architettura proposta

```text
Browser
  -> GET /api/instagram-feed
     -> cache Cloudflare
        -> Instagram Graph API
        -> ultimo payload valido in D1 in caso di errore
```

Il browser non deve chiamare direttamente Meta. Il Worker deve:

1. custodire il token;
2. chiamare l'API con campi e limiti fissi;
3. normalizzare e ridurre la risposta;
4. servire un JSON pubblico cacheabile;
5. usare l'ultimo risultato valido quando Instagram è temporaneamente indisponibile.

Questa struttura evita di esporre il token, riduce il numero di richieste verso Meta e mantiene il carosello utilizzabile durante errori o rate limit.

## Credenziali e configurazione

Configurazione prevista nel Worker:

| Nome | Tipo | Contenuto |
| --- | --- | --- |
| `INSTAGRAM_ACCESS_TOKEN` | secret Cloudflare | Token Instagram User, mai versionato |
| `INSTAGRAM_USER_ID` | variabile non segreta | ID dell'account professionale |
| `INSTAGRAM_GRAPH_VERSION` | variabile non segreta | Versione Graph supportata e fissata esplicitamente |

Regole:

- configurare il token remoto con un secret Cloudflare;
- usare `edge/.dev.vars` soltanto in locale: è già ignorato da Git;
- non inserire token in HTML, JavaScript client, D1 in chiaro, URL pubblici, log, errori o fixture;
- non usare una versione API implicita o `latest`: fissarla e pianificarne la revisione periodica;
- conservare App Secret e dati OAuth solo se saranno davvero necessari al rinnovo automatico.

Il token ha un ciclo di vita e può essere revocato. Durante il setup bisogna registrare `expires_in`, definire una procedura di rinnovo anticipato e verificare periodicamente che account, permesso e token siano ancora validi.

## Chiamata minima verso Meta

Schema indicativo:

```http
GET https://graph.instagram.com/{VERSION}/{INSTAGRAM_USER_ID}/media
Authorization: Bearer {INSTAGRAM_ACCESS_TOKEN}
```

Campi utili:

```text
id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,children
```

Richiedere solo pochi elementi recenti, inizialmente 6-10. Gestire i cursori restituiti dall'API, ma non esporli al browser se il carosello non ha bisogno della paginazione.

### Normalizzazione dei media

`media_type` può richiedere comportamenti diversi:

- `IMAGE`: usare `media_url`;
- `VIDEO`: usare `thumbnail_url` come immagine del carosello e aprire `permalink` al clic;
- `CAROUSEL_ALBUM`: ricavare la copertina dal primo elemento di `children`, con una field expansion supportata dalla versione scelta oppure tramite `/{media-id}/children`;
- media senza immagine valida: scartarli senza rendere non valido l'intero feed.

Non confondere il carosello del sito con un post Instagram `CAROUSEL_ALBUM`: nella prima versione il post-album deve occupare una singola card e usare soltanto una copertina.

Le URL dei media vanno considerate temporanee: non devono diventare contenuti permanenti del CMS. Il Worker deve aggiornare periodicamente il feed e il frontend deve tollerare immagini non più disponibili.

## Contratto dell'endpoint pubblico

Proposta per `GET /api/instagram-feed`:

```json
{
  "posts": [
    {
      "id": "...",
      "type": "IMAGE",
      "imageUrl": "https://...",
      "permalink": "https://www.instagram.com/...",
      "caption": "...",
      "alt": "...",
      "publishedAt": "2026-08-16T10:00:00+0000"
    }
  ],
  "generatedAt": "2026-08-16T10:30:00.000Z",
  "stale": false
}
```

Il payload pubblico non deve contenere token, URL di paging Meta, diagnostica interna o campi non usati dal frontend.

Comportamento consigliato:

- accettare soltanto `GET` e `HEAD`;
- niente CORS aperto se frontend e Worker condividono lo stesso dominio;
- timeout breve sulla chiamata upstream;
- convalida rigorosa della risposta Meta;
- risposta `200` con `stale: true` quando è disponibile un ultimo risultato valido;
- risposta controllata e fallback statico quando non esiste ancora alcun risultato valido;
- non inoltrare al client i messaggi di errore grezzi di Meta.

## Cache e resilienza

Valori iniziali da misurare e poi regolare:

- cache edge del JSON: 15-30 minuti;
- cache browser: circa 5 minuti;
- ultimo payload valido in D1: fallback operativo, con `fetched_at` e stato;
- massimo 6-10 post nella risposta pubblica.

La Cache API di Cloudflare è locale al data center e non sostituisce un fallback persistente. D1, già disponibile nel progetto, può conservare l'ultimo JSON normalizzato riuscito.

Gestire almeno:

- `401/403`: token scaduto, revocato o permesso mancante;
- `429`: rate limit, senza retry aggressivi;
- `5xx`, timeout e JSON non valido: usare la cache o l'ultimo risultato valido;
- feed vuoto: mostrare il collegamento statico al profilo Instagram;
- immagine fallita nel browser: nascondere la card o usare un fallback grafico locale.

Monitorare in forma aggregata gli header di utilizzo restituiti da Meta quando disponibili, senza loggare credenziali o risposte complete.

## Frontend del carosello

La sezione va inserita prima del footer e costruita come progressive enhancement:

- titolo e link al profilo presenti nell'HTML anche senza JavaScript;
- caricamento del feed differito perché la sezione è a fondo pagina;
- card con dimensioni riservate per evitare layout shift;
- immagini con `loading="lazy"` e `decoding="async"`;
- CSS `scroll-snap` come base, JavaScript solo per controlli e stato;
- nessun autoplay;
- pulsanti precedente/successivo utilizzabili da tastiera e con etichette accessibili;
- supporto a `prefers-reduced-motion`;
- stato di caricamento breve, errore non invasivo e fallback statico;
- didascalie accorciate visivamente senza alterare il testo accessibile necessario.

Per il testo alternativo, usare `alt_text` se la versione API lo rende disponibile e il valore è utile; altrimenti creare un fallback breve e non duplicare integralmente la caption.

## Privacy e contenuti di terzi

Questa soluzione non richiede embed o script JavaScript di Instagram, quindi evita cookie e widget social caricati automaticamente. Tuttavia, se il browser usa direttamente una URL CDN restituita da Meta, effettua comunque una richiesta a un dominio di terzi.

Prima della produzione bisogna quindi:

- descrivere l'uso del feed nella privacy policy se necessario;
- verificare domini effettivi delle immagini e Content Security Policy;
- mantenere link esterni con `target="_blank"` e `rel="noopener noreferrer"`;
- valutare un image proxy first-party soltanto dopo aver verificato termini Meta, cache header e impatto operativo;
- non scaricare o ripubblicare permanentemente i contenuti senza una decisione esplicita.

## Verifiche richieste

### Test automatici

- normalizzazione di `IMAGE`, `VIDEO` e `CAROUSEL_ALBUM`;
- campi mancanti, caption assente e media non supportato;
- endpoint con cache hit, cache miss e fallback D1;
- timeout, `401/403`, `429`, `5xx` e risposta Meta malformata;
- assenza di token e dettagli upstream nel JSON e nei log;
- `GET`, `HEAD` e metodi non consentiti;
- rendering con feed valido, vuoto e non disponibile.

### Controlli manuali

- desktop, tablet e mobile;
- tastiera, focus visibile e lettore di schermo;
- `prefers-reduced-motion`;
- immagini lente o non disponibili;
- nessun layout shift rilevante;
- link a post e profilo corretti;
- caricamento iniziale della pagina non rallentato dal feed.

## Decisioni ancora da prendere

1. Confermare che `@dott.ssa.lisa.croce.psicologa` sia Business o Creator.
2. Confermare chi possiede e gestisce l'app Meta e il relativo account Instagram.
3. Scegliere la versione Graph supportata al momento dell'implementazione.
4. Decidere durata massima accettabile dell'ultimo feed valido.
5. Decidere se le immagini resteranno su CDN Meta o passeranno da un proxy conforme.
6. Definire chi riceve l'avviso di token scaduto e chi esegue il rinnovo.

## Fonti ufficiali

- [Instagram API with Instagram Login — raccolta ufficiale Meta su Postman](https://www.postman.com/meta/instagram/folder/6raa77c/instagram-api-with-instagram-login)
- [Instagram API — documentazione ufficiale Meta su Postman](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api)
- [Instagram Platform — documentazione Meta](https://developers.facebook.com/docs/instagram-platform/)
- [Business Login for Instagram — documentazione Meta](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/)
- [Aggiornamento Meta sulla dismissione di Instagram Basic Display API](https://developers.facebook.com/blog/post/2024/09/04/update-on-instagram-basic-display-api/)
- [Integrazione di API esterne nei Cloudflare Workers](https://developers.cloudflare.com/workers/configuration/integrations/apis/)
- [Secrets nei Cloudflare Workers](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cache API dei Cloudflare Workers](https://developers.cloudflare.com/workers/runtime-apis/cache/)
