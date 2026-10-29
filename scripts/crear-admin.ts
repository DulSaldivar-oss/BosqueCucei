/**
 * Da rol de administración (panel de Sustentabilidad) a una cuenta existente.
 *   npm run admin:crear -- correo@cucei.udg.mx
 * La persona primero se registra normalmente en /registro.
 */
import pg from "pg";
import { urlBaseDatos } from "./entorno";

const correo = process.argv[2]?.toLowerCase();
if (!correo) {
  console.error("Uso: npm run admin:crear -- correo@dominio");
  process.exit(1);
}
const cliente = new pg.Client({ connectionString: urlBaseDatos() });
await cliente.connect();
const { rowCount } = await cliente.query("UPDATE usuarios SET rol = 'admin' WHERE correo = $1", [correo]);
await cliente.end();
if (!rowCount) {
  console.error(`No hay cuenta con el correo ${correo}. Regístrala primero en /registro.`);
  process.exit(1);
}
console.log(`✓ ${correo} ahora tiene acceso a /admin`);
