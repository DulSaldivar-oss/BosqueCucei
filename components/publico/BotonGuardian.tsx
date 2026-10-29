"use client";

import { useOptimistic, useTransition } from "react";
import { Icono } from "@/components/Icono";
import { alternarGuardian } from "@/lib/acciones/arbol";

export function BotonGuardian({ arbolId, codigo, guardian }: { arbolId: number; codigo: string; guardian: boolean }) {
  const [optimista, cambiar] = useOptimistic(guardian, (_, nuevo: boolean) => nuevo);
  const [, iniciar] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={optimista}
      onClick={() =>
        iniciar(async () => {
          cambiar(!optimista);
          await alternarGuardian(arbolId, codigo);
        })
      }
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition active:scale-95 ${
        optimista ? "bg-tabachin text-white" : "border border-tabachin/40 text-tabachin hover:bg-tabachin/10"
      }`}
    >
      <Icono nombre="corazon" className={`size-4 ${optimista ? "animate-pop" : ""}`} grosor={2.2} />
      {optimista ? "Lo cuidas" : "Cuidar este árbol"}
    </button>
  );
}
