"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { CLAVE_GUIA_VISTA } from "@/lib/instalacion";
import { DialogoInstalar } from "./DialogoInstalar";
import { enModoApp } from "./useInstalacion";

/**
 * Decide una sola vez por carga de página si toca mostrar la guía: solo la primera vez en este
 * dispositivo y nunca dentro de la app instalada. Se marca como vista en cuanto aparece, así que
 * aunque la persona recargue o se vaya sin elegir, no vuelve a salir sola.
 */
let decision: boolean | null = null;

function primeraVez() {
  if (decision !== null) return decision;
  let vista = true;
  try {
    vista = localStorage.getItem(CLAVE_GUIA_VISTA) !== null;
    if (!vista && !enModoApp()) localStorage.setItem(CLAVE_GUIA_VISTA, new Date().toISOString());
  } catch {
    // Sin almacenamiento (modo privado estricto): se muestra solo en esta visita.
    vista = false;
  }
  decision = !vista && !enModoApp();
  return decision;
}

const sinSuscripcion = () => () => {};

/** Guía de instalación que aparece sola antes de entrar o registrarse, la primera vez. */
export function BienvenidaInstalar({ qr }: { qr?: string | null }) {
  const mostrar = useSyncExternalStore(sinSuscripcion, primeraVez, () => false);
  const [cerrada, setCerrada] = useState(false);
  const cerrar = useCallback(() => {
    decision = false;
    setCerrada(true);
  }, []);
  return <DialogoInstalar abierto={mostrar && !cerrada} alCerrar={cerrar} qr={qr} textoContinuar="Ahora no, continuar" />;
}
