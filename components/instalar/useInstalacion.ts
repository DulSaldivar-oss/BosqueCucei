"use client";

import { useCallback, useSyncExternalStore } from "react";
import { detectarEntorno, metodoInstalacion, type Entorno } from "@/lib/instalacion";

/** Evento beforeinstallprompt de Chrome, Edge y Samsung Internet (no está en los tipos del DOM). */
export interface AvisoInstalar extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    /** Lo guarda el script de app/layout.tsx en cuanto el navegador lo ofrece. */
    __avisoInstalar?: AvisoInstalar | null;
  }
}

const MODOS_APP = ["standalone", "fullscreen", "minimal-ui", "window-controls-overlay"];

/** ¿La página está abierta como app instalada (desde la pantalla de inicio)? */
export function enModoApp() {
  if (typeof window === "undefined") return false;
  return (
    MODOS_APP.some((modo) => window.matchMedia(`(display-mode: ${modo})`).matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

let entornoGuardado: Entorno | null = null;
let instaladaAhora = false;

function suscribir(avisar: () => void) {
  window.addEventListener("bosque:instalable", avisar);
  window.addEventListener("bosque:instalada", avisar);
  const consultas = MODOS_APP.map((modo) => window.matchMedia(`(display-mode: ${modo})`));
  consultas.forEach((c) => c.addEventListener("change", avisar));
  return () => {
    window.removeEventListener("bosque:instalable", avisar);
    window.removeEventListener("bosque:instalada", avisar);
    consultas.forEach((c) => c.removeEventListener("change", avisar));
  };
}

const sinSuscripcion = () => () => {};
const leerEntorno = () => (entornoGuardado ??= detectarEntorno(navigator.userAgent, navigator.maxTouchPoints));
const leerAviso = () => window.__avisoInstalar ?? null;
const leerInstalada = () => instaladaAhora || enModoApp();

if (typeof window !== "undefined") {
  window.addEventListener("bosque:instalada", () => {
    instaladaAhora = true;
  });
}

/**
 * Estado de la instalación en este navegador. En el servidor (y durante la hidratación) no se sabe
 * nada todavía: `entorno` es null y no se muestra ninguna instrucción.
 */
export function useInstalacion() {
  const entorno = useSyncExternalStore(sinSuscripcion, leerEntorno, () => null);
  const aviso = useSyncExternalStore(suscribir, leerAviso, () => null);
  const instalada = useSyncExternalStore(suscribir, leerInstalada, () => false);

  /** Abre el diálogo de instalación del navegador (solo se puede usar una vez por aviso). */
  const instalar = useCallback(async (): Promise<"aceptada" | "rechazada" | "no-disponible"> => {
    const actual = window.__avisoInstalar;
    if (!actual) return "no-disponible";
    window.__avisoInstalar = null;
    await actual.prompt();
    const { outcome } = await actual.userChoice;
    if (outcome === "accepted") instaladaAhora = true;
    window.dispatchEvent(new Event(outcome === "accepted" ? "bosque:instalada" : "bosque:instalable"));
    return outcome === "accepted" ? "aceptada" : "rechazada";
  }, []);

  return { entorno, metodo: entorno ? metodoInstalacion(entorno, !!aviso) : null, instalada, instalar };
}
