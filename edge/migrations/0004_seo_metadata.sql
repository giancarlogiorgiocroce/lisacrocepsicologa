UPDATE pages
SET title = 'Lisa Croce | Psicologa clinica a Bolzano e online',
    updated_at = CURRENT_TIMESTAMP
WHERE site_id = (SELECT id FROM sites WHERE slug = 'lisa')
  AND slug = 'home';
