-- Bosque CUCEI · Esquema inicial
-- Basado en la sección 9 (Modelo de datos mínimo) de la propuesta, con lo necesario
-- para la dinámica de juego: experiencia, semanas, misiones y métricas del piloto.

-- ───────────────────────── Catálogo de especies ─────────────────────────
CREATE TABLE especies (
  id                serial PRIMARY KEY,
  slug              text UNIQUE NOT NULL,
  nombre_comun      text NOT NULL,
  otros_nombres     text[] NOT NULL DEFAULT '{}',
  nombre_cientifico text NOT NULL,
  familia           text NOT NULL,
  origen            text NOT NULL CHECK (origen IN ('nativa', 'introducida')),
  distribucion      text,
  descripcion       text NOT NULL,
  dato_curioso      text,
  beneficios        text[] NOT NULL DEFAULT '{}',
  altura_max_m      numeric(5, 1),
  follaje           text CHECK (follaje IN ('perenne', 'caducifolio', 'semicaducifolio')),
  floracion_meses   int[] NOT NULL DEFAULT '{}',
  color_flor        text,
  -- Genoma del sprite: forma de copa y colores con los que se dibuja el árbol virtual.
  sprite            jsonb NOT NULL,
  gbif_id           bigint,
  wikipedia_url     text,
  foto_url          text,
  foto_credito      text,
  fuente            text,
  creado_en         timestamptz NOT NULL DEFAULT now()
);

