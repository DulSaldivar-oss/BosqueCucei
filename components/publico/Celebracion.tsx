"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArbolSprite } from "@/components/ArbolSprite";
import { Icono } from "@/components/Icono";
import { nombreEtapa } from "@/lib/juego/crecimiento";
import { tituloNivel } from "@/lib/juego/niveles";
import { diasHasta } from "@/lib/juego/semana";
import type { ResultadoObservacion } from "@/lib/servicios/observar";
import type { ArbolParaObservar } from "./FormularioObservacion";

const fechaLunes = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Mexico_City" });
const COLORES_CONFETI = ["#B5D334", "#EDBB1F", "#8E6CC4", "#E4572E", "#3B9AE1", "#8DB766"];

function Regadera() {
  return (
    <svg viewBox="0 0 120 90" className="w-28 sm:w-32" aria-hidden="true">
      <path d="M22 36h52v34a10 10 0 0 1-10 10H32a10 10 0 0 1-10-10V36Z" fill="#3B9AE1" />
      <path d="M22 36h52v8H22z" fill="#2F86C8" />
      <path d="M74 46 106 26l5 6-31 22Z" fill="#3B9AE1" />
      <ellipse cx="108" cy="29" rx="5" ry="7" transform="rotate(-35 108 29)" fill="#2F86C8" />
      <path d="M30 36V26a12 12 0 0 1 12-12h12" fill="none" stroke="#2F86C8" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="38" cy="54" rx="6" ry="10" fill="#fff" opacity=".25" />
    </svg>
  );
}

