import { generarSprite, type GenomaSprite } from "@/lib/sprites/generar";

/**
 * Sprite de un árbol dibujado en línea (sirve en componentes de servidor y cliente).
 * `vivo` activa el vaivén con el viento.
 */
export function ArbolSprite({
  genoma,
  etapa,
  semilla,
  silueta,
  vivo = false,
  retraso,
  className = "",
  etiqueta,
  encuadre = "ajustado",
}: {
  genoma: GenomaSprite;
  etapa: number;
  semilla?: string | number;
  silueta?: string;
  vivo?: boolean;
  retraso?: number;
  className?: string;
  etiqueta?: string;
  /** "completo" conserva la escala real entre etapas (útil para comparar el crecimiento). */
  encuadre?: "completo" | "ajustado";
}) {
  const svg = generarSprite(genoma, etapa, { semilla, silueta, encuadre });
  return (
    <span
      role={etiqueta ? "img" : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
      className={`sprite block ${vivo ? "sprite-vivo" : ""} ${className}`}
      style={retraso !== undefined ? ({ "--retraso": `${retraso}s` } as React.CSSProperties) : undefined}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
