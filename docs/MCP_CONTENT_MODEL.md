# Modello contenuti MCP — Lisa Croce

Questo documento descrive la struttura della one-page resa dinamicamente da D1 senza cambiare il contratto visuale di HTML e CSS. Lo stato operativo resta in `TODO.md`.

| Ordine | sectionId | type | styleContract | Contenuto principale |
| ---: | --- | --- | --- | --- |
| 10 | `hero` | `hero` | `home.hero` | etichetta, titolo, introduzione, CTA, immagine e testo simbolico |
| 20 | `ascolto` | `text` | `home.about` | presentazione, paragrafi e nota professionale |
| 30 | `metodo` | `list` | `home.approach_steps` | titolo e tre passaggi numerati |
| 40 | `servizi` | `list` | `home.services` | approcci, strumenti e aree di intervento |
| 50 | `percorsi` | `cards` | `home.audiences` | introduzione e card Adolescenti/Adulti |
| 60 | `contatti` | `contact` | `home.contact` | testo, immagine e canali di contatto |

## Regole iniziali

- Il renderer mantiene struttura, classi, stile e comportamento del template statico.
- D1 contiene dati JSON strutturati, non HTML libero.
- Il titolo hero usa i campi separati `title` ed `emphasis` per preservare l'enfasi tipografica.
- I link sono campi contrattualizzati; `javascript:`, `data:` e path traversal non sono ammessi.
- Le immagini correnti restano riferimenti statici durante la prima fase. La scrittura futura userà esclusivamente `assetId` validati tramite D1/R2.
- Il token tecnico `AI_API_TOKEN` espone soltanto strumenti di lettura.
- I token editor sono identificati tramite hash SHA-256 in D1 e possono essere limitati al sito `lisa`.
- Ogni sezione ha una versione incrementale. `update_text` richiede `expectedVersion`; aggiornamenti e rollback stale vengono rifiutati.
- Ogni scrittura crea una voce nel change log e una revisione della sezione nella stessa operazione atomica D1.
- Header, navigazione e footer restano layout statico finché non verrà definito un contratto globale dedicato.

## Sequenza di migrazione

1. [x] Verificare che `get_page(lisa, home)` restituisca i sei blocchi nell'ordine corrente.
2. [x] Aggiungere renderer dinamici che riproducano le classi HTML esistenti.
3. [x] Introdurre aggiornamenti testuali con revisione, audit e rollback protetto.
4. [ ] Aggiungere tool specializzati per liste, contatti e CTA.
5. [ ] Migrare le immagini al catalogo media D1/R2.
