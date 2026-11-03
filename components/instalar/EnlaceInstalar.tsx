"use client";

import { useCallback, useState } from "react";
import { Icono } from "@/components/Icono";
import { DialogoInstalar } from "./DialogoInstalar";
import { useInstalacion } from "./useInstalacion";

/** Acceso permanente a la guía (bajo el inicio de sesión y en el perfil). Se oculta dentro de la app instalada. */
export function EnlaceInstalar({ qr, variante = "enlace" }: { qr?: string | null; variante?: "enlace" | "tarjeta" }) {
  const { entorno, instalada } = useInstalacion();
  const [abierto, setAbierto] = useState(false);
  const cerrar = useCallback(() => setAbierto(false), []);
  if (!entorno || instalada) return null;

  return (
    <>
      {variante === "tarjeta" ? (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="flex w-full items-center gap-4 rounded-3xl border border-linea bg-tarjeta p-4 text-left shadow-tarjeta transition hover:-translate-y-0.5 active:scale-[.99]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icono-192.png" alt="" className="size-12 shrink-0 rounded-2xl" />
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Instala la app</span>
            <span className="block text-sm text-tinta-suave">Ábrela desde tu pantalla de inicio, sin tienda de apps.</span>
          </span>
          <Icono nombre="flechaDer" className="size-5 shrink-0 text-tinta-suave" />
        </button>
      ) : (
        <div className="mt-6 flex justify-center border-t border-linea pt-5">
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="flex items-center gap-1.5 text-sm font-bold text-musgo underline decoration-musgo/30 underline-offset-4 hover:decoration-musgo"
          >
            <Icono nombre="telefono" className="size-4" /> Instala la app en tu teléfono
          </button>
        </div>
      )}
      <DialogoInstalar abierto={abierto} alCerrar={cerrar} qr={qr} textoContinuar="Cerrar" />
    </>
  );
}
