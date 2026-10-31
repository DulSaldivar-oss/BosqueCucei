/**
 * Datos de demostración: personas y observaciones de las últimas 10 semanas, registradas
 * con la misma lógica del juego (regla semanal, experiencia, misiones y alertas).
 *
 * Usa los árboles del inventario oficial (npm run db:migrar). No la corras en producción.
 *
 *   npm run db:demo               personas y observaciones
 *   npm run db:demo -- --reiniciar  borra lo anterior de demostración y lo vuelve a crear
 *
 * Cuentas (contraseña: bosque123):
 *   sustentabilidad@cucei.demo  administración
 *   demo@cucei.demo             jugador con jardín avanzado
 */
import { urlBaseDatos } from "./entorno";

process.env.DATABASE_URL = urlBaseDatos();

const { pool, consulta } = await import("../lib/db");
const { hashContrasena } = await import("../lib/contrasenas");
const { registrarObservacion } = await import("../lib/servicios/observar");
const { refrescarEstados } = await import("../lib/servicios/alertas");
const { leerAjustes } = await import("../lib/ajustes");
const { medianocheLocal, fechaLocal } = await import("../lib/juego/semana");

let semilla = 20261029;
const azar = () => {
  semilla = (semilla * 1664525 + 1013904223) % 4294967296;
  return semilla / 4294967296;
};
const elegir = <T>(lista: T[]) => lista[Math.floor(azar() * lista.length)];

const PERSONAS = [
  { alias: "demo", nombre: "Persona Demo", tipo: "alumno", carrera: "Ingeniería en Computación", arboles: 14, constancia: 0.85 },
  { alias: "jacaranda_23", nombre: "Mariana López", tipo: "alumno", carrera: "Química", arboles: 9, constancia: 0.75 },
  { alias: "fresnito", nombre: "Carlos Méndez", tipo: "alumno", carrera: "Ingeniería Civil", arboles: 7, constancia: 0.6 },
  { alias: "andrea.r", nombre: "Andrea Ruiz", tipo: "academico", carrera: "Departamento de Biología", arboles: 11, constancia: 0.7 },
  { alias: "vale_eco", nombre: "Valeria Gómez", tipo: "alumno", carrera: "Ingeniería Biomédica", arboles: 6, constancia: 0.5 },
  { alias: "luisito", nombre: "Luis Torres", tipo: "administrativo", carrera: "Servicios generales", arboles: 5, constancia: 0.55 },
  { alias: "botanica_mx", nombre: "Sofía Hernández", tipo: "alumno", carrera: "Física", arboles: 8, constancia: 0.45 },
  { alias: "el_tabachin", nombre: "Diego Ramírez", tipo: "alumno", carrera: "Mecatrónica", arboles: 4, constancia: 0.4 },
  { alias: "ceci.verde", nombre: "Cecilia Navarro", tipo: "visitante", carrera: null, arboles: 3, constancia: 0.35 },
  { alias: "pirul_feliz", nombre: "Jorge Castillo", tipo: "alumno", carrera: "Matemáticas", arboles: 5, constancia: 0.3 },
];

const reiniciar = process.argv.includes("--reiniciar");
const existentes = await consulta<{ n: number }>("SELECT count(*) AS n FROM usuarios WHERE correo LIKE '%@cucei.demo'");
if (existentes[0].n > 0) {
  if (!reiniciar) {
    console.log("Ya hay datos de demostración. Usa: npm run db:demo -- --reiniciar");
    await pool().end();
    process.exit(0);
  }
  await consulta("DELETE FROM usuarios WHERE correo LIKE '%@cucei.demo'");
  await consulta("DELETE FROM alertas");
  await consulta("UPDATE arboles SET estado_actual = 'sin_datos', ultima_observacion = NULL");
}

const arboles = await consulta<{ id: number; codigo: string }>("SELECT id, codigo FROM arboles WHERE activo ORDER BY codigo");
if (arboles.length === 0) {
  console.error("No hay árboles. Corre primero: npm run db:migrar");
  process.exit(1);
}
const hash = await hashContrasena("bosque123");

