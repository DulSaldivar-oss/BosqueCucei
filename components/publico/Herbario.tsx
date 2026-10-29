"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { ArbolSprite } from "@/components/ArbolSprite";
import { Icono } from "@/components/Icono";
import { RAREZAS, type Rareza } from "@/lib/juego/catalogos";
import type { GenomaSprite } from "@/lib/sprites/generar";

export interface FichaHerbario {
  slug: string;
  nombre: string;
  cientifico: string;
  familia: string;
  rareza: Rareza;
  sprite: GenomaSprite;
  descubierta: string | null;
  pista: string;
  ejemplares: number;
}

const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" });

export function Herbario({ fichas, conSesion }: { fichas: FichaHerbario[]; conSesion: boolean }) {
  const [filtro, setFiltro] = useState<"todas" | "descubiertas" | "pendientes">("todas");
  const visibles = fichas.filter((f) =>
    filtro === "todas" ? true : filtro === "descubiertas" ? f.descubierta : !f.descubierta,
  );
  const descubiertas = fichas.filter((f) => f.descubierta).length;

  return (
    <div className="space-y-5">
      {conSesion && (
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["todas", `Todas (${fichas.length})`],
              ["descubiertas", `Descubiertas (${descubiertas})`],
              ["pendientes", `Por descubrir (${fichas.length - descubiertas})`],
            ] as const
          ).map(([id, texto]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filtro === id}
              onClick={() => setFiltro(id)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 ${
                filtro === id ? "bg-tinta text-papel" : "border border-linea bg-tarjeta text-tinta-suave hover:text-tinta"
              }`}
            >
              {texto}
            </button>
          ))}
        </div>
      )}

      <motion.ul layout className="grid grid-cols-2 gap-3 min-[560px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {visibles.map((f, i) => {
          const bloqueada = conSesion && !f.descubierta;
          const rareza = RAREZAS[f.rareza];
          return (
            <motion.li
              layout
              key={f.slug}
              initial={{ opacity: 0, y: 16, rotateY: bloqueada ? 0 : 70 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ delay: Math.min(i, 18) * 0.035, type: "spring", stiffness: 220, damping: 22 }}
            >
              <Link
                href={`/especie/${f.slug}`}
                className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border p-3 transition hover:-translate-y-1 active:scale-[.97] ${
                  bloqueada ? "border-dashed border-linea bg-papel-2/50" : "border-linea bg-tarjeta shadow-tarjeta"
                }`}
              >
                <span
                  className="absolute top-2.5 left-2.5 z-10 rounded-full px-2 py-0.5 text-[10px] font-black tracking-wide uppercase"
                  style={{ backgroundColor: `${rareza.color}22`, color: rareza.color }}
                >
                  {rareza.etiqueta}
                </span>
                {bloqueada && (
                  <span className="absolute top-2.5 right-2.5 z-10 grid size-7 place-items-center rounded-full bg-tarjeta text-tinta-suave">
                    <Icono nombre="candado" className="size-3.5" grosor={2.2} />
                  </span>
                )}
                <div className={`relative mx-auto mt-3 aspect-[5/6] w-full ${bloqueada ? "" : "rounded-2xl bg-gradient-to-b from-transparent to-musgo-claro/60"}`}>
                  <ArbolSprite genoma={f.sprite} etapa={5} semilla={f.slug} silueta={bloqueada ? "#d8cdb9" : undefined} vivo={!bloqueada} retraso={-i * 0.4} />
                  {bloqueada && <span className="brillo-barra absolute inset-0 rounded-2xl opacity-60" aria-hidden="true" />}
                </div>
                <p className={`mt-2 truncate font-bold ${bloqueada ? "text-tinta-suave" : ""}`}>{bloqueada ? "???" : f.nombre}</p>
                <p className="truncate text-xs text-tinta-suave italic">{bloqueada ? f.familia : f.cientifico}</p>
                <p className="mt-1.5 text-[11px] leading-snug font-semibold text-tinta-suave">
                  {bloqueada ? (
                    <>
                      <Icono nombre="ubicacion" className="mr-0.5 inline size-3" /> {f.pista}
                    </>
                  ) : f.descubierta ? (
                    <>Descubierta el {fecha.format(new Date(f.descubierta))}</>
                  ) : (
                    <>
                      {f.ejemplares} {f.ejemplares === 1 ? "ejemplar" : "ejemplares"} en el campus
                    </>
                  )}
                </p>
              </Link>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}
