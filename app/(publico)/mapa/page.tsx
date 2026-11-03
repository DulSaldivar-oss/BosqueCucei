import type { Metadata } from "next";
import Link from "next/link";
import { MapaArboles } from "@/components/MapaArboles";
import { MapaCercano } from "@/components/MapaCercano";
import { leerAjustes } from "@/lib/ajustes";
import { usuarioActual } from "@/lib/auth";
import { arbolesCerca, arbolesParaMapa, ubicacionArbol } from "@/lib/consultas/publico";
import { pool } from "@/lib/db";
import { fondoMapa, RADIO_CERCA_M } from "@/lib/mapa";
import { refrescarEstados } from "@/lib/servicios/alertas";

export const metadata: Metadata = { title: "Mapa del arbolado" };

const ALTO = "h-[calc(100dvh-21rem)] min-h-[420px] md:h-[calc(100dvh-17rem)]";

/**
 * Por defecto el mapa muestra solo los árboles a RADIO_CERCA_M metros de la persona (los pide
 * MapaCercano con su ubicación). Con ?arbol= muestra ese árbol y sus vecinos, con ?especie= los de
 * esa especie y con ?todos=1 el campus completo.
 */
export default async function PaginaMapa({
  searchParams,
}: {
  searchParams: Promise<{ arbol?: string; especie?: string; todos?: string }>;
}) {
  const [usuario, { arbol, especie, todos }] = await Promise.all([usuarioActual(), searchParams]);
  await refrescarEstados(pool(), await leerAjustes());
  const usuarioId = usuario?.id ?? null;
  const fondo = fondoMapa();
  const centro = arbol ? await ubicacionArbol(arbol) : null;
  const modo = centro ? "arbol" : especie ? "especie" : todos ? "todos" : "cerca";

  let mapa: React.ReactNode;
  if (modo === "cerca") {
    mapa = <MapaCercano radio={RADIO_CERCA_M} conSesion={!!usuario} fondo={fondo} className={ALTO} />;
  } else {
    const puntos =
      modo === "arbol"
        ? (await arbolesCerca(usuarioId, centro!.latitud, centro!.longitud, RADIO_CERCA_M)).puntos
        : await arbolesParaMapa(usuarioId, modo === "especie" ? especie : undefined);
    mapa = (
      <MapaArboles puntos={puntos} conSesion={!!usuario} inicial={centro?.codigo} especie={especie} fondo={fondo} className={ALTO} />
    );
  }

  const opcion = (activa: boolean) =>
    `rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition active:scale-95 ${activa ? "bg-musgo text-papel" : "text-tinta-suave hover:text-tinta"}`;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Mapa del arbolado</h1>
          <p className="text-tinta-suave">
            {modo === "cerca"
              ? `Los árboles a ${RADIO_CERCA_M} m de ti. El mapa te sigue mientras caminas.`
              : modo === "arbol"
                ? `${centro!.codigo} y los árboles a ${RADIO_CERCA_M} m.`
                : "El color del marcador es el estado de salud; el centro, el color de la especie."}
          </p>
        </div>
        <nav aria-label="Qué árboles mostrar" className="flex gap-1 rounded-full bg-papel-2 p-1">
          <Link href="/mapa" className={opcion(modo === "cerca")} aria-current={modo === "cerca" ? "page" : undefined}>
            Cerca de mí
          </Link>
          <Link href="/mapa?todos=1" className={opcion(modo === "todos")} aria-current={modo === "todos" ? "page" : undefined}>
            Todo el campus
          </Link>
        </nav>
      </header>
      {mapa}
    </div>
  );
}
