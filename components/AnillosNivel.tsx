import { progresoNivel } from "@/lib/juego/niveles";

/**
 * El nivel se muestra como los anillos de un tronco: un anillo por nivel alcanzado
 * (hasta 6 visibles) y el anillo exterior se llena con la experiencia del nivel actual.
 */
export function AnillosNivel({ xp, tamano = 64, className = "" }: { xp: number; tamano?: number; className?: string }) {
  const p = progresoNivel(xp);
  const radio = 44;
  const circunferencia = 2 * Math.PI * radio;
  const anillos = Math.min(p.nivel, 6);
  return (
    <div
      className={`relative inline-grid shrink-0 place-items-center ${className}`}
      style={{ width: tamano, height: tamano }}
      role="img"
      aria-label={`Nivel ${p.nivel}, ${p.titulo}. ${p.enNivel} de ${p.costo} puntos de experiencia.`}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90">
        <circle cx="50" cy="50" r="47" fill="#c9a77f" />
        <circle cx="50" cy="50" r="42" fill="#e8d3b2" />
        {Array.from({ length: anillos }, (_, i) => (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={8 + i * 5.5}
            fill="none"
            stroke="#b8936a"
            strokeWidth="1.3"
            opacity={0.5 + i * 0.08}
          />
        ))}
        <circle cx="50" cy="50" r={radio} fill="none" stroke="rgb(30 43 34 / 0.12)" strokeWidth="5" />
        <circle
          cx="50"
          cy="50"
          r={radio}
          fill="none"
          stroke="var(--color-brote)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - p.porcentaje / 100)}
          className="anillo-progreso"
        />
      </svg>
      <span
        className="font-display relative font-bold text-tinta"
        style={{ fontSize: tamano * 0.34, lineHeight: 1 }}
        aria-hidden="true"
      >
        {p.nivel}
      </span>
    </div>
  );
}
