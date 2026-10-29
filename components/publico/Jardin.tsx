"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArbolSprite } from "@/components/ArbolSprite";
import { Icono } from "@/components/Icono";
import { etapaPorVisitas, nombreEtapa, siguienteEtapa, VISITAS_POR_ETAPA } from "@/lib/juego/crecimiento";
import type { EstadoRiego } from "@/lib/juego/semana";
import type { GenomaSprite } from "@/lib/sprites/generar";

export interface ArbolDelJardin {
  arbolId: number;
  codigo: string;
  nombre: string;
  especie: string;
  zona: string;
  visitas: number;
  riego: EstadoRiego;
  guardian: boolean;
  sprite: GenomaSprite;
}

const TILE = 100;
/** Altura de la burbuja de riego según la etapa: los árboles chicos la llevan más abajo. */
const ALTURA_BURBUJA = ["68%", "64%", "56%", "46%", "32%", "22%", "16%"];
const MARGEN_SUPERIOR = 120;

/** Casillas ordenadas del centro hacia afuera: el jardín crece desde el centro. */
function casillas(n: number) {
  const lista: { i: number; j: number }[] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) lista.push({ i, j });
  const centro = (n - 1) / 2;
  return lista.sort((a, b) => Math.hypot(a.i - centro, a.j - centro) - Math.hypot(b.i - centro, b.j - centro) || a.i + a.j - (b.i + b.j));
}

