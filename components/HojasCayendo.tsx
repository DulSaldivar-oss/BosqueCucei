const COLORES = ["#8DB766", "#EDBB1F", "#8E6CC4", "#E4572E", "#5E8F4B"];

/** Hojas y pétalos que caen despacio. Decorativo; se oculta con movimiento reducido. */
export function HojasCayendo({ cantidad = 9 }: { cantidad?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: cantidad }, (_, i) => {
        const izquierda = (i * 37 + 11) % 100;
        const estilo = {
          left: `${izquierda}%`,
          "--duracion": `${9 + ((i * 7) % 8)}s`,
          "--retraso": `${(i * 1.7) % 9}s`,
          "--deriva": `${i % 2 === 0 ? 60 : -50}px`,
        } as React.CSSProperties;
        return (
          <svg key={i} viewBox="0 0 20 20" className="hoja-cayendo size-3.5 sm:size-4" style={estilo}>
            {i % 3 === 0 ? (
              <circle cx="10" cy="10" r="5" fill={COLORES[i % COLORES.length]} opacity=".85" />
            ) : (
              <path d="M3 17C3 8 8 3 17 3c0 9-5 14-14 14Z" fill={COLORES[i % COLORES.length]} opacity=".85" />
            )}
          </svg>
        );
      })}
    </div>
  );
}
