import { ArbolSprite } from "@/components/ArbolSprite";
import { HojasCayendo } from "@/components/HojasCayendo";
import type { GenomaSprite } from "@/lib/sprites/generar";

/** Escena ilustrada: cielo, nubes que pasan, colina y árboles meciéndose. */
export function EscenaBosque({
  arboles,
  className = "",
  children,
}: {
  arboles: { slug: string; sprite: GenomaSprite; etapa: number }[];
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative isolate flex flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-[#cfe6ef] via-[#e9f0de] to-[#f3ecd9] ${className}`}>
      <svg className="nube absolute top-[10%] left-0 w-28 opacity-80 sm:w-36" style={{ "--duracion": "70s" } as React.CSSProperties} viewBox="0 0 120 40" aria-hidden="true">
        <path d="M18 34h84a14 14 0 0 0-6-27 20 20 0 0 0-37-4A16 16 0 0 0 18 34Z" fill="#fff" />
      </svg>
      <svg
        className="nube absolute top-[24%] left-0 w-20 opacity-60 sm:w-24"
        style={{ "--duracion": "95s", animationDelay: "-40s" } as React.CSSProperties}
        viewBox="0 0 120 40"
        aria-hidden="true"
      >
        <path d="M18 34h84a14 14 0 0 0-6-27 20 20 0 0 0-37-4A16 16 0 0 0 18 34Z" fill="#fff" />
      </svg>
      <div className="absolute top-[8%] right-[8%] size-12 rounded-full bg-primavera/70 blur-[1px] sm:size-16" aria-hidden="true" />
      <HojasCayendo />
      {children}
      <div className="relative mt-auto pt-4" aria-hidden="true">
        <div className="relative z-10 mx-auto flex max-w-3xl items-end justify-center px-2">
          {arboles.map((a, i) => (
            <ArbolSprite
              key={a.slug}
              genoma={a.sprite}
              etapa={a.etapa}
              semilla={a.slug}
              vivo
              retraso={-i * 0.9}
              className={`-mx-3 shrink-0 sm:-mx-2 ${i % 2 === 0 ? "w-[26%] max-w-40" : "w-[21%] max-w-32"}`}
            />
          ))}
        </div>
        <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="relative -mt-5 block h-10 w-full sm:h-14">
          <path d="M0 18C80 4 150 2 210 10s130 12 190 2v28H0Z" fill="#9fc27a" />
          <path d="M0 26c90-10 170-8 240-2s110 6 160-2v18H0Z" fill="#86ad62" />
        </svg>
      </div>
    </div>
  );
}
