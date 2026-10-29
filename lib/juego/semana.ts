/**
 * Semanas del juego. Una observación cuenta para crecer solo si es la primera de la
 * semana para ese árbol. La semana es ISO (lunes a domingo) en hora de Guadalajara,
 * así la regla se explica fácil: «vuelve a partir del lunes».
 */

export const ZONA_HORARIA = "America/Mexico_City";
const DIA_MS = 86_400_000;

interface FechaLocal {
  anio: number;
  mes: number;
  dia: number;
}

const formatoFecha = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function fechaLocal(instante: Date): FechaLocal {
  const partes = Object.fromEntries(formatoFecha.formatToParts(instante).map((p) => [p.type, p.value]));
  return { anio: Number(partes.year), mes: Number(partes.month), dia: Number(partes.day) };
}

/** «2026-10-29» en hora local. */
export function diaLocal(instante: Date): string {
  const { anio, mes, dia } = fechaLocal(instante);
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function claveDeDiaUtc(diaUtc: number): string {
  const fecha = new Date(diaUtc);
  const diaSemana = (fecha.getUTCDay() + 6) % 7; // lunes = 0
  const jueves = diaUtc + (3 - diaSemana) * DIA_MS;
  const anioIso = new Date(jueves).getUTCFullYear();
  const cuatroEnero = Date.UTC(anioIso, 0, 4);
  const lunesSemana1 = cuatroEnero - ((new Date(cuatroEnero).getUTCDay() + 6) % 7) * DIA_MS;
  const numero = 1 + Math.floor((jueves - lunesSemana1) / (7 * DIA_MS));
  return `${anioIso}-W${String(numero).padStart(2, "0")}`;
}

/** Clave de semana ISO en hora local, p. ej. «2026-W44». */
export function claveSemana(instante: Date = new Date()): string {
  const { anio, mes, dia } = fechaLocal(instante);
  return claveDeDiaUtc(Date.UTC(anio, mes - 1, dia));
}

/** Lunes (como día UTC a medianoche) de la semana de la clave. */
function lunesDeClave(clave: string): number {
  const coincide = /^(\d{4})-W(\d{2})$/.exec(clave);
  if (!coincide) throw new Error(`Clave de semana inválida: ${clave}`);
  const anio = Number(coincide[1]);
  const semana = Number(coincide[2]);
  const cuatroEnero = Date.UTC(anio, 0, 4);
  const lunesSemana1 = cuatroEnero - ((new Date(cuatroEnero).getUTCDay() + 6) % 7) * DIA_MS;
  return lunesSemana1 + (semana - 1) * 7 * DIA_MS;
}

export function semanaAnterior(clave: string): string {
  return claveDeDiaUtc(lunesDeClave(clave) - 7 * DIA_MS);
}

/** Semanas completas entre dos claves (b − a). */
export function semanasEntre(a: string, b: string): number {
  return Math.round((lunesDeClave(b) - lunesDeClave(a)) / (7 * DIA_MS));
}

/** Diferencia entre la hora local y UTC en ese instante, en milisegundos. */
function desfase(instante: number): number {
  const { anio, mes, dia } = fechaLocal(new Date(instante));
  const hora = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_HORARIA,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(instante))
    .split(":")
    .map(Number);
  const comoUtc = Date.UTC(anio, mes - 1, dia, hora[0], hora[1]);
  return comoUtc - Math.floor(instante / 60_000) * 60_000;
}

/** Instante de la medianoche local del día dado. */
export function medianocheLocal(anio: number, mes: number, dia: number): Date {
  const aproximado = Date.UTC(anio, mes - 1, dia);
  return new Date(aproximado - desfase(aproximado - desfase(aproximado)));
}

/** Inicio (lunes 00:00 local) de la semana de la clave. */
export function inicioDeSemana(clave: string): Date {
  const lunes = new Date(lunesDeClave(clave));
  return medianocheLocal(lunes.getUTCFullYear(), lunes.getUTCMonth() + 1, lunes.getUTCDate());
}

/** Inicio de la semana siguiente: cuándo vuelve a contar una visita. */
export function inicioProximaSemana(instante: Date = new Date()): Date {
  const lunes = new Date(lunesDeClave(claveSemana(instante)) + 7 * DIA_MS);
  return medianocheLocal(lunes.getUTCFullYear(), lunes.getUTCMonth() + 1, lunes.getUTCDate());
}

/** Medianoche local de una fecha «AAAA-MM-DD». */
export function inicioDeDia(texto: string): Date {
  const [anio, mes, dia] = texto.split("-").map(Number);
  return medianocheLocal(anio, mes, dia);
}

/** «AAAA-MM-DD» del día siguiente. */
export function diaSiguiente(texto: string): string {
  const [anio, mes, dia] = texto.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia + 1)).toISOString().slice(0, 10);
}

export type EstadoRiego = "regado" | "listo" | "sediento" | "nuevo";

/**
 * Estado del árbol virtual esta semana:
 * regado (ya contó esta semana), listo (puede volver a crecer) o sediento
 * (tres semanas o más sin visita). Solo es visual: nunca se pierde progreso.
 */
export function estadoRiego(ultimaSemana: string | null, semanaActual: string): EstadoRiego {
  if (!ultimaSemana) return "nuevo";
  const diferencia = semanasEntre(ultimaSemana, semanaActual);
  if (diferencia <= 0) return "regado";
  if (diferencia >= 3) return "sediento";
  return "listo";
}
