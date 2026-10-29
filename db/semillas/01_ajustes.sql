-- Parámetros iniciales. Se ajustan desde /admin/ajustes después de las primeras pruebas.
-- ON CONFLICT DO NOTHING: volver a correr la semilla no pisa lo que cambió administración.
INSERT INTO ajustes (clave, valor, descripcion) VALUES
  ('alerta_ventana_dias',   '7',  'Días que se revisan para decidir si un árbol genera alerta.'),
  ('alerta_min_usuarios',   '3',  'Personas distintas que deben reportar el árbol dentro de la ventana.'),
  ('alerta_min_anomalias',  '2',  'De esas personas, cuántas deben indicar algo anormal.'),
  ('categorias_criticas',   '["rama_peligrosa", "arbol_inclinado"]',
                                  'Categorías que generan alerta crítica con un solo reporte (riesgo para personas).'),
  ('dias_sin_datos',        '30', 'Días sin observaciones para marcar el árbol como "sin datos recientes".'),
  ('xp_visita',             '10', 'Experiencia por la primera observación de la semana en un árbol.'),
  ('xp_descubrimiento',     '25', 'Experiencia extra al descubrir un árbol por primera vez.'),
  ('xp_especie_nueva',      '40', 'Experiencia extra al descubrir una especie nueva para el herbario.'),
  ('xp_foto',               '5',  'Experiencia extra si la observación válida incluye fotografía.'),
  ('xp_racha_por_semana',   '5',  'Bono por cada semana seguida con al menos una visita válida.'),
  ('xp_racha_max',          '25', 'Tope del bono de racha.'),
  ('xp_validacion',         '15', 'Experiencia cuando Sustentabilidad confirma que una observación fue útil.')
ON CONFLICT (clave) DO NOTHING;
