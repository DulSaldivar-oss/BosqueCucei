"use client";

import jsQR from "jsqr";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { estiloEntrada } from "@/components/Campo";
import { Icono } from "@/components/Icono";

type Estado = "iniciando" | "escaneando" | "sin-camara" | "buscando" | "no-encontrado";

export function Escaner() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const [estado, setEstado] = useState<Estado>("iniciando");
  const [mensaje, setMensaje] = useState("");
  const [linterna, setLinterna] = useState<boolean | null>(null);
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
        setMensaje(`«${texto.slice(0, 40)}» no corresponde a un árbol registrado.`);
        setEstado("no-encontrado");
      } catch {
        setMensaje("No pudimos consultar el código. Revisa tu conexión.");
        setEstado("no-encontrado");
      }
      setTimeout(() => {
        ocupado.current = false;
        setEstado(flujo.current ? "escaneando" : "sin-camara");
      }, 2200);
    },
    [detener, router],
  );

  const iniciar = useCallback(async () => {
    setEstado("iniciando");
    try {
      const medio = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      flujo.current = medio;
      const pista = medio.getVideoTracks()[0];
      const capacidades = (pista.getCapabilities?.() ?? {}) as { torch?: boolean };
      setLinterna(capacidades.torch ? false : null);
      if (video.current) {
        video.current.srcObject = medio;
        await video.current.play();
      }
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

  useEffect(() => {
    if (estado !== "escaneando") return;
    let ultimo = 0;
    let cuadro = 0;
    const leer = (t: number) => {
      cuadro = requestAnimationFrame(leer);
      if (t - ultimo < 180) return;
      ultimo = t;
      const v = video.current;
      const c = lienzo.current;
      if (!v || !c || v.readyState < 2 || ocupado.current) return;
      const escala = Math.min(1, 520 / v.videoWidth);
      c.width = Math.round(v.videoWidth * escala);
      c.height = Math.round(v.videoHeight * escala);
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(v, 0, 0, c.width, c.height);
      const imagen = ctx.getImageData(0, 0, c.width, c.height);
      const qr = jsQR(imagen.data, imagen.width, imagen.height, { inversionAttempts: "dontInvert" });
      if (qr?.data) resolver(qr.data);
    };
    cuadro = requestAnimationFrame(leer);
    return () => cancelAnimationFrame(cuadro);
  }, [estado, resolver]);

  async function alternarLinterna() {
    const pista = flujo.current?.getVideoTracks()[0];
    if (!pista || linterna === null) return;
    await pista.applyConstraints({ advanced: [{ torch: !linterna } as MediaTrackConstraintSet] }).catch(() => {});
    setLinterna(!linterna);
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[32px] bg-musgo-oscuro shadow-flotante sm:aspect-square">
        <video ref={video} playsInline muted className="absolute inset-0 size-full object-cover" aria-label="Vista de la cámara" />
        <canvas ref={lienzo} className="hidden" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgb(0_0_0/0.55)_75%)]" aria-hidden="true" />

        <div className="absolute inset-[16%] sm:inset-[18%]" aria-hidden="true">
          {["top-0 left-0 border-t-4 border-l-4 rounded-tl-3xl", "top-0 right-0 border-t-4 border-r-4 rounded-tr-3xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl"].map((c) => (
            <span
              key={c}
              className={`absolute size-12 transition-colors duration-300 ${c} ${estado === "buscando" ? "border-brote" : estado === "no-encontrado" ? "border-tabachin" : "border-papel"}`}
            />
          ))}
          {estado === "escaneando" && (
            <span
              className="linea-escaneo absolute inset-x-3 top-2 h-0.5 rounded-full bg-brote shadow-[0_0_14px_3px_rgb(181_211_52/0.7)]"
              style={{ "--recorrido": "calc(100% - 1rem)" } as React.CSSProperties}
            />
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
          <p className="rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur" role="status" aria-live="polite">
            {estado === "iniciando" && "Abriendo cámara…"}
            {estado === "escaneando" && "Apunta al código QR de la placa"}
            {estado === "buscando" && "¡Lo tengo! Buscando el árbol…"}
            {estado === "no-encontrado" && "Código desconocido"}
            {estado === "sin-camara" && "Cámara no disponible"}
          </p>
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

        {estado === "sin-camara" && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-papel">
            <div className="animate-aparecer">
              <Icono nombre="camara" className="mx-auto size-10 text-brote" />
              <p className="mt-3 font-bold">No pudimos usar la cámara</p>
              <p className="mt-1 text-sm text-papel/75">
                Revisa el permiso del navegador o escribe el código de la placa abajo. La cámara solo funciona en sitios con HTTPS.
              </p>
              <button
                type="button"
                onClick={iniciar}
                className="mt-4 rounded-full bg-papel px-5 py-2.5 text-sm font-bold text-musgo-oscuro active:scale-95"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        )}
      </div>

      {estado === "no-encontrado" && (
        <p role="alert" className="animate-aparecer rounded-2xl bg-tabachin/10 px-4 py-3 text-sm font-semibold text-tabachin">
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
          ¿No lee el QR? Escribe el código de la placa
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="codigo-manual"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="CUCEI-0027"
            autoCapitalize="characters"
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
