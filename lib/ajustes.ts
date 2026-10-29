import { consulta, type Cliente } from "@/lib/db";
import { AJUSTES_BASE, type Ajustes } from "@/lib/juego/reglas";

export async function leerAjustes(cliente?: Cliente): Promise<Ajustes> {
  const filas = await consulta<{ clave: string; valor: unknown }>("SELECT clave, valor FROM ajustes", [], cliente);
  const ajustes = { ...AJUSTES_BASE } as Record<string, unknown>;
  for (const { clave, valor } of filas) if (clave in ajustes) ajustes[clave] = valor;
  return ajustes as unknown as Ajustes;
}
