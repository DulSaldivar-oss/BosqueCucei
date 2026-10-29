import { Icono, type NombreIcono } from "@/components/Icono";
import { diasHasta } from "@/lib/juego/semana";
import type { ProgresoMision } from "@/lib/servicios/misiones";

const ICONOS: Record<string, NombreIcono> = {
  regadera: "regadera",
  lupa: "lupa",
  corazon: "corazon",
  mapa: "mapa",
  camara: "camara",
  hoja: "hoja",
  estrella: "estrella",
};

const COLORES = ["#3B9AE1", "#8E6CC4", "#E4572E", "#2D5A3D", "#C9930F"];

export function TarjetaMision({ progreso, compacta = false }: { progreso: ProgresoMision; compacta?: boolean }) {
  const { mision, completada } = progreso;
  const porcentaje = Math.round((progreso.progreso / mision.meta) * 100);
  const color = COLORES[mision.id % COLORES.length];
  const dias = diasHasta(progreso.cierra);
  return (
    <article
      className={`relative overflow-hidden rounded-3xl border border-linea bg-tarjeta ${compacta ? "p-3.5" : "p-4 shadow-tarjeta sm:p-5"} ${completada ? "opacity-90" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: `${color}1f`, color }}>
          <Icono nombre={ICONOS[mision.icono] ?? "hoja"} className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="leading-tight font-bold">{mision.titulo}</h3>
            <span className="shrink-0 rounded-full bg-brote/30 px-2 py-0.5 text-xs font-bold text-musgo-oscuro">+{mision.recompensa_xp} XP</span>
          </div>
          <p className="mt-0.5 text-sm text-tinta-suave">{mision.descripcion}</p>
          <div className="mt-2.5 flex items-center gap-2.5">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-papel-2"
              role="progressbar"
              aria-valuenow={progreso.progreso}
              aria-valuemin={0}
              aria-valuemax={mision.meta}
              aria-label={`Avance de ${mision.titulo}`}
            >
              <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${porcentaje}%`, backgroundColor: color }} />
            </div>
            <span className="text-xs font-bold tabular-nums">
              {progreso.progreso}/{mision.meta}
            </span>
          </div>
          {!compacta && !completada && (
            <p className="mt-2 text-xs text-tinta-suave">
              {mision.periodicidad === "semanal" ? "Se renueva cada lunes" : "Misión de temporada"} · cierra en {dias}{" "}
              {dias === 1 ? "día" : "días"}
            </p>
          )}
        </div>
      </div>
      {completada && (
        <span className="animate-sello absolute top-3 right-3 rounded-lg border-2 border-musgo/70 bg-tarjeta/90 px-2 py-0.5 text-xs font-black tracking-widest text-musgo uppercase">
          Completada
        </span>
      )}
    </article>
  );
}
