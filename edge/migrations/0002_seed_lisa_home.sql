INSERT INTO sites (slug, name, status)
VALUES ('lisa', 'Lisa Croce · Psicologa clinica', 'active')
ON CONFLICT(slug) DO UPDATE SET name = excluded.name, status = excluded.status, updated_at = CURRENT_TIMESTAMP;

INSERT INTO pages (site_id, slug, title, status)
SELECT id, 'home', 'Lisa Croce | Psicologa clinica a Bolzano e online', 'published'
FROM sites
WHERE slug = 'lisa'
ON CONFLICT(site_id, slug) DO UPDATE SET title = excluded.title, status = excluded.status, updated_at = CURRENT_TIMESTAMP;

INSERT INTO page_sections (page_id, section_key, type, style_contract, section_order, enabled, data_json)
SELECT p.id, 'hero', 'hero', 'home.hero', 10, 1,
  '{"eyebrow":"Bolzano · Online · Adolescenti e adulti","title":"Dare forma a ciò che senti.","intro":"Uno spazio di ascolto e comprensione in cui esplorare difficoltà, emozioni e parti di sé, per ritrovare risorse e aprire nuove possibilità di cambiamento.","primaryCta":{"label":"Prenota un primo colloquio","href":"mailto:lisacrocepsicologa@gmail.com?subject=Richiesta%20primo%20colloquio"},"secondaryCta":{"label":"Scopri il percorso","href":"#ascolto"},"image":{"src":"images/hero.jpeg","alt":"Una figura sulla riva osserva il mare al tramonto","decorative":false},"symbolicText":["Il mare è spesso usato come simbolo dell’inconscio.","Si muovono correnti profonde, invisibili, a volte sconosciute anche a noi stessi.","Emozioni, ricordi, immagini, parti di noi: non tutto è subito accessibile, ma tutto ha un significato.","Non si tratta di controllare le onde, ma di imparare ad ascoltarle."]}'
FROM pages p JOIN sites s ON s.id = p.site_id WHERE s.slug = 'lisa' AND p.slug = 'home'
ON CONFLICT(page_id, section_key) DO UPDATE SET type = excluded.type, style_contract = excluded.style_contract, section_order = excluded.section_order, enabled = excluded.enabled, data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP;

INSERT INTO page_sections (page_id, section_key, type, style_contract, section_order, enabled, data_json)
SELECT p.id, 'ascolto', 'text', 'home.about', 20, 1,
  '{"kicker":"Chi sono","title":"Non un protocollo. Un incontro.","paragraphs":["Sono Lisa Croce, psicologa clinica iscritta all’Albo degli Psicologi della Provincia di Bolzano.","Lavoro con adolescenti e adulti che desiderano intraprendere un percorso introspettivo in uno spazio accogliente e personalizzato."],"note":"Sono in formazione come psicoterapeuta presso la Scuola di Specializzazione in Psicoterapia SPPIE Bernheim, sede di Trento. Il mio lavoro si ispira alla psicologia del profondo di matrice junghiana e alla psicosintesi: la persona non viene letta come un insieme di sintomi, ma come una realtà complessa e plurale."}'
FROM pages p JOIN sites s ON s.id = p.site_id WHERE s.slug = 'lisa' AND p.slug = 'home'
ON CONFLICT(page_id, section_key) DO UPDATE SET type = excluded.type, style_contract = excluded.style_contract, section_order = excluded.section_order, enabled = excluded.enabled, data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP;

INSERT INTO page_sections (page_id, section_key, type, style_contract, section_order, enabled, data_json)
SELECT p.id, 'metodo', 'list', 'home.approach_steps', 30, 1,
  '{"kicker":"Visione","title":"Le parti difficili non vanno cancellate.","items":[{"number":"01","text":"Possono essere ascoltate."},{"number":"02","text":"Possono diventare comprensibili."},{"number":"03","text":"Possono trovare un posto più integrato dentro di sé."}]}'
