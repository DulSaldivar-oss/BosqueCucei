"use client";

import { Icono } from "@/components/Icono";
import { botonPrimario } from "./Piezas";

export function BotonImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className={botonPrimario}>
      <Icono nombre="imprimir" className="size-4" /> Imprimir
    </button>
  );
}
