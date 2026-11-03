-- Datos del inventario oficial de árboles (Excel del campus).

ALTER TABLE arboles
  ADD COLUMN campus               text NOT NULL DEFAULT 'CUCEI',
  ADD COLUMN estado_fitosanitario text,
  ADD COLUMN ancho_copa_m         numeric(5, 1),
  ADD COLUMN circunferencia_cm    numeric(7, 1),
  ADD COLUMN co2_kg               numeric(10, 1),
  -- 'inventario': viene del Excel oficial y se sincroniza con él; 'panel': alta manual.
  ADD COLUMN fuente               text NOT NULL DEFAULT 'panel' CHECK (fuente IN ('inventario', 'panel'));

CREATE INDEX arboles_campus ON arboles (campus);

-- El inventario no dice si cada especie es nativa: queda vacío hasta curarlo.
ALTER TABLE especies
  ALTER COLUMN origen DROP NOT NULL,
  ADD COLUMN follaje_texto   text,
  ADD COLUMN clima           text,
  ADD COLUMN floracion_texto text;
