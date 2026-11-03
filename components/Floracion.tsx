import { MESES } from "@/lib/juego/catalogos";

/** Calendario de floración. Sin meses curados muestra la descripción del inventario, si la hay. */
export function Floracion({ meses, color, texto }: { meses: number[]; color: string | null; texto?: string | null }) {
  const actual = new Date().getMonth() + 1;
  if (meses.length === 0 && texto) {
    return (
      <p className="flex gap-2 text-sm leading-relaxed text-pretty">
        <span className="mt-1.5 size-3 shrink-0 rounded-full" style={{ backgroundColor: color ?? "#B5D334" }} aria-hidden="true" />
        <span>{texto}</span>
      </p>
    );
  }
  return (
    <div>
      <div className="grid grid-cols-12 gap-1">
        {MESES.map((m, i) => {
          const florece = meses.includes(i + 1);
          return (
            <div key={m} className="flex flex-col items-center gap-1">
              <span
                className={`h-8 w-full rounded-lg transition ${i + 1 === actual ? "ring-2 ring-tinta/60 ring-offset-1 ring-offset-tarjeta" : ""}`}
                style={{ backgroundColor: florece ? (color ?? "#B5D334") : "var(--color-papel-2)" }}
                title={florece ? `Florece en ${m}` : m}
              />
              <span className={`text-[10px] font-semibold uppercase ${i + 1 === actual ? "text-tinta" : "text-tinta-suave"}`}>{m.slice(0, 1)}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-tinta-suave">
        {meses.length === 0
          ? "Su floración es discreta; no pinta la copa."
          : `Florece en ${meses.map((m) => MESES[m - 1]).join(", ")}. El recuadro marcado es el mes actual.`}
      </p>
      {texto && <p className="mt-2 text-sm text-pretty">{texto}</p>}
    </div>
  );
}
