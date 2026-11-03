"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { estiloEntrada } from "@/components/Campo";
import { Icono } from "@/components/Icono";
import { leerImagen, leerQr, rectanguloRecorte, tamanoEscalado, VARIANTES_CAMARA, type Imagen } from "@/lib/escaneo";

type Estado = "iniciando" | "escaneando" | "sin-camara" | "buscando" | "no-encontrado" | "analizando-foto";

/** BarcodeDetector nativo (Chrome en Android, entre otros): no viene en los tipos del DOM. */
interface DetectorNativo {
  detect(fuente: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: {
      new (opciones: { formats: string[] }): DetectorNativo;
      getSupportedFormats(): Promise<string[]>;
    };
  }
}

async function crearDetectorNativo(): Promise<DetectorNativo | null> {
  try {
    if (!window.BarcodeDetector || !(await window.BarcodeDetector.getSupportedFormats()).includes("qr_code")) return null;
    return new window.BarcodeDetector({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

const CONSEJOS = [
  { icono: "telefono" as const, texto: "Pon el teléfono de frente a la placa, sin inclinarlo." },
  { icono: "brillo" as const, texto: "Si el metal brilla o refleja el cielo, tápalo con tu sombra o prueba la linterna." },
  { icono: "mira" as const, texto: "Acércate hasta que el código llene el recuadro y espera a que se vea nítido." },
  { icono: "camara" as const, texto: "¿Nada? Toma una foto de la placa o escribe el número de espécimen abajo." },
];

export function Escaner() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const entradaFoto = useRef<HTMLInputElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const nativo = useRef<DetectorNativo | null>(null);
  const [estado, setEstado] = useState<Estado>("iniciando");
  const [mensaje, setMensaje] = useState("");
  const [linterna, setLinterna] = useState<boolean | null>(null);
  const [zoom, setZoom] = useState<{ min: number; max: number; paso: number; valor: number } | null>(null);
  const [ayuda, setAyuda] = useState(false);
  const [codigo, setCodigo] = useState("");
  const ocupado = useRef(false);

  const detener = useCallback(() => {
    flujo.current?.getTracks().forEach((t) => t.stop());
    flujo.current = null;
  }, []);

  const resolver = useCallback(
    async (texto: string) => {
      if (ocupado.current) return;
      ocupado.current = true;
      setEstado("buscando");
      navigator.vibrate?.(60);
      try {
        const respuesta = await fetch(`/api/qr?texto=${encodeURIComponent(texto)}`);
        const datos = (await respuesta.json()) as { codigo?: string };
        if (datos.codigo) {
          detener();
          router.push(`/arbol/${datos.codigo}?origen=qr`);
          return;
        }
        setMensaje(`El código dice «${texto.slice(0, 60)}», pero no corresponde a un árbol registrado. Prueba con el número de espécimen de la placa.`);
        setEstado("no-encontrado");
      } catch {
        setMensaje("No pudimos consultar el código. Revisa tu conexión.");
        setEstado("no-encontrado");
      }
      setTimeout(() => {
        ocupado.current = false;
        setEstado(flujo.current ? "escaneando" : "sin-camara");
      }, 2600);
    },
    [detener, router],
  );

  const iniciar = useCallback(async () => {
    setEstado("iniciando");
    try {
      // Resolución alta: el código de una placa ocupa poco del cuadro.
      const medio = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      flujo.current = medio;
      const pista = medio.getVideoTracks()[0];
      const capacidades = (pista.getCapabilities?.() ?? {}) as {
        torch?: boolean;
        focusMode?: string[];
        zoom?: { min: number; max: number; step: number };
      };
      if (capacidades.focusMode?.includes("continuous")) {
        await pista.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] }).catch(() => {});
      }
      setLinterna(capacidades.torch ? false : null);
      setZoom(
        capacidades.zoom && capacidades.zoom.max > capacidades.zoom.min
          ? { min: capacidades.zoom.min, max: Math.min(capacidades.zoom.max, capacidades.zoom.min * 5), paso: capacidades.zoom.step || 0.1, valor: capacidades.zoom.min }
          : null,
      );
      if (video.current) {
        video.current.srcObject = medio;
        await video.current.play();
      }
      nativo.current = await crearDetectorNativo();
      setEstado("escaneando");
    } catch {
      setEstado("sin-camara");
    }
  }, []);

  useEffect(() => {
    // Arranca la cámara al abrir la página; el navegador pide permiso la primera vez.
    const id = setTimeout(iniciar, 0);
    return () => {
      clearTimeout(id);
      detener();
    };
  }, [iniciar, detener]);

  // Lectura en vivo: cada vuelta prueba una variante distinta (recorte, suavizado, iluminación).
  useEffect(() => {
    if (estado !== "escaneando") return;
    let vivo = true;
    let intento = 0;
    let temporizador = 0;
    const consejos = window.setTimeout(() => setAyuda(true), 7000);
    const leer = async () => {
      const v = video.current;
      const c = lienzo.current;
      if (vivo && v && c && v.readyState >= 2 && !ocupado.current) {
        let texto: string | null = null;
        if (nativo.current && intento % 2 === 0) {
          texto = (await nativo.current.detect(v).catch(() => []))[0]?.rawValue ?? null;
        } else {
          const variante = VARIANTES_CAMARA[Math.floor(intento / (nativo.current ? 2 : 1)) % VARIANTES_CAMARA.length];
          const r = rectanguloRecorte(v.videoWidth, v.videoHeight, variante.recorte);
          const t = tamanoEscalado(r.ancho, r.alto, variante.lado);
          c.width = t.ancho;
          c.height = t.alto;
          const ctx = c.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(v, r.x, r.y, r.ancho, r.alto, 0, 0, t.ancho, t.alto);
            texto = leerQr(ctx.getImageData(0, 0, t.ancho, t.alto), variante);
          }
        }
        intento++;
        if (texto && vivo) resolver(texto);
      }
      if (vivo) temporizador = window.setTimeout(leer, 120);
    };
    temporizador = window.setTimeout(leer, 120);
    return () => {
      vivo = false;
      clearTimeout(temporizador);
      clearTimeout(consejos);
    };
  }, [estado, resolver]);

  async function alternarLinterna() {
    const pista = flujo.current?.getVideoTracks()[0];
    if (!pista || linterna === null) return;
    await pista.applyConstraints({ advanced: [{ torch: !linterna } as MediaTrackConstraintSet] }).catch(() => {});
    setLinterna(!linterna);
  }

  async function cambiarZoom(valor: number) {
    if (!zoom) return;
    setZoom({ ...zoom, valor });
    await flujo.current
      ?.getVideoTracks()[0]
      ?.applyConstraints({ advanced: [{ zoom: valor } as MediaTrackConstraintSet] })
      .catch(() => {});
  }

  /** Foto a resolución completa con la cámara del teléfono (enfoque y HDR propios) y análisis a fondo. */
  async function analizarFoto(archivo: File) {
    setEstado("analizando-foto");
    try {
      const mapa = await createImageBitmap(archivo);
      const escala = Math.min(1, 2400 / Math.max(mapa.width, mapa.height));
      const lienzoFoto = document.createElement("canvas");
      lienzoFoto.width = Math.round(mapa.width * escala);
      lienzoFoto.height = Math.round(mapa.height * escala);
      const ctx = lienzoFoto.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(mapa, 0, 0, lienzoFoto.width, lienzoFoto.height);
      let texto = nativo.current ? ((await nativo.current.detect(lienzoFoto).catch(() => []))[0]?.rawValue ?? null) : null;
      if (!texto) {
        // Deja pintar el mensaje «Analizando» antes del trabajo pesado.
        await new Promise((r) => setTimeout(r, 30));
        const imagen: Imagen = ctx.getImageData(0, 0, lienzoFoto.width, lienzoFoto.height);
        texto = leerImagen(imagen);
      }
      if (texto) {
        await resolver(texto);
        return;
      }
      setMensaje("No pudimos leer el código en la foto. Tómala de frente, cerca y sin reflejos, o escribe el número de espécimen.");
      setEstado("no-encontrado");
    } catch {
      setMensaje("No pudimos abrir la foto.");
      setEstado("no-encontrado");
    }
    setTimeout(() => setEstado(flujo.current ? "escaneando" : "sin-camara"), 3500);
  }

  const marco = estado === "buscando" ? "border-brote" : estado === "no-encontrado" ? "border-tabachin" : "border-papel";

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[32px] bg-musgo-oscuro shadow-flotante sm:aspect-square">
        <video ref={video} playsInline muted className="absolute inset-0 size-full object-cover" aria-label="Vista de la cámara" />
        <canvas ref={lienzo} className="hidden" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgb(0_0_0/0.55)_75%)]" aria-hidden="true" />

        <div className="absolute inset-[14%] sm:inset-[16%]" aria-hidden="true">
          {["top-0 left-0 border-t-4 border-l-4 rounded-tl-3xl", "top-0 right-0 border-t-4 border-r-4 rounded-tr-3xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl"].map((c) => (
            <span key={c} className={`absolute size-12 transition-colors duration-300 ${c} ${marco}`} />
          ))}
          {estado === "escaneando" && (
            <span
              className="linea-escaneo absolute inset-x-3 top-2 h-0.5 rounded-full bg-brote shadow-[0_0_14px_3px_rgb(181_211_52/0.7)]"
              style={{ "--recorrido": "calc(100% - 1rem)" } as React.CSSProperties}
            />
          )}
        </div>

        <AnimatePresence>
          {ayuda && estado === "escaneando" && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="absolute inset-x-3 top-3 rounded-2xl bg-black/60 p-3 text-xs text-white backdrop-blur"
              role="note"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold">¿Las placas de metal no se leen? Prueba así:</p>
                <button type="button" onClick={() => setAyuda(false)} aria-label="Cerrar consejos" className="-mt-1 -mr-1 grid size-7 shrink-0 place-items-center rounded-full bg-white/15">
                  <Icono nombre="cerrar" className="size-3.5" />
                </button>
              </div>
              <ul className="mt-1.5 space-y-1">
                {CONSEJOS.map((c) => (
                  <li key={c.texto} className="flex items-start gap-2">
                    <Icono nombre={c.icono} className="mt-px size-3.5 shrink-0 text-brote" />
                    {c.texto}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
          {zoom && estado === "escaneando" && (
            <label className="flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
              <Icono nombre="lupa" className="size-4 shrink-0" />
              <span className="sr-only">Acercar</span>
              <input
                type="range"
                min={zoom.min}
                max={zoom.max}
                step={zoom.paso}
                value={zoom.valor}
                onChange={(e) => cambiarZoom(Number(e.target.value))}
                className="w-full accent-brote"
              />
              <span className="w-8 text-right tabular-nums">{zoom.valor.toFixed(1)}×</span>
            </label>
          )}
          <div className="flex items-center justify-between gap-2">
            <p className="rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur" role="status" aria-live="polite">
              {estado === "iniciando" && "Abriendo cámara…"}
              {estado === "escaneando" && "Apunta al código QR de la placa"}
              {estado === "buscando" && "¡Lo tengo! Buscando el árbol…"}
              {estado === "no-encontrado" && "No lo reconocimos"}
              {estado === "sin-camara" && "Cámara no disponible"}
              {estado === "analizando-foto" && "Analizando la foto…"}
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => entradaFoto.current?.click()}
                aria-label="Tomar una foto de la placa"
                title="Tomar foto"
                className="grid size-11 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition active:scale-90"
              >
                <Icono nombre="camara" className="size-5" />
              </button>
              {linterna !== null && (
                <button
                  type="button"
                  onClick={alternarLinterna}
                  aria-pressed={linterna}
                  aria-label="Linterna"
                  className={`grid size-11 place-items-center rounded-full backdrop-blur transition active:scale-90 ${linterna ? "bg-primavera text-tinta" : "bg-black/45 text-white"}`}
                >
                  <Icono nombre="brillo" className="size-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {estado === "sin-camara" && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-papel">
            <div className="animate-aparecer">
              <Icono nombre="camara" className="mx-auto size-10 text-brote" />
              <p className="mt-3 font-bold">No pudimos usar la cámara</p>
              <p className="mt-1 text-sm text-papel/75">
                Revisa el permiso del navegador, toma una foto de la placa o escribe su número abajo. La cámara solo funciona en sitios con HTTPS.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={iniciar} className="rounded-full bg-papel px-5 py-2.5 text-sm font-bold text-musgo-oscuro active:scale-95">
                  Intentar de nuevo
                </button>
                <button
                  type="button"
                  onClick={() => entradaFoto.current?.click()}
                  className="rounded-full bg-white/15 px-5 py-2.5 text-sm font-bold text-papel active:scale-95"
                >
                  Tomar foto
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        ref={entradaFoto}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          e.target.value = "";
          if (archivo) analizarFoto(archivo);
        }}
      />

      {estado === "no-encontrado" && (
        <p role="alert" className="animate-aparecer rounded-2xl bg-tabachin/10 px-4 py-3 text-sm font-semibold break-words text-tabachin">
          {mensaje}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (codigo.trim()) resolver(codigo.trim());
        }}
        className="rounded-3xl border border-linea bg-tarjeta p-4 shadow-tarjeta"
      >
        <label htmlFor="codigo-manual" className="text-sm font-bold">
          ¿No lo lee? Escribe el número de espécimen de la placa
        </label>
        <p className="text-xs text-tinta-suave">Viene grabado bajo «Espécimen». También sirve el código completo (CUCEI-0048).</p>
        <div className="mt-2 flex gap-2">
          <input
            id="codigo-manual"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="48"
            autoCapitalize="characters"
            autoComplete="off"
            className={`${estiloEntrada} font-mono uppercase`}
          />
          <button type="submit" className="shrink-0 rounded-2xl bg-musgo px-5 font-bold text-papel transition hover:bg-musgo-oscuro active:scale-95">
            Ir
          </button>
        </div>
      </form>
    </div>
  );
}
