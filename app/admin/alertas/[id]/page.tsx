import Link from "next/link";
import { notFound } from "next/navigation";
import { ArbolSprite } from "@/components/ArbolSprite";
import { Icono } from "@/components/Icono";
import { BotonesValidacion, FormularioAlerta } from "@/components/admin/Formularios";
import { Encabezado, NivelAlerta, Tarjeta, botonSecundario } from "@/components/admin/Piezas";
import { alertaPorId, listarObservaciones } from "@/lib/consultas/admin";
import { urlFoto } from "@/lib/fotos";
import { ESTADOS_REPORTE, etiquetaCategoria } from "@/lib/juego/catalogos";

export const metadata = { title: "Revisar alerta" };

const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });

export default async function Alerta({ params }: { params: Promise<{ id: string }> }) {
  const alerta = await alertaPorId(Number((await params).id));
  if (!alerta) notFound();
  const { filas: reportes } = await listarObservaciones({
    arbolId: alerta.arbol_id,
    desde: new Date(alerta.fecha_generacion.getTime() - 14 * 86_400_000),
  });
  return (
    <>
      <Link href="/admin/alertas" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-tinta-suave hover:text-tinta">
        <Icono nombre="flechaIzq" className="size-4" /> Alertas
      </Link>
      <Encabezado titulo={`Alerta en ${alerta.codigo}`} descripcion={alerta.motivo}>
        <Link href={`/admin/arboles/${alerta.codigo}`} className={botonSecundario}>
          Ficha del árbol
        </Link>
        <a href={`https://www.google.com/maps/search/?api=1&query=${alerta.latitud},${alerta.longitud}`} target="_blank" rel="noreferrer" className={botonSecundario}>
          <Icono nombre="ubicacion" className="size-4" /> Cómo llegar
        </a>
      </Encabezado>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <Tarjeta>
            <div className="flex items-center gap-4">
              <ArbolSprite genoma={alerta.sprite} etapa={5} semilla={alerta.codigo} className="w-20 shrink-0" />
              <div>
                <NivelAlerta nivel={alerta.nivel} />
                <p className="mt-2 text-xl font-bold">{alerta.especie}</p>
                <p className="text-sm text-tinta-suave">
                  {alerta.zona} · {alerta.latitud.toFixed(5)}, {alerta.longitud.toFixed(5)}
                </p>
                <p className="text-xs text-tinta-suave">Generada {fecha.format(alerta.fecha_generacion)} · actualizada {fecha.format(alerta.actualizada_en)}</p>
              </div>
            </div>
          </Tarjeta>
          <Tarjeta titulo="Revisión">
            <FormularioAlerta alerta={alerta} />
          </Tarjeta>
        </div>
        <Tarjeta titulo={`Reportes recientes (${reportes.length})`}>
          <ul className="space-y-3">
            {reportes.map((o) => {
              const estado = ESTADOS_REPORTE.find((e) => e.valor === o.estado_reportado);
              return (
                <li key={o.id} className={`flex gap-3 rounded-2xl border p-3 ${o.validada === false ? "border-dashed border-linea opacity-60" : "border-linea"}`}>
                  {o.fotografia ? (
                    <a href={urlFoto(o.fotografia)!} target="_blank" rel="noreferrer" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={urlFoto(o.fotografia)!} alt="Foto del reporte" className="size-20 rounded-xl object-cover" />
                    </a>
                  ) : (
                    <span className="grid size-20 shrink-0 place-items-center rounded-xl bg-papel-2 text-tinta-suave">
                      <Icono nombre="camara" className="size-6" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-bold" style={{ color: estado?.color }}>
                        {estado?.etiqueta}
                      </span>{" "}
                      <span className="text-tinta-suave">
                        · {o.alias} · {fecha.format(o.fecha)}
                      </span>
                    </p>
                    {o.categorias.length > 0 && <p className="mt-1 text-xs font-semibold">{o.categorias.map(etiquetaCategoria).join(" · ")}</p>}
                    {o.comentario && <p className="mt-1 text-sm text-tinta-suave">“{o.comentario}”</p>}
                  </div>
                  <BotonesValidacion id={o.id} validada={o.validada} />
                </li>
              );
            })}
          </ul>
        </Tarjeta>
      </div>
    </>
  );
}