-- ───────────────────────── Árboles físicos del campus ─────────────────────────
CREATE TABLE arboles (
  id                 serial PRIMARY KEY,
  codigo             text UNIQUE NOT NULL,            -- tree_id visible en la placa (CUCEI-0027)
  qr_id              text UNIQUE NOT NULL,            -- contenido del QR ya colocado
  especie_id         int NOT NULL REFERENCES especies (id),
  apodo              text,
  latitud            double precision NOT NULL,
  longitud           double precision NOT NULL,
  zona               text NOT NULL,
  fecha_registro     date NOT NULL DEFAULT current_date,
  altura_m           numeric(5, 1),
  diametro_cm        numeric(6, 1),
  estado_actual      text NOT NULL DEFAULT 'sin_datos'
                     CHECK (estado_actual IN ('normal', 'pendiente', 'posible_problema',
                                              'revision_requerida', 'sin_datos')),
  foto_principal     text,
  ultima_observacion timestamptz,
  ultima_inspeccion  date,
  notas_publicas     text,
  activo             boolean NOT NULL DEFAULT true,
  creado_en          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX arboles_especie ON arboles (especie_id);
CREATE INDEX arboles_zona ON arboles (zona);

-- ───────────────────────── Personas ─────────────────────────
CREATE TABLE usuarios (
  id                   serial PRIMARY KEY,
  nombre               text NOT NULL,
  alias                text UNIQUE NOT NULL,          -- lo único que se muestra públicamente
  correo               text UNIQUE NOT NULL,
  hash_contrasena      text NOT NULL,
  tipo_usuario         text NOT NULL
                       CHECK (tipo_usuario IN ('alumno', 'academico', 'administrativo', 'visitante')),
  carrera_o_area       text,
  rol                  text NOT NULL DEFAULT 'usuario' CHECK (rol IN ('usuario', 'admin')),
  xp                   int NOT NULL DEFAULT 0,
  nivel                int NOT NULL DEFAULT 1,
  racha_semanas        int NOT NULL DEFAULT 0,
  ultima_semana_activa text,
  fecha_alta           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sesiones (
  token_hash text PRIMARY KEY,
  usuario_id int NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  expira_en  timestamptz NOT NULL,
  creado_en  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sesiones_usuario ON sesiones (usuario_id);

-- ───────────────────────── Relación usuario–árbol (jardín) ─────────────────────────
CREATE TABLE usuario_arbol (
  usuario_id           int NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  arbol_id             int NOT NULL REFERENCES arboles (id) ON DELETE CASCADE,
  fecha_descubrimiento timestamptz NOT NULL DEFAULT now(),
  numero_visitas       int NOT NULL DEFAULT 0,        -- visitas válidas (una por semana)
  ultima_visita        timestamptz,
  ultima_semana        text,
  guardian             boolean NOT NULL DEFAULT false, -- lo sigue / lo cuida
  nivel_arbol_virtual  int NOT NULL DEFAULT 0,
  PRIMARY KEY (usuario_id, arbol_id)
);
CREATE INDEX usuario_arbol_arbol ON usuario_arbol (arbol_id);

-- ───────────────────────── Observaciones ─────────────────────────
CREATE TABLE observaciones (
  id               serial PRIMARY KEY,
  arbol_id         int NOT NULL REFERENCES arboles (id) ON DELETE CASCADE,
  usuario_id       int NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  fecha            timestamptz NOT NULL DEFAULT now(),
  semana           text NOT NULL,                     -- semana ISO en hora de Guadalajara, p. ej. 2026-W44
  cuenta           boolean NOT NULL,                  -- primera de la semana: da experiencia y crecimiento
  estado_reportado text NOT NULL CHECK (estado_reportado IN ('bien', 'diferente', 'problema', 'revision')),
  categorias       text[] NOT NULL DEFAULT '{}',
  comentario       text,
  fotografia       text,
  validada         boolean,                           -- null = sin revisar
  xp_otorgada      int NOT NULL DEFAULT 0,
  duracion_ms      int,
  revisada_por     int REFERENCES usuarios (id) ON DELETE SET NULL,
  revisada_en      timestamptz
);
-- La regla central del juego: solo la primera observación de la semana por árbol cuenta.
CREATE UNIQUE INDEX observaciones_una_por_semana ON observaciones (usuario_id, arbol_id, semana) WHERE cuenta;
CREATE INDEX observaciones_arbol_fecha ON observaciones (arbol_id, fecha DESC);
CREATE INDEX observaciones_usuario_fecha ON observaciones (usuario_id, fecha DESC);
CREATE INDEX observaciones_fecha ON observaciones (fecha DESC);

-- ───────────────────────── Alertas para Sustentabilidad ─────────────────────────
CREATE TABLE alertas (
  id               serial PRIMARY KEY,
  arbol_id         int NOT NULL REFERENCES arboles (id) ON DELETE CASCADE,
  fecha_generacion timestamptz NOT NULL DEFAULT now(),
  nivel            text NOT NULL CHECK (nivel IN ('media', 'alta', 'critica')),
  motivo           text NOT NULL,
  categorias       text[] NOT NULL DEFAULT '{}',
  estado_revision  text NOT NULL DEFAULT 'abierta'
                   CHECK (estado_revision IN ('abierta', 'en_revision', 'resuelta', 'descartada')),
  responsable      text,
  resolucion       text,
  util             boolean,                           -- ¿sirvió tras la revisión física?
  resuelta_en      timestamptz,
  actualizada_en   timestamptz NOT NULL DEFAULT now()
);
-- Un árbol tiene como máximo una alerta abierta; los reportes nuevos la actualizan.
CREATE UNIQUE INDEX alertas_una_abierta ON alertas (arbol_id) WHERE estado_revision IN ('abierta', 'en_revision');
CREATE INDEX alertas_estado ON alertas (estado_revision, fecha_generacion DESC);

-- ───────────────────────── Experiencia ─────────────────────────
CREATE TABLE xp_eventos (
  id             serial PRIMARY KEY,
  usuario_id     int NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  cantidad       int NOT NULL,
  motivo         text NOT NULL,
  detalle        text,
  observacion_id int REFERENCES observaciones (id) ON DELETE SET NULL,
  creado_en      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX xp_eventos_usuario ON xp_eventos (usuario_id, creado_en DESC);

-- ───────────────────────── Misiones ─────────────────────────
CREATE TABLE misiones (
  id            serial PRIMARY KEY,
  slug          text UNIQUE NOT NULL,
  titulo        text NOT NULL,
  descripcion   text NOT NULL,
  tipo          text NOT NULL
                CHECK (tipo IN ('visitar_arboles', 'descubrir_especies', 'constancia', 'zona', 'fotografo')),
  meta          int NOT NULL CHECK (meta > 0),
  zona          text,
  recompensa_xp int NOT NULL CHECK (recompensa_xp >= 0),
  icono         text NOT NULL DEFAULT 'hoja',
  periodicidad  text NOT NULL DEFAULT 'unica' CHECK (periodicidad IN ('semanal', 'unica')),
  inicia        date NOT NULL,
  termina       date NOT NULL,
  activa        boolean NOT NULL DEFAULT true
);

CREATE TABLE misiones_completadas (
  usuario_id    int NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  mision_id     int NOT NULL REFERENCES misiones (id) ON DELETE CASCADE,
  periodo       text NOT NULL,                        -- semana ISO o 'unica'
  completada_en timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, mision_id, periodo)
);

-- ───────────────────────── Métricas del piloto ─────────────────────────
CREATE TABLE escaneos (
  id         bigserial PRIMARY KEY,
  arbol_id   int NOT NULL REFERENCES arboles (id) ON DELETE CASCADE,
  usuario_id int REFERENCES usuarios (id) ON DELETE SET NULL,
  fecha      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX escaneos_fecha ON escaneos (fecha DESC);

CREATE TABLE retroalimentacion (
  id         serial PRIMARY KEY,
  usuario_id int REFERENCES usuarios (id) ON DELETE SET NULL,
  pagina     text,
  mensaje    text NOT NULL,
  atendida   boolean NOT NULL DEFAULT false,
  fecha      timestamptz NOT NULL DEFAULT now()
);

-- ───────────────────────── Parámetros editables desde administración ─────────────────────────
CREATE TABLE ajustes (
  clave       text PRIMARY KEY,
  valor       jsonb NOT NULL,
  descripcion text NOT NULL
);
