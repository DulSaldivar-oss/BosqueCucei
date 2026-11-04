-- Antitrampa: una observación solo se acepta si se hace junto al árbol.
--   · GPS a no más de 50 m del árbol, o
--   · escaneo reciente de su placa con un QR que no se puede adivinar (qr_verificable).

-- Un QR «verificable» lleva una parte aleatoria (CUCEI-0048-K7Q2M9XD): escanearlo prueba que
-- se estuvo frente a la placa. Los QR que solo dicen el código o el número se pueden escribir
-- a mano y no sirven como prueba.
ALTER TABLE arboles ADD COLUMN qr_verificable boolean NOT NULL DEFAULT false;

-- Escaneos de placa vigentes: el navegador guarda el token (cookie) y aquí queda su huella.
-- Queda ligado a la primera persona que lo usa, para que no se pueda compartir.
CREATE TABLE presencias_placa (
  token_hash text PRIMARY KEY,
  arbol_id   int NOT NULL REFERENCES arboles (id) ON DELETE CASCADE,
  usuario_id int REFERENCES usuarios (id) ON DELETE CASCADE,
  creada_en  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX presencias_placa_creada ON presencias_placa (creada_en);

-- Cómo se comprobó la presencia de cada observación (auditoría) y huella de la foto
-- (para no aceptar la misma foto dos veces).
ALTER TABLE observaciones
  ADD COLUMN prueba_presencia text CHECK (prueba_presencia IN ('gps', 'placa')),
  ADD COLUMN distancia_m      numeric(7, 1),
  ADD COLUMN precision_m      numeric(7, 1),
  ADD COLUMN foto_hash        text;
CREATE INDEX observaciones_foto_hash ON observaciones (foto_hash) WHERE foto_hash IS NOT NULL;
