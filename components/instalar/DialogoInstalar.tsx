"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Icono } from "@/components/Icono";
import { GuiaInstalacion } from "./GuiaInstalacion";

const sinSuscripcion = () => () => {};

/**
 * Hoja inferior en el teléfono y ventana centrada en pantallas grandes con la guía de instalación.
 * Se monta en <body> con un portal: dentro de una tarjeta animada (con transform), position: fixed
 * quedaría atrapado en la tarjeta en lugar de cubrir la pantalla.
 */
export function DialogoInstalar({
  abierto,
  alCerrar,
  qr,
  textoContinuar,
}: {
  abierto: boolean;
  alCerrar: () => void;
  qr?: string | null;
  textoContinuar: string;
}) {
  const reducido = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const enCliente = useSyncExternalStore(sinSuscripcion, () => true, () => false);

  useEffect(() => {
    if (!abierto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const desbordamiento = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") alCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => {
      document.body.style.overflow = desbordamiento;
      window.removeEventListener("keydown", alTeclear);
      anterior?.focus?.();
    };
  }, [abierto, alCerrar]);

  if (!enCliente) return null;
  return createPortal(
    <AnimatePresence>
      {abierto && (
        <motion.div
          key="fondo"
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-tinta/45 backdrop-blur-[2px] md:items-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) alCerrar();
          }}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-instalar"
            tabIndex={-1}
            // El panel recibe el foco al abrir solo para que el lector de pantalla lo anuncie: sin contorno.
            style={{ outline: "none" }}
            initial={reducido ? { opacity: 0 } : { y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reducido ? { opacity: 0 } : { y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[32px] bg-papel px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-flotante sm:px-7 md:max-w-lg md:rounded-[32px] md:pt-7"
          >
            <span className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-linea md:hidden" aria-hidden="true" />
            <button
              type="button"
              onClick={alCerrar}
              aria-label="Cerrar"
              className="absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-papel-2 text-tinta-suave transition hover:text-tinta active:scale-90 md:top-5 md:right-5"
            >
              <Icono nombre="cerrar" className="size-4" />
            </button>
            <GuiaInstalacion qr={qr} alContinuar={alCerrar} textoContinuar={textoContinuar} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