FROM pages p JOIN sites s ON s.id = p.site_id WHERE s.slug = 'lisa' AND p.slug = 'home'
ON CONFLICT(page_id, section_key) DO UPDATE SET type = excluded.type, style_contract = excluded.style_contract, section_order = excluded.section_order, enabled = excluded.enabled, data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP;

INSERT INTO page_sections (page_id, section_key, type, style_contract, section_order, enabled, data_json)
SELECT p.id, 'servizi', 'list', 'home.services', 40, 1,
  '{"kicker":"Servizi","title":"Aree di lavoro.","primaryApproach":"Psicologia analitica junghiana","approaches":["Psicosintesi","Ipnosi","Immaginazione guidata","Tecniche di rilassamento"],"areas":["Ansia e stati d’angoscia","Stress","Regolazione emotiva","Autostima e senso di sé","Relazioni affettive","Dipendenza affettiva","Crisi personale","Difficoltà scolastiche ed emotive","Disturbi dell’umore","Depressione post-partum","Consapevolezza emotiva"]}'
FROM pages p JOIN sites s ON s.id = p.site_id WHERE s.slug = 'lisa' AND p.slug = 'home'
ON CONFLICT(page_id, section_key) DO UPDATE SET type = excluded.type, style_contract = excluded.style_contract, section_order = excluded.section_order, enabled = excluded.enabled, data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP;

INSERT INTO page_sections (page_id, section_key, type, style_contract, section_order, enabled, data_json)
SELECT p.id, 'percorsi', 'cards', 'home.audiences', 50, 1,
  '{"kicker":"Percorsi","title":"Uno spazio pensato per età e momenti diversi.","intro":"Ogni percorso prende forma a partire dalla persona, dalla sua storia e da ciò che sta vivendo, con tempi e strumenti costruiti insieme.","items":[{"title":"Adolescenti","text":"Uno spazio per attraversare emozioni intense, difficoltà scolastiche, orientamento, motivazione e ricerca della propria direzione."},{"title":"Adulti","text":"Percorsi di consapevolezza e conoscenza di sé, con sostegno nei momenti di crisi, ansia, stress e difficoltà relazionali."}]}'
FROM pages p JOIN sites s ON s.id = p.site_id WHERE s.slug = 'lisa' AND p.slug = 'home'
ON CONFLICT(page_id, section_key) DO UPDATE SET type = excluded.type, style_contract = excluded.style_contract, section_order = excluded.section_order, enabled = excluded.enabled, data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP;

INSERT INTO page_sections (page_id, section_key, type, style_contract, section_order, enabled, data_json)
SELECT p.id, 'contatti', 'contact', 'home.contact', 60, 1,
  '{"kicker":"Contatti","title":"Un primo colloquio, in presenza o online.","intro":"Puoi scrivermi per ricevere maggiori informazioni o fissare un appuntamento. Sarò contenta di risponderti in modo attento, a partire dalla tua necessità.","image":{"src":"images/contact-conversation-evanescent.jpg","alt":"Due figure evanescenti dialogano mentre linee, cerchi e foglie rappresentano lo scambio","decorative":false},"channels":[{"key":"email","label":"Email","value":"lisacrocepsicologa@gmail.com","href":"mailto:lisacrocepsicologa@gmail.com?subject=Richiesta%20informazioni%20o%20primo%20colloquio","enabled":true},{"key":"telefono","label":"Telefono","value":"+39 389 577 5332","href":"tel:+393895775332","enabled":true},{"key":"instagram","label":"Instagram","value":"@dott.ssa.lisa.croce.psicologa","href":"https://www.instagram.com/dott.ssa.lisa.croce.psicologa/","enabled":true}]}'
FROM pages p JOIN sites s ON s.id = p.site_id WHERE s.slug = 'lisa' AND p.slug = 'home'
ON CONFLICT(page_id, section_key) DO UPDATE SET type = excluded.type, style_contract = excluded.style_contract, section_order = excluded.section_order, enabled = excluded.enabled, data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP;