/** Pantalla de recompensa después de observar: riego, crecimiento, experiencia y misiones. */
export function Celebracion({ resultado, arbol }: { resultado: ResultadoObservacion; arbol: ArbolParaObservar }) {
  const reducido = useReducedMotion();
  const [fase, setFase] = useState<"regando" | "creciendo" | "listo">(resultado.cuenta && !reducido ? "regando" : "listo");
  const { xp, arbol: crecimiento } = resultado;
  const crecio = crecimiento.etapaDespues > crecimiento.etapaAntes;
  const subioNivel = xp.nivelDespues > xp.nivelAntes;

  useEffect(() => {
    if (fase !== "regando") return;
    const t1 = setTimeout(() => setFase("creciendo"), 1500);
    const t2 = setTimeout(() => setFase("listo"), 2300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [fase]);

  const etapaVisible = fase === "regando" ? crecimiento.etapaAntes : crecimiento.etapaDespues;

  if (!resultado.cuenta) {
    const lunes = new Date(resultado.proximaSemana);
    const dias = diasHasta(lunes, 1);
    return (
      <div className="mx-auto max-w-md pt-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative mx-auto w-48">
          <ArbolSprite genoma={arbol.sprite} etapa={crecimiento.etapaDespues} semilla={arbol.codigo} vivo />
          <span className="absolute top-4 right-0 grid size-12 animate-flotar place-items-center rounded-full bg-agua text-white shadow-flotante">
            <Icono nombre="gota" className="size-6" grosor={2.2} />
          </span>
        </motion.div>
        <h1 className="font-display mt-4 text-3xl font-bold">¡Observación registrada!</h1>
        <p className="mt-2 text-tinta-suave">
          Este árbol ya bebió esta semana, así que no suma experiencia. Tu reporte sí ayuda a Sustentabilidad a cuidarlo.
        </p>
        <div className="mt-5 rounded-3xl bg-agua-claro p-4 text-[#1d5d8c]">
          <p className="text-sm font-semibold">Vuelve a regarlo desde el</p>
          <p className="font-display text-xl font-bold first-letter:uppercase">{fechaLunes.format(lunes)}</p>
          <p className="text-sm">
            en {dias} {dias === 1 ? "día" : "días"}
          </p>
        </div>
        <Botones codigo={arbol.codigo} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg pt-2 text-center">
      <div className="relative mx-auto aspect-[5/4] w-full max-w-sm overflow-hidden rounded-[32px] bg-gradient-to-b from-[#d6e7ee] via-[#eaf0dd] to-[#efe5cf]">
        <div className="absolute inset-x-0 bottom-0 h-[16%] bg-[#9fc27a]" />
        <AnimatePresence mode="popLayout">
          <motion.div
            key={etapaVisible}
            initial={{ scale: fase === "listo" || fase === "creciendo" ? 0.4 : 1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.15, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
            className="absolute inset-x-[18%] bottom-[6%] origin-bottom"
          >
            <ArbolSprite genoma={arbol.sprite} etapa={etapaVisible} semilla={arbol.codigo} vivo />
          </motion.div>
        </AnimatePresence>

        {fase === "regando" && (
          <>
            <motion.div
              initial={{ x: 120, y: -40, rotate: 0, opacity: 0 }}
              animate={{ x: 0, y: 0, rotate: -28, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
              className="absolute top-[6%] right-[8%]"
            >
              <Regadera />
            </motion.div>
            <div className="absolute top-[30%] left-[44%] h-1/2 w-[20%]" aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => (
                <span
                  key={i}
                  className="gota-cayendo absolute block h-3 w-2 rounded-full bg-agua"
                  style={{ left: `${(i * 23) % 100}%`, "--retraso": `${(i % 5) * 0.15}s`, "--caida": "110px" } as React.CSSProperties}
                />
              ))}
            </div>
          </>
        )}

        {fase !== "regando" &&
          !reducido &&
          Array.from({ length: 18 }, (_, i) => {
            const angulo = (i / 18) * Math.PI * 2;
            return (
              <motion.span
                key={i}
                aria-hidden="true"
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{ x: Math.cos(angulo) * (90 + (i % 3) * 30), y: Math.sin(angulo) * (70 + (i % 4) * 20) - 20, opacity: 0, rotate: 360 }}
                transition={{ duration: 1.3, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 block size-3 rounded-[50%_0]"
                style={{ backgroundColor: COLORES_CONFETI[i % COLORES_CONFETI.length] }}
              />
            );
          })}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reducido ? 0 : 0.3 }}>
        <h1 className="font-display mt-5 text-3xl leading-tight font-bold sm:text-4xl">
          {crecimiento.descubrimiento ? "¡Nuevo árbol en tu jardín!" : crecio ? "¡Tu árbol creció!" : "¡Árbol regado!"}
        </h1>
        <p className="mt-1 text-tinta-suave">
          {arbol.nombre} ahora es <strong className="text-musgo">{nombreEtapa(crecimiento.etapaDespues)}</strong> · {crecimiento.visitas}{" "}
          {crecimiento.visitas === 1 ? "visita" : "visitas"}
        </p>
      </motion.div>

      {crecimiento.especieNueva && (
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: reducido ? 0 : 1.6, type: "spring" }}
          className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-jacaranda/15 px-4 py-2 text-sm font-bold text-jacaranda"
        >
          <Icono nombre="herbario" className="size-4" /> {arbol.especie} entró a tu herbario
        </motion.p>
      )}

      <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left">
        {xp.desglose.map((p, i) => (
          <motion.li
            key={`${p.motivo}-${i}`}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reducido ? 0 : 1.2 + i * 0.18 }}
            className={`flex items-center justify-between rounded-2xl px-4 py-2.5 ${p.motivo === "mision" ? "bg-primavera/20" : "bg-tarjeta shadow-tarjeta"}`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Icono nombre={p.motivo === "mision" ? "misiones" : p.motivo === "racha" ? "fuego" : p.motivo === "foto" ? "camara" : "hoja"} className="size-4 text-musgo" />
              {p.etiqueta}
            </span>
            <span className="font-bold text-musgo">+{p.cantidad}</span>
          </motion.li>
        ))}
      </ul>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reducido ? 0 : 1.3 + xp.desglose.length * 0.18 }}
        className="font-display mt-4 text-4xl font-bold text-musgo"
      >
        +{xp.ganada} XP
      </motion.p>

      {subioNivel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: reducido ? 0 : 1.6 + xp.desglose.length * 0.18, type: "spring", stiffness: 200, damping: 12 }}
          className="relative mx-auto mt-5 max-w-sm overflow-hidden rounded-3xl bg-musgo-oscuro p-5 text-papel"
        >
          <span className="brillo-barra absolute inset-0" aria-hidden="true" />
          <p className="relative text-xs font-black tracking-widest text-brote uppercase">¡Subiste de nivel!</p>
          <p className="font-display relative text-3xl font-bold">
            Nivel {xp.nivelDespues} · {tituloNivel(xp.nivelDespues)}
          </p>
        </motion.div>
      )}

      <Botones codigo={arbol.codigo} retraso={reducido ? 0 : 0.8} />
    </div>
  );
}

function Botones({ codigo, retraso = 0 }: { codigo: string; retraso?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: retraso }}
      className="mx-auto mt-7 flex max-w-sm flex-col gap-2 min-[400px]:flex-row"
    >
      <Link href="/jardin" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-musgo px-5 py-3.5 font-bold text-papel shadow-flotante transition hover:bg-musgo-oscuro active:scale-95">
        <Icono nombre="jardin" className="size-5" /> Ver mi jardín
      </Link>
      <Link href={`/arbol/${codigo}`} className="flex flex-1 items-center justify-center rounded-full bg-tarjeta px-5 py-3.5 font-bold text-musgo shadow-tarjeta transition active:scale-95">
        Volver al árbol
      </Link>
    </motion.div>
  );
}
