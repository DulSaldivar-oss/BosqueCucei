import { MESES } from "@/lib/juego/catalogos";

export function Floracion({ meses, color }: { meses: number[]; color: string | null }) {
  const actual = new Date().getMonth() + 1;
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
    </div>
  );
}
