"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArbolSprite } from "@/components/ArbolSprite";
import { Icono } from "@/components/Icono";
import { CATEGORIAS, ESTADOS_REPORTE, type EstadoReporte } from "@/lib/juego/catalogos";
import type { ResultadoObservacion } from "@/lib/servicios/observar";
import type { GenomaSprite } from "@/lib/sprites/generar";
import { Celebracion } from "./Celebracion";

export interface ArbolParaObservar {
  id: number;
  codigo: string;
  nombre: string;
  especie: string;
  sprite: GenomaSprite;
  etapa: number;
}

const CARAS: Record<EstadoReporte, string> = {
  bien: "M8 14.5c1 1.4 2.4 2 4 2s3-.6 4-2",
  diferente: "M8.5 15h7",
  problema: "M8 16.5c1-1.2 2.4-1.8 4-1.8s3 .6 4 1.8",
  revision: "M8 17c1-1.6 2.4-2.4 4-2.4s3 .8 4 2.4M12 5.5v2",
};

/** Reduce la foto en el teléfono (máx. 1600 px, JPEG): sube rápido y quita los metadatos de ubicación. */
async function comprimir(archivo: File): Promise<Blob> {
  try {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, 1600 / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    lienzo.getContext("2d")!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    const blob = await new Promise<Blob | null>((r) => lienzo.toBlob(r, "image/jpeg", 0.82));
    return blob ?? archivo;
  } catch {
    return archivo;
  }
}

