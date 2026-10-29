"use server";

import { revalidatePath } from "next/cache";
import { usuarioActual } from "@/lib/auth";
import { consulta } from "@/lib/db";

/** Seguir / dejar de seguir un árbol que ya descubriste («Árboles que cuido»). */
export async function alternarGuardian(arbolId: number, codigo: string) {
  const usuario = await usuarioActual();
  if (!usuario) return;
  await consulta("UPDATE usuario_arbol SET guardian = NOT guardian WHERE usuario_id = $1 AND arbol_id = $2", [usuario.id, arbolId]);
  revalidatePath(`/arbol/${codigo}`);
  revalidatePath("/jardin");
}
