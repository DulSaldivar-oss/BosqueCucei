import Link from "next/link";
import { Icono } from "@/components/Icono";
import { BotonesValidacion } from "@/components/admin/Formularios";
import { Encabezado } from "@/components/admin/Piezas";
import { listarObservaciones } from "@/lib/consultas/admin";
import { urlFoto } from "@/lib/fotos";
import { ESTADOS_REPORTE, etiquetaCategoria } from "@/lib/juego/catalogos";

export const metadata = { title: "Observaciones" };

const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });
const FILTROS = [
  ["sin_revisar", "Anomalías sin revisar"],
  ["anomalias", "Con anomalía"],
  ["fotos", "Con foto"],
  ["rechazadas", "No válidas"],
  ["todas", "Todas"],
];

export default async function Observaciones({ searchParams }: { searchParams: Promise<{ filtro?: string; pagina?: string }> }) {
  const { filtro = "sin_revisar", pagina = "1" } = await searchParams;
  const numero = Math.max(1, Number(pagina) || 1);
  const { filas, hayMas } = await listarObservaciones({ filtro, pagina: numero });
  return (
    <>
      <Encabezado
        titulo="Observaciones"
        descripcion="Confirma las que sirvieron (la persona gana un bono) o marca las que no son válidas (se le retira la experiencia y no cuentan para alertas)."
      />
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Filtrar">
        {FILTROS.map(([id, texto]) => (
          <Link
            key={id}
            href={`/admin/observaciones?filtro=${id}`}
            aria-current={filtro === id ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-bold ${filtro === id ? "bg-tinta text-papel" : "border border-linea bg-tarjeta text-tinta-suave hover:text-tinta"}`}
          >
            {texto}
          </Link>
        ))}
      </nav>
      <div className="overflow-x-auto rounded-3xl border border-linea bg-tarjeta shadow-tarjeta">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-linea text-xs tracking-wide text-tinta-suave uppercase">
            <tr>
              <th className="px-4 py-3 font-bold">Foto</th>
              <th className="px-4 py-3 font-bold">Árbol</th>
              <th className="px-4 py-3 font-bold">Reporte</th>
              <th className="px-4 py-3 font-bold">Persona</th>
              <th className="px-4 py-3 font-bold">Cuenta</th>
              <th className="px-4 py-3 text-right font-bold">Validar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linea">
            {filas.map((o) => {
              const estado = ESTADOS_REPORTE.find((e) => e.valor === o.estado_reportado);
              return (
                <tr key={o.id} className={`align-top transition hover:bg-papel/60 ${o.validada === false ? "opacity-55" : ""}`}>
                  <td className="px-4 py-3">
                    {o.fotografia ? (
                      <a href={urlFoto(o.fotografia)!} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={urlFoto(o.fotografia)!} alt="" className="size-14 rounded-xl object-cover" loading="lazy" />
                      </a>
                    ) : (
                      <span className="grid size-14 place-items-center rounded-xl bg-papel-2 text-tinta-suave/50">
                        <Icono nombre="camara" className="size-5" />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/arboles/${o.codigo}`} className="font-bold hover:text-musgo">
                      {o.especie}
                    </Link>
                    <p className="font-mono text-xs text-tinta-suave">{o.codigo}</p>
                    <p className="text-xs text-tinta-suave">{o.zona}</p>
                  </td>
                  <td className="max-w-sm px-4 py-3">
                    <span className="font-bold" style={{ color: estado?.color }}>
                      {estado?.etiqueta}
                    </span>
                    {o.categorias.length > 0 && <p className="text-xs font-semibold">{o.categorias.map(etiquetaCategoria).join(" · ")}</p>}
                    {o.comentario && <p className="mt-1 text-xs text-tinta-suave">“{o.comentario}”</p>}
                    <p className="mt-1 text-xs text-tinta-suave">{fecha.format(o.fecha)}{o.duracion_ms ? ` · ${Math.round(o.duracion_ms / 1000)} s` : ""}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold">{o.alias}</td>
                  <td className="px-4 py-3">
                    {o.cuenta ? (
                      <span className="rounded-full bg-agua-claro px-2 py-0.5 text-xs font-bold text-[#1d5d8c]">Primera de la semana</span>
                    ) : (
                      <span className="text-xs text-tinta-suave">Repetida</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <BotonesValidacion id={o.id} validada={o.validada} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filas.length === 0 && <p className="p-10 text-center text-tinta-suave">No hay observaciones con este filtro.</p>}
      </div>
      <div className="mt-4 flex justify-between">
        {numero > 1 ? (
          <Link href={`/admin/observaciones?filtro=${filtro}&pagina=${numero - 1}`} className="font-bold text-musgo">
            ← Anteriores
          </Link>
        ) : (
          <span />
        )}
        {hayMas && (
          <Link href={`/admin/observaciones?filtro=${filtro}&pagina=${numero + 1}`} className="font-bold text-musgo">
            Siguientes →
          </Link>
        )}
      </div>
    </>
  );
}