await consulta(
  `INSERT INTO usuarios (nombre, alias, correo, hash_contrasena, tipo_usuario, carrera_o_area, rol)
   VALUES ('Equipo Sustentabilidad', 'sustentabilidad', 'sustentabilidad@cucei.demo', $1, 'administrativo', 'CUCEI Sustentable', 'admin')`,
  [hash],
);

// Árboles con problemas recurrentes para que el panel tenga alertas reales.
const conProblemas = [arboles[4], arboles[11], arboles[23]];
const conRiesgo = arboles[30];
const ahora = new Date();
const SEMANAS = 10;
let total = 0;

function momento(semanasAtras: number) {
  const base = new Date(ahora.getTime() - semanasAtras * 7 * 86_400_000 - Math.floor(azar() * 6) * 86_400_000);
  const { anio, mes, dia } = fechaLocal(base);
  const fecha = new Date(medianocheLocal(anio, mes, dia).getTime() + (8 + azar() * 10) * 3_600_000);
  return fecha > ahora ? new Date(ahora.getTime() - 3_600_000 * (1 + azar() * 5)) : fecha;
}

for (const p of PERSONAS) {
  const [{ id }] = await consulta<{ id: number }>(
    `INSERT INTO usuarios (nombre, alias, correo, hash_contrasena, tipo_usuario, carrera_o_area, fecha_alta)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [p.nombre, p.alias, `${p.alias.replace(/[^a-z0-9]/gi, "")}@cucei.demo`, hash, p.tipo, p.carrera, new Date(ahora.getTime() - SEMANAS * 7 * 86_400_000)],
  );
  const propios = [...arboles].sort(() => azar() - 0.5).slice(0, p.arboles);
  if (p.alias === "demo") propios.push(...conProblemas.filter((a) => !propios.includes(a)));
  const eventos: { fecha: Date; arbol: (typeof arboles)[number] }[] = [];
  propios.forEach((arbol, k) => {
    const inicio = Math.min(SEMANAS - 1, Math.floor(k / 2) + Math.floor(azar() * 2));
    for (let s = inicio; s >= 0; s--) {
      if (azar() < p.constancia) eventos.push({ fecha: momento(s), arbol });
      if (azar() < 0.08) eventos.push({ fecha: momento(s), arbol }); // segunda visita: no cuenta
    }
  });
  eventos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  for (const { fecha, arbol } of eventos) {
    let estado = "bien";
    let categorias: string[] = [];
    const problematico = conProblemas.includes(arbol);
    const reciente = ahora.getTime() - fecha.getTime() < 6 * 86_400_000;
    if (problematico && reciente && azar() < 0.85) {
      estado = elegir(["diferente", "problema", "problema"]);
      categorias = [elegir(["hojas_secas", "insectos", "manchas_hojas", "ramas_secas"])];
    } else if (azar() < 0.05) {
      estado = "diferente";
      categorias = [elegir(["hojas_secas", "basura", "falta_agua", "ramas_secas"])];
    }
    if (arbol === conRiesgo && reciente) {
      estado = "revision";
      categorias = ["rama_peligrosa"];
    }
    await registrarObservacion(
      {
        usuarioId: id,
        arbolId: arbol.id,
        estado,
        categorias,
        comentario: estado !== "bien" && azar() < 0.4 ? "Lo noté al pasar hacia el módulo." : null,
        duracionMs: Math.round(9_000 + azar() * 28_000),
      },
      fecha,
    );
    await consulta("INSERT INTO escaneos (arbol_id, usuario_id, fecha) VALUES ($1, $2, $3)", [arbol.id, id, fecha]);
    total++;
  }
  console.log(`  ✓ ${p.alias}: ${eventos.length} observaciones`);
}

// Escaneos de visitantes sin cuenta.
for (let k = 0; k < 60; k++) {
  await consulta("INSERT INTO escaneos (arbol_id, fecha) VALUES ($1, $2)", [elegir(arboles).id, momento(Math.floor(azar() * SEMANAS))]);
}
await refrescarEstados(pool(), await leerAjustes(), true);
console.log(`✓ ${PERSONAS.length + 1} personas y ${total} observaciones de demostración. Contraseña: bosque123`);
await pool().end();
