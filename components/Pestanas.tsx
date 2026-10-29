"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

/** Pestañas con indicador animado; el contenido llega ya renderizado desde el servidor. */
export function Pestanas({ pestanas }: { pestanas: { id: string; etiqueta: string; contenido: React.ReactNode }[] }) {
  const [activa, setActiva] = useState(pestanas[0].id);
  const base = useId();
  const actual = pestanas.find((p) => p.id === activa) ?? pestanas[0];
  return (
    <div>
      <div role="tablist" aria-label="Secciones" className="flex gap-1 rounded-full border border-linea bg-papel-2/70 p-1">
        {pestanas.map((p) => (
          <button
            key={p.id}
            id={`${base}-${p.id}`}
            role="tab"
            type="button"
            aria-selected={p.id === activa}
            aria-controls={`${base}-panel`}
            onClick={() => setActiva(p.id)}
            className="relative flex-1 rounded-full px-3 py-2 text-sm font-bold transition-colors"
          >
            {p.id === activa && (
              <motion.span
                layoutId={`${base}-indicador`}
                className="absolute inset-0 rounded-full bg-tarjeta shadow-tarjeta"
                transition={{ type: "spring", stiffness: 450, damping: 36 }}
              />
            )}
            <span className={`relative ${p.id === activa ? "text-musgo-oscuro" : "text-tinta-suave"}`}>{p.etiqueta}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={actual.id}
          id={`${base}-panel`}
          role="tabpanel"
          aria-labelledby={`${base}-${actual.id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="pt-5"
        >
          {actual.contenido}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
