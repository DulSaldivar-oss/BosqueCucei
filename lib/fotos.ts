import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const TAMANO_MAXIMO_FOTO = 5 * 1024 * 1024;
const NOMBRE_VALIDO = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

export function carpetaFotos() {
  // La carpeta se decide al ejecutar (volumen de Docker); no debe rastrearse al compilar.
  return path.resolve(/*turbopackIgnore: true*/ process.env.CARPETA_FOTOS ?? "./.datos/fotos");
}

function extension(bytes: Uint8Array): "jpg" | "png" | "webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

/** Guarda la imagen si es JPG, PNG o WebP real y devuelve el nombre del archivo. */
export async function guardarFoto(archivo: File): Promise<string> {
  if (archivo.size > TAMANO_MAXIMO_FOTO) throw new Error("La foto pesa más de 5 MB.");
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const ext = extension(bytes);
  if (!ext) throw new Error("La foto debe ser JPG, PNG o WebP.");
  const nombre = `${randomUUID()}.${ext}`;
  await mkdir(carpetaFotos(), { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ carpetaFotos(), nombre), bytes);
  return nombre;
}

export async function leerFoto(nombre: string) {
  if (!NOMBRE_VALIDO.test(nombre)) return null;
  try {
    const datos = await readFile(path.join(/*turbopackIgnore: true*/ carpetaFotos(), nombre));
    const tipo = nombre.endsWith(".png") ? "image/png" : nombre.endsWith(".webp") ? "image/webp" : "image/jpeg";
    return { datos, tipo };
  } catch {
    return null;
  }
}

export async function borrarFoto(nombre: string) {
  if (NOMBRE_VALIDO.test(nombre)) await unlink(path.join(/*turbopackIgnore: true*/ carpetaFotos(), nombre)).catch(() => {});
}

export const urlFoto = (nombre: string | null) => (nombre ? `/fotos/${nombre}` : null);
