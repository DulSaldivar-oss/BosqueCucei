"use client";

import { useEffect, useRef, useState } from "react";

/** Número que sube desde 0 cuando entra en pantalla. */
export function Contador({ valor, duracion = 1100, className = "" }: { valor: number; duracion?: number; className?: string }) {
  const [mostrado, setMostrado] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMostrado(valor);
      return;
    }
    let cuadro = 0;
    const observador = new IntersectionObserver(([entrada]) => {
      if (!entrada.isIntersecting) return;
      observador.disconnect();
      const inicio = performance.now();
      const paso = (ahora: number) => {
        const t = Math.min(1, (ahora - inicio) / duracion);
        setMostrado(Math.round(valor * (1 - Math.pow(1 - t, 3))));
        if (t < 1) cuadro = requestAnimationFrame(paso);
      };
      cuadro = requestAnimationFrame(paso);
    });
    observador.observe(elemento);
    return () => {
      observador.disconnect();
      cancelAnimationFrame(cuadro);
    };
  }, [valor, duracion]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {mostrado.toLocaleString("es-MX")}
    </span>
  );
}