export function Jardin({ arboles }: { arboles: ArbolDelJardin[] }) {
  const [elegido, setElegido] = useState<ArbolDelJardin | null>(null);
  const n = Math.max(3, Math.ceil(Math.sqrt(arboles.length + 1)));
  const ancho = n * TILE;
  const alto = (n * TILE) / 2 + MARGEN_SUPERIOR + 18;
  const posiciones = useMemo(() => casillas(n), [n]);

  useEffect(() => {
    if (!elegido) return;
    const cerrar = (e: KeyboardEvent) => e.key === "Escape" && setElegido(null);
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, [elegido]);

  const centro = (i: number, j: number) => ({
    x: ancho / 2 + ((i - j) * TILE) / 2,
    y: MARGEN_SUPERIOR + ((i + j) * TILE) / 4 + TILE / 4,
  });

  const rombo = (i: number, j: number) => {
    const { x, y } = centro(i, j);
    return `${x},${y - TILE / 4} ${x + TILE / 2},${y} ${x},${y + TILE / 4} ${x - TILE / 2},${y}`;
  };

  const ocupadas = new Set(posiciones.slice(0, arboles.length).map((p) => `${p.i}-${p.j}`));
  const izquierda = centro(n - 1, 0);
  const derecha = centro(0, n - 1);
  const abajo = centro(n - 1, n - 1);

  return (
    <>
      <div className="relative mx-auto w-full max-w-3xl select-none" style={{ aspectRatio: `${ancho} / ${alto}` }}>
        <svg viewBox={`0 0 ${ancho} ${alto}`} className="absolute inset-0 size-full" aria-hidden="true">
          {/* Isla de tierra bajo el pasto */}
          <polygon
            points={`${izquierda.x - TILE / 2},${izquierda.y} ${abajo.x},${abajo.y + TILE / 4} ${abajo.x},${abajo.y + TILE / 4 + 16} ${izquierda.x - TILE / 2},${izquierda.y + 16}`}
            fill="#7a5a40"
          />
          <polygon
            points={`${abajo.x},${abajo.y + TILE / 4} ${derecha.x + TILE / 2},${derecha.y} ${derecha.x + TILE / 2},${derecha.y + 16} ${abajo.x},${abajo.y + TILE / 4 + 16}`}
            fill="#614632"
          />
          {posiciones.map(({ i, j }) => {
            const ocupada = ocupadas.has(`${i}-${j}`);
            const { x, y } = centro(i, j);
            return (
              <g key={`${i}-${j}`}>
                <polygon points={rombo(i, j)} fill={(i + j) % 2 === 0 ? "#a5c77f" : "#99be72"} stroke="#8fb468" strokeWidth="1" />
                {!ocupada && (
                  <g opacity=".55">
                    <path d={`M${x - 10} ${y + 2} q2 -7 4 0 M${x + 4} ${y - 3} q2 -6 4 0 M${x - 2} ${y + 7} q2 -6 4 0`} stroke="#6f9a4c" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {arboles.map((a, k) => {
          const { i, j } = posiciones[k];
          const { x, y } = centro(i, j);
          const anchoSprite = TILE * 1.2;
          const altoSprite = anchoSprite * 1.2;
          const etapa = etapaPorVisitas(a.visitas);
          return (
            <motion.button
              key={a.arbolId}
              type="button"
              onClick={() => setElegido(a)}
              aria-label={`${a.nombre}, ${nombreEtapa(etapa)}. ${a.riego === "regado" ? "Regado esta semana" : a.riego === "sediento" ? "Tiene sed" : "Listo para regar"}`}
              initial={{ opacity: 0, y: 20, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 + k * 0.05, type: "spring", stiffness: 260, damping: 18 }}
              whileTap={{ scale: 0.9 }}
              className="absolute origin-bottom focus-visible:outline-none"
              style={{
                left: `${((x - anchoSprite / 2) / ancho) * 100}%`,
                top: `${((y + TILE * 0.08 - altoSprite * (222 / 240)) / alto) * 100}%`,
                width: `${(anchoSprite / ancho) * 100}%`,
                zIndex: 10 + i + j,
              }}
            >
              <ArbolSprite
                genoma={a.sprite}
                etapa={etapa}
                semilla={a.codigo}
                vivo
                retraso={-(k % 7) * 0.8}
                encuadre="completo"
                className={`aspect-[5/6] w-full transition ${a.riego === "sediento" ? "saturate-[.4] sepia-[.25]" : ""}`}
              />
              <span
                style={{ top: ALTURA_BURBUJA[etapa] }}
                className={`absolute right-[10%] grid size-[20%] max-h-7 min-h-5 max-w-7 min-w-5 place-items-center rounded-full border-2 border-tarjeta shadow-tarjeta ${
                  a.riego === "regado" ? "bg-agua text-white" : a.riego === "sediento" ? "animate-flotar bg-tabachin text-white" : "animate-flotar bg-tarjeta text-agua"
                }`}
              >
                <Icono nombre={a.riego === "regado" ? "check" : "gota"} className="size-[60%]" grosor={2.6} />
              </span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {elegido && (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar"
              className="fixed inset-0 z-50 bg-tinta/30 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setElegido(null)}
            />
            <Hoja arbol={elegido} alCerrar={() => setElegido(null)} />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Hoja({ arbol, alCerrar }: { arbol: ArbolDelJardin; alCerrar: () => void }) {
  const etapa = etapaPorVisitas(arbol.visitas);
  const siguiente = siguienteEtapa(arbol.visitas);
  const desde = VISITAS_POR_ETAPA[etapa];
  const hasta = siguiente ? VISITAS_POR_ETAPA[siguiente.etapa] : desde;
  const avance = siguiente ? ((arbol.visitas - desde) / (hasta - desde)) * 100 : 100;
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={arbol.nombre}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 380, damping: 36 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.6 }}
      onDragEnd={(_, info) => info.offset.y > 90 && alCerrar()}
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-[32px] bg-tarjeta px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-flotante md:bottom-6 md:rounded-[32px]"
    >
      <span className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-linea" aria-hidden="true" />
      <div className="flex items-start gap-4">
        <ArbolSprite genoma={arbol.sprite} etapa={etapa} semilla={arbol.codigo} vivo className="w-24 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-tinta-suave">{arbol.codigo}</p>
          <h2 className="font-display truncate text-2xl font-bold">{arbol.nombre}</h2>
          <p className="text-sm text-tinta-suave">
            {arbol.especie} · {arbol.zona}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-musgo-claro px-3 py-1 text-xs font-bold text-musgo-oscuro">
            <Icono nombre="jardin" className="size-3.5" /> {nombreEtapa(etapa)}
          </p>
        </div>
        <button type="button" onClick={alCerrar} aria-label="Cerrar" className="grid size-9 shrink-0 place-items-center rounded-full bg-papel-2">
          <Icono nombre="cerrar" className="size-4" />
        </button>
      </div>

      <div className="mt-5">
        <div className="flex justify-between text-xs font-semibold text-tinta-suave">
          <span>
            {arbol.visitas} {arbol.visitas === 1 ? "visita válida" : "visitas válidas"}
          </span>
          <span>{siguiente ? `${siguiente.faltan} más para ${nombreEtapa(siguiente.etapa)}` : "¡Etapa máxima!"}</span>
        </div>
        <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-papel-2">
          <motion.div
            className="brillo-barra h-full rounded-full bg-brote"
            initial={{ width: 0 }}
            animate={{ width: `${avance}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          />
        </div>
      </div>

      <p
        className={`mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${
          arbol.riego === "regado" ? "bg-agua-claro text-[#1d5d8c]" : arbol.riego === "sediento" ? "bg-tabachin/10 text-tabachin" : "bg-musgo-claro text-musgo-oscuro"
        }`}
      >
        <Icono nombre="gota" className="size-4 shrink-0" grosor={2.2} />
        {arbol.riego === "regado"
          ? "Ya lo regaste esta semana. Vuelve el lunes."
          : arbol.riego === "sediento"
            ? "¡Tiene sed! Hace semanas que no lo visitas."
            : "Listo para regar: visítalo y regístralo esta semana."}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href={`/arbol/${arbol.codigo}`} className="flex items-center justify-center gap-2 rounded-full bg-musgo px-4 py-3 text-sm font-bold text-papel active:scale-95">
          Ver ficha
        </Link>
        <Link href={`/mapa?arbol=${arbol.codigo}`} className="flex items-center justify-center gap-2 rounded-full border border-musgo/30 px-4 py-3 text-sm font-bold text-musgo active:scale-95">
          <Icono nombre="ubicacion" className="size-4" /> En el mapa
        </Link>
      </div>
    </motion.div>
  );
}