export function FormularioObservacion({ arbol, yaRegado }: { arbol: ArbolParaObservar; yaRegado: boolean }) {
  const [estado, setEstado] = useState<EstadoReporte | null>(null);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [comentario, setComentario] = useState("");
  const [foto, setFoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<ResultadoObservacion | null>(null);
  const inicio = useRef(0);
  const seccionDetalle = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inicio.current = Date.now();
  }, []);

  useEffect(() => () => {
    if (foto) URL.revokeObjectURL(foto.url);
  }, [foto]);

  function elegirEstado(valor: EstadoReporte) {
    const primeraVez = estado === null;
    setEstado(valor);
    if (primeraVez) {
      setTimeout(() => seccionDetalle.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 280);
    }
  }

  async function elegirFoto(archivo: File | undefined) {
    if (!archivo) return;
    const blob = await comprimir(archivo);
    if (blob.size > 5 * 1024 * 1024) {
      setError("La foto es muy pesada. Intenta con otra.");
      return;
    }
    setError("");
    setFoto({ blob, url: URL.createObjectURL(blob) });
  }

  async function enviar() {
    if (!estado || enviando) return;
    setEnviando(true);
    setError("");
    const datos = new FormData();
    datos.set("arbol", arbol.codigo);
    datos.set("estado", estado);
    categorias.forEach((c) => datos.append("categorias", c));
    datos.set("comentario", comentario);
    datos.set("duracion", String(Date.now() - inicio.current));
    if (foto) datos.set("foto", foto.blob, "foto.jpg");
    try {
      const respuesta = await fetch("/api/observaciones", { method: "POST", body: datos });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudo guardar.");
      navigator.vibrate?.([40, 60, 40]);
      setResultado(cuerpo as ResultadoObservacion);
    } catch (e) {
      setError((e as Error).message || "No se pudo guardar. Revisa tu conexión.");
      setEnviando(false);
    }
  }

  useEffect(() => {
    if (resultado) window.scrollTo({ top: 0 });
  }, [resultado]);

  if (resultado) return <Celebracion resultado={resultado} arbol={arbol} />;

  const pasos = [estado !== null, categorias.length > 0 || comentario.length > 0, foto !== null];

  return (
    <div className="mx-auto max-w-2xl pb-28">
      <header className="flex items-center gap-3">
        <Link href={`/arbol/${arbol.codigo}`} aria-label="Cancelar y volver al árbol" className="grid size-10 shrink-0 place-items-center rounded-full bg-tarjeta shadow-tarjeta transition active:scale-90">
          <Icono nombre="cerrar" className="size-5" />
        </Link>
        <ArbolSprite genoma={arbol.sprite} etapa={Math.max(arbol.etapa, 3)} semilla={arbol.codigo} vivo className="w-12 shrink-0" />
        <div className="min-w-0">
          <p className="truncate font-bold">{arbol.nombre}</p>
          <p className="font-mono text-xs text-tinta-suave">{arbol.codigo}</p>
        </div>
        <div className="ml-auto flex gap-1.5" aria-hidden="true">
          {pasos.map((hecho, i) => (
            <span key={i} className={`h-2 rounded-full transition-all duration-500 ${hecho ? "w-6 bg-musgo" : "w-2 bg-linea"}`} />
          ))}
        </div>
      </header>

      {yaRegado && (
        <p className="animate-aparecer mt-4 flex items-start gap-2 rounded-2xl bg-agua-claro px-4 py-3 text-sm text-[#1d5d8c]">
          <Icono nombre="gota" className="mt-0.5 size-4 shrink-0" grosor={2.2} />
          Ya regaste este árbol esta semana. Tu observación igual se registra y ayuda a cuidarlo, pero no suma experiencia hasta el lunes.
        </p>
      )}

      <section className="mt-6" aria-labelledby="paso-1">
        <h1 id="paso-1" className="font-display text-2xl font-bold sm:text-3xl">
          ¿Cómo ves este árbol hoy?
        </h1>
        <p className="mt-1 text-sm text-tinta-suave">No necesitas saber qué tiene: solo cuéntanos lo que ves.</p>
        <div className="mt-4 grid grid-cols-2 gap-3" role="radiogroup" aria-labelledby="paso-1">
          {ESTADOS_REPORTE.map((e, i) => {
            const elegido = estado === e.valor;
            return (
              <motion.button
                key={e.valor}
                type="button"
                role="radio"
                aria-checked={elegido}
                onClick={() => elegirEstado(e.valor)}
                whileTap={{ scale: 0.95 }}
                animate={{ scale: elegido ? 1.02 : 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 24 }}
                initial={false}
                className={`relative flex min-h-32 flex-col items-start justify-between rounded-3xl border-2 p-4 text-left transition-colors sm:min-h-36 ${
                  elegido ? "bg-tarjeta shadow-flotante" : "border-transparent bg-tarjeta shadow-tarjeta"
                }`}
                style={{ borderColor: elegido ? e.color : undefined, animation: `aparecer .5s ${i * 60}ms both` }}
              >
                <svg viewBox="0 0 24 24" className="size-11" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill={e.color} opacity={elegido ? 1 : 0.18} />
                  <circle cx="9" cy="10" r="1.3" fill={elegido ? "#fff" : e.color} />
                  <circle cx="15" cy="10" r="1.3" fill={elegido ? "#fff" : e.color} />
                  <path d={CARAS[e.valor]} fill="none" stroke={elegido ? "#fff" : e.color} strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <span>
                  <span className="block leading-tight font-bold">{e.etiqueta}</span>
                  <span className="text-xs text-tinta-suave">{e.detalle}</span>
                </span>
                {elegido && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 grid size-6 place-items-center rounded-full text-white" style={{ backgroundColor: e.color }}>
                    <Icono nombre="check" className="size-4" grosor={3} />
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      <AnimatePresence>
        {estado && (
          <motion.div
            ref={seccionDetalle}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="scroll-mt-20 space-y-8 pt-8"
          >
            <section aria-labelledby="paso-2">
              <h2 id="paso-2" className="font-display text-xl font-bold sm:text-2xl">
                {estado === "bien" ? "¿Algo más que notar?" : "¿Qué observas?"}{" "}
                <span className="font-sans text-sm font-semibold text-tinta-suave">opcional</span>
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {CATEGORIAS.map((c) => {
                  const activa = categorias.includes(c.valor);
                  return (
                    <motion.button
                      key={c.valor}
                      type="button"
                      aria-pressed={activa}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setCategorias((a) => (activa ? a.filter((x) => x !== c.valor) : [...a, c.valor]))}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                        activa ? "border-musgo bg-musgo text-papel" : "border-linea bg-tarjeta text-tinta hover:border-musgo/40"
                      }`}
                    >
                      {activa && <Icono nombre="check" className="size-3.5" grosor={3} />}
                      {c.etiqueta}
                    </motion.button>
                  );
                })}
              </div>
              {(categorias.includes("rama_peligrosa") || categorias.includes("arbol_inclinado")) && (
                <p className="animate-aparecer mt-3 flex items-start gap-2 rounded-2xl bg-estado-revision/10 px-4 py-3 text-sm font-semibold text-estado-revision">
                  <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0" />
                  Gracias. Este reporte avisa de inmediato a Sustentabilidad. Mantén distancia del árbol.
                </p>
              )}
            </section>

            <section aria-labelledby="paso-3" className="grid grid-cols-[auto_1fr] gap-3 sm:gap-4">
              <h2 id="paso-3" className="sr-only">
                Foto y comentario
              </h2>
              <label className="group relative grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-3xl border-2 border-dashed border-linea bg-tarjeta transition hover:border-musgo/50 w-28 sm:w-40">
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => elegirFoto(e.target.files?.[0])} />
                {foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={foto.url} alt="Vista previa de tu foto" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-center text-tinta-suave">
                    <Icono nombre="camara" className="size-8 transition group-hover:scale-110" />
                    <span className="text-sm font-bold">Foto</span>
                    <span className="text-xs">opcional · +5 XP</span>
                  </span>
                )}
                {foto && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setFoto(null);
                    }}
                    className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/55 text-white"
                    aria-label="Quitar foto"
                  >
                    <Icono nombre="cerrar" className="size-4" />
                  </button>
                )}
              </label>
              <label className="block">
                <span className="text-sm font-bold">
                  Comentario <span className="font-semibold text-tinta-suave">opcional</span>
                </span>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="p. ej. Tiene una rama rota del lado de la banca."
                  className="rayado mt-1.5 w-full resize-none rounded-3xl border border-linea bg-tarjeta px-4 py-3 leading-7 outline-none focus:border-musgo focus:ring-4 focus:ring-musgo/15 h-28 sm:h-40"
                />
                <span className="block text-right text-xs text-tinta-suave">{comentario.length}/500</span>
              </label>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p role="alert" className="animate-aparecer mt-4 rounded-2xl bg-tabachin/10 px-4 py-3 text-sm font-semibold text-tabachin">
          {error}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-linea/70 bg-papel/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={enviar}
            disabled={!estado || enviando}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-musgo px-6 py-4 text-base font-bold text-papel shadow-flotante transition hover:bg-musgo-oscuro active:scale-[.98] disabled:bg-tinta-suave/40 disabled:shadow-none"
          >
            {enviando ? (
              <span className="size-5 animate-spin rounded-full border-2 border-papel/40 border-t-papel" aria-hidden="true" />
            ) : (
              <Icono nombre="regadera" className="size-5" grosor={2.2} />
            )}
            {enviando ? "Guardando…" : estado ? (yaRegado ? "Guardar observación" : "Guardar y regar") : "Elige cómo lo ves"}
          </button>
        </div>
      </div>
    </div>
  );
}
