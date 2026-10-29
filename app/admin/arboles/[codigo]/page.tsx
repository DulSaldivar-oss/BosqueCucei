import Link from "next/link";
import { notFound } from "next/navigation";
import { ArbolSprite } from "@/components/ArbolSprite";
import { ChipEstado } from "@/components/ChipEstado";
import { Icono } from "@/components/Icono";
import { FormularioArbol } from "@/components/admin/FormularioArbol";
import { BotonesValidacion } from "@/components/admin/Formularios";
import { Encabezado, Tarjeta, botonSecundario } from "@/components/admin/Piezas";
import { arbolParaEditar, especiesParaSelector, listarObservaciones, zonas } from "@/lib/consultas/admin";
import { arbolPorCodigo } from "@/lib/consultas/publico";
import { urlFoto } from "@/lib/fotos";
import { ESTADOS_REPORTE, etiquetaCategoria } from "@/lib/juego/catalogos";
import { qrSvg, urlSitio } from "@/lib/qr";

export const metadata = { title: "Editar árbol" };

const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Mexico_City" });

export default async function EditarArbol({ params, searchParams }: { params: Promise<{ codigo: string }>; searchParams: Promise<{ guardado?: string }> }) {
  const { codigo } = await params;
  const { guardado } = await searchParams;
  const arbol = await arbolParaEditar(codigo);
  if (!arbol) notFound();
  const [especies, listaZonas, ficha, { filas }] = await Promise.all([
    especiesParaSelector(),
    zonas(),
    arbolPorCodigo(codigo),
    listarObservaciones({ arbolId: arbol.id }),
  ]);
  const svg = await qrSvg(arbol.qr_id);
  return (
    <>
      <Link href="/admin/arboles" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-tinta-suave hover:text-tinta">
        <Icono nombre="flechaIzq" className="size-4" /> Árboles
      </Link>
      <Encabezado titulo={arbol.codigo} descripcion={ficha ? `${ficha.especie.nombre_comun} · ${arbol.zona}` : arbol.zona}>
        <Link href={`/arbol/${arbol.codigo}`} className={botonSecundario} target="_blank">
          <Icono nombre="ojo" className="size-4" /> Ver ficha pública
        </Link>
      </Encabezado>
      {guardado && <p className="animate-aparecer mb-4 rounded-2xl bg-musgo-claro px-4 py-3 text-sm font-semibold text-musgo-oscuro">Árbol guardado.</p>}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Tarjeta titulo="Datos del ejemplar">
          <FormularioArbol
            especies={especies}
            zonas={listaZonas}
            valores={{ ...arbol, especie_id: arbol.especie_id, latitud: arbol.latitud, longitud: arbol.longitud }}
          />
        </Tarjeta>
        <div className="space-y-4">
          <Tarjeta titulo="Estado">
            <div className="flex items-center gap-4">
              {ficha && <ArbolSprite genoma={ficha.especie.sprite} etapa={5} semilla={arbol.codigo} className="w-20 shrink-0" />}
              <div className="space-y-1 text-sm">
                <ChipEstado estado={arbol.estado_actual} />
                <p className="text-tinta-suave">{ficha?.observaciones ?? 0} observaciones · {ficha?.guardianes ?? 0} guardianes</p>
                <p className="text-tinta-suave">Última inspección: {arbol.ultima_inspeccion ?? "sin registro"}</p>
              </div>
            </div>
            {arbol.foto_principal && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlFoto(arbol.foto_principal)!} alt="Foto principal" className="mt-4 aspect-video w-full rounded-2xl object-cover" />
            )}
          </Tarjeta>
          <Tarjeta titulo="Código QR">
            <div className="flex items-center gap-4">
              <div className="size-32 shrink-0 rounded-2xl bg-white p-2" dangerouslySetInnerHTML={{ __html: svg }} />
              <div className="min-w-0 text-sm">
                <p className="break-all font-mono text-xs text-tinta-suave">
                  {urlSitio()}/a/{arbol.qr_id}
                </p>
                <a
                  href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
                  download={`qr-${arbol.codigo}.svg`}
                  className="mt-3 inline-flex items-center gap-1 font-bold text-musgo hover:underline"
                >
                  <Icono nombre="descargar" className="size-4" /> Descargar SVG
                </a>
              </div>
            </div>
          </Tarjeta>
        </div>
      </div>
      <Tarjeta titulo="Historial de observaciones" className="mt-4">
        {filas.length === 0 ? (
          <p className="text-sm text-tinta-suave">Sin observaciones.</p>
        ) : (
          <ul className="divide-y divide-linea">
            {filas.map((o) => {
              const e = ESTADOS_REPORTE.find((x) => x.valor === o.estado_reportado);
              return (
                <li key={o.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: e?.color }} />
                  <span className="w-28 shrink-0 text-tinta-suave">{fecha.format(o.fecha)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{e?.etiqueta}</span>
                    {o.categorias.length > 0 && <span className="text-tinta-suave"> · {o.categorias.map(etiquetaCategoria).join(", ")}</span>}
                    {o.comentario && <span className="block truncate text-xs text-tinta-suave">“{o.comentario}”</span>}
                  </span>
                  <span className="hidden text-tinta-suave sm:block">{o.alias}</span>
                  <BotonesValidacion id={o.id} validada={o.validada} />
                </li>
              );
            })}
          </ul>
        )}
      </Tarjeta>
    </>
  );
}
