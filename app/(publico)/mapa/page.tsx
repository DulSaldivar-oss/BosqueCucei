import type { Metadata } from "next";
import { MapaArboles } from "@/components/MapaArboles";
import { leerAjustes } from "@/lib/ajustes";
import { usuarioActual } from "@/lib/auth";
import { arbolesParaMapa } from "@/lib/consultas/publico";
import { pool } from "@/lib/db";
import { refrescarEstados } from "@/lib/servicios/alertas";

export const metadata: Metadata = { title: "Mapa del arbolado" };

export default async function PaginaMapa({ searchParams }: { searchParams: Promise<{ arbol?: string }> }) {
  const [usuario, { arbol }] = await Promise.all([usuarioActual(), searchParams]);
  await refrescarEstados(pool(), await leerAjustes());
  const puntos = await arbolesParaMapa(usuario?.id ?? null);
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Mapa del arbolado</h1>
        <p className="text-tinta-suave">El color del marcador es el estado de salud; el centro, el color de la especie.</p>
      </header>
      <MapaArboles
        puntos={puntos}
        conSesion={!!usuario}
        inicial={arbol}
        className="h-[calc(100dvh-19rem)] min-h-[420px] md:h-[calc(100dvh-15rem)]"
      />
    </div>
  );
}
