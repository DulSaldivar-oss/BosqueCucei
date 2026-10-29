import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

const scrypt = (clave: string, sal: Buffer, largo: number, opciones: ScryptOptions) =>
  new Promise<Buffer>((resolver, rechazar) =>
    scryptCb(clave, sal, largo, opciones, (error, derivada) => (error ? rechazar(error) : resolver(derivada))),
  );

const PARAMETROS = { N: 16384, r: 8, p: 1 };

export async function hashContrasena(contrasena: string): Promise<string> {
  const sal = randomBytes(16);
  const derivada = await scrypt(contrasena.normalize("NFKC"), sal, 32, PARAMETROS);
  return `scrypt$${PARAMETROS.N}$${PARAMETROS.r}$${PARAMETROS.p}$${sal.toString("base64")}$${derivada.toString("base64")}`;
}

export async function verificarContrasena(contrasena: string, guardado: string): Promise<boolean> {
  const [tipo, N, r, p, sal, hash] = guardado.split("$");
  if (tipo !== "scrypt" || !sal || !hash) return false;
  const esperado = Buffer.from(hash, "base64");
  const derivada = await scrypt(contrasena.normalize("NFKC"), Buffer.from(sal, "base64"), esperado.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });
  return derivada.length === esperado.length && timingSafeEqual(derivada, esperado);
}
