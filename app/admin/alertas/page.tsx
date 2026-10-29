import Link from "next/link";
import { ESTADOS_REVISION, Encabezado, NivelAlerta } from "@/components/admin/Piezas";
import { listarAlertas } from "@/lib/consultas/admin";
import { etiquetaCategoria } from "@/lib/juego/catalogos";

export const metadata = { title: "Alertas" };

const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });

export default async function Alertas({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado = "abierta" } = await searchParams;
  const filtro = estado === "todas" ? null : estado;
  const alertas = await listarAlertas(filtro, 200);
  return (
    <>
      <Encabezado titulo="Alertas" descripcion="Se generan solas cuando varias personas reportan anomalías en el mismo árbol, o de inmediato con un reporte de riesgo." />
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Filtrar por estado">
        {["abierta", "en_revision", "resuelta", "descartada", "todas"].map((e) => (
          <Link
            key={e}
            href={`/admin/alertas?estado=${e}`}
            aria-current={estado === e ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${estado === e ? "bg-tinta text-papel" : "border border-linea bg-tarjeta text-tinta-suave hover:text-tinta"}`}
          >
            {e === "todas" ? "Todas" : ESTADOS_REVISION[e]}
          </Link>
        ))}
      </nav>
      {alertas.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-linea p-10 text-center text-tinta-suave">No hay alertas en este estado.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 escalonado">
          {alertas.map((a, i) => (
            <li key={a.id} style={{ "--i": Math.min(i, 10) } as React.CSSProperties}>
              <Link href={`/admin/alertas/${a.id}`} className="block h-full rounded-3xl border border-linea bg-tarjeta p-5 shadow-tarjeta transition hover:-translate-y-0.5 hover:border-musgo/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {a.especie} <span className="font-mono text-xs font-normal text-tinta-suave">{a.codigo}</span>
                    </p>
                    <p className="text-sm text-tinta-suave">{a.zona}</p>
                  </div>
                  <NivelAlerta nivel={a.nivel} />
                </div>
                <p className="mt-3 text-sm">{a.motivo}</p>
                {a.categorias.length > 0 && (
                  <p className="mt-2 flex flex-wrap gap-1">
                    {a.categorias.map((c) => (
                      <span key={c} className="rounded-full bg-papel-2 px-2 py-0.5 text-xs font-semibold">
                        {etiquetaCategoria(c)}
                      </span>
                    ))}
                  </p>
                )}
                <p className="mt-3 flex flex-wrap gap-x-4 text-xs text-tinta-suave">
                  <span>Generada {fecha.format(a.fecha_generacion)}</span>
                  <span>{ESTADOS_REVISION[a.estado_revision]}</span>
                  {a.responsable && <span>Responsable: {a.responsable}</span>}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
