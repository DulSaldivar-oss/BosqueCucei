-- Misiones iniciales (sección 5.H de la propuesta). Se administran desde /admin/misiones.
INSERT INTO misiones (slug, titulo, descripcion, tipo, meta, zona, recompensa_xp, icono, periodicidad, inicia, termina) VALUES
  ('guardian-semanal', 'Guardián semanal', 'Visita 3 árboles diferentes esta semana.',
   'visitar_arboles', 3, NULL, 30, 'regadera', 'semanal', '2026-08-01', '2027-07-31'),
  ('explorador-botanico', 'Explorador botánico', 'Descubre 2 especies nuevas esta semana.',
   'descubrir_especies', 2, NULL, 50, 'lupa', 'semanal', '2026-08-01', '2027-07-31'),
  ('mismo-arbol-cuatro-semanas', 'Amistad de raíz', 'Observa el mismo árbol durante 4 semanas distintas.',
   'constancia', 4, NULL, 80, 'corazon', 'unica', '2026-08-01', '2026-12-31'),
  ('ruta-modulo-o', 'Ruta del Sector 4', 'Visita 3 árboles del Sector 4, el de más árboles del campus.',
   'zona', 3, 'Sector 4', 40, 'mapa', 'unica', '2026-08-01', '2026-12-31'),
  ('fotografo-del-bosque', 'Fotógrafo del bosque', 'Registra 5 observaciones válidas con fotografía.',
   'fotografo', 5, NULL, 60, 'camara', 'unica', '2026-08-01', '2026-12-31')
ON CONFLICT (slug) DO NOTHING;

-- Las zonas del inventario oficial son sectores: la misión de zona deja el antiguo «Módulo O».
UPDATE misiones SET titulo = 'Ruta del Sector 4', descripcion = 'Visita 3 árboles del Sector 4, el de más árboles del campus.',
  zona = 'Sector 4'
WHERE slug = 'ruta-modulo-o' AND zona = 'Módulo O';
