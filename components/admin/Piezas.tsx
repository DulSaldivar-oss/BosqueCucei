import { Icono, type NombreIcono } from "@/components/Icono";

export function Encabezado({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">{titulo}</h1>
        {descripcion && <p className="mt-1 max-w-2xl text-tinta-suave">{descripcion}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2 print:hidden">{children}</div>}
    </header>
  );
}

export function Tarjeta({ titulo, children, className = "", accion }: { titulo?: string; children: React.ReactNode; className?: string; accion?: React.ReactNode }) {
  return (
    <section className={`rounded-3xl border border-linea bg-tarjeta p-5 shadow-tarjeta ${className}`}>
      {titulo && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">{titulo}</h2>
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}

export function Indicador({
  titulo,
  valor,
  detalle,
  icono,
  color,
  tendencia,
}: {
  titulo: string;
  valor: React.ReactNode;
  detalle?: string;
  icono: NombreIcono;
  color: string;
  tendencia?: number | null;
}) {
  return (
    <div className="animate-aparecer rounded-3xl border border-linea bg-tarjeta p-5 shadow-tarjeta">
      <div className="flex items-start justify-between">
        <span className="grid size-11 place-items-center rounded-2xl" style={{ backgroundColor: `${color}1f`, color }}>
          <Icono nombre={icono} className="size-6" />
        </span>
        {tendencia !== undefined && tendencia !== null && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tendencia >= 0 ? "bg-musgo-claro text-musgo" : "bg-tabachin/10 text-tabachin"}`}>
            {tendencia >= 0 ? "▲" : "▼"} {Math.abs(tendencia)}%
          </span>
        )}
      </div>
      <p className="font-display mt-3 text-3xl font-bold lg:text-4xl">{valor}</p>
      <p className="text-sm font-semibold text-tinta-suave">{titulo}</p>
      {detalle && <p className="mt-1 text-xs text-tinta-suave">{detalle}</p>}
    </div>
  );
}

export const NIVELES_ALERTA = {
  critica: { etiqueta: "Crítica", color: "#D64545" },
  alta: { etiqueta: "Alta", color: "#E07B39" },
  media: { etiqueta: "Media", color: "#C9930F" },
} as const;

export function NivelAlerta({ nivel }: { nivel: keyof typeof NIVELES_ALERTA }) {
  const n = NIVELES_ALERTA[nivel];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black uppercase" style={{ backgroundColor: `${n.color}1c`, color: n.color }}>
      <span className="size-2 rounded-full" style={{ backgroundColor: n.color }} /> {n.etiqueta}
    </span>
  );
}

export const ESTADOS_REVISION: Record<string, string> = {
  abierta: "Abierta",
  en_revision: "En revisión",
  resuelta: "Resuelta",
  descartada: "Descartada",
};

export const botonPrimario =
  "inline-flex items-center justify-center gap-2 rounded-full bg-musgo px-5 py-2.5 text-sm font-bold text-papel shadow-tarjeta transition hover:bg-musgo-oscuro active:scale-95 disabled:opacity-60";
export const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-full border border-linea bg-tarjeta px-5 py-2.5 text-sm font-bold text-tinta transition hover:border-musgo/40 active:scale-95";
