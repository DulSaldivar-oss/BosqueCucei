import Link from "next/link";
import { ChipEstado } from "@/components/ChipEstado";
import { Contador } from "@/components/Contador";
import { Icono } from "@/components/Icono";
import { MapaArboles } from "@/components/MapaArboles";
import { Encabezado, Indicador, NivelAlerta, Tarjeta } from "@/components/admin/Piezas";
import { leerAjustes } from "@/lib/ajustes";
import { arbolesPrioritarios, fotosRecientes, indicadores, listarAlertas, metricasPiloto, observacionesPorDia } from "@/lib/consultas/admin";
import { arbolesParaMapa } from "@/lib/consultas/publico";
import { pool } from "@/lib/db";
import { urlFoto } from "@/lib/fotos";
import { refrescarEstados } from "@/lib/servicios/alertas";

export const metadata = { title: "Resumen" };

const fechaCorta = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" });
const porcentaje = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

export default async function Resumen() {
  await refrescarEstados(pool(), await leerAjustes());
  const [ind, piloto, porDia, prioritarios, alertas, puntos, fotos] = await Promise.all([
    indicadores(),
    metricasPiloto(),
    observacionesPorDia(28),
    arbolesPrioritarios(8),
    listarAlertas("abierta", 5),
    arbolesParaMapa(null),
    fotosRecientes(6),
  ]);
  const tendencia = ind.obs_7_previos > 0 ? Math.round(((ind.obs_7 - ind.obs_7_previos) / ind.obs_7_previos) * 100) : null;
  const maximo = Math.max(1, ...porDia.map((d) => d.bien + d.anomalia));

  return (
    <>
      <Encabezado titulo="Resumen del arbolado" descripcion="Lo que la comunidad está observando y lo que necesita atención.">
        <Link href="/admin/alertas" className="inline-flex items-center gap-2 rounded-full bg-tabachin px-5 py-2.5 text-sm font-bold text-white shadow-tarjeta active:scale-95">
          <Icono nombre="alerta" className="size-4" /> {ind.alertas_abiertas} {ind.alertas_abiertas === 1 ? "alerta abierta" : "alertas abiertas"}
        </Link>
      </Encabezado>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Indicador titulo="Árboles con placa" valor={<Contador valor={ind.arboles} />} icono="arbol" color="#2D5A3D" />
        <Indicador
          titulo="Observaciones (7 días)"
          valor={<Contador valor={ind.obs_7} />}
          detalle={`${ind.obs_7_previos} la semana anterior`}
          icono="ojo"
          color="#3B9AE1"
          tendencia={tendencia}
        />
        <Indicador titulo="Personas activas (7 días)" valor={<Contador valor={ind.personas_7} />} detalle={`${ind.personas_total} registradas`} icono="usuarios" color="#8E6CC4" />
        <Indicador
          titulo="Alertas abiertas"
          valor={<Contador valor={ind.alertas_abiertas} />}
          detalle={ind.alertas_criticas ? `${ind.alertas_criticas} críticas` : "Ninguna crítica"}
          icono="alerta"
          color="#D64545"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Tarjeta titulo="Observaciones por día · últimas 4 semanas">
          <div className="flex h-44 items-end gap-[3px]" role="img" aria-label="Gráfica de observaciones por día">
            {porDia.map((d, i) => (
              <div key={d.dia} className="group relative flex h-full flex-1 flex-col justify-end">
                <span
                  className="w-full rounded-t-[3px] bg-estado-problema"
                  style={{ height: `${(d.anomalia / maximo) * 100}%`, animation: `aparecer .5s ${i * 18}ms both` }}
                />
                <span
                  className={`w-full bg-musgo ${d.anomalia ? "" : "rounded-t-[3px]"}`}
                  style={{ height: `${(d.bien / maximo) * 100}%`, minHeight: 2, opacity: d.bien + d.anomalia ? 1 : 0.15, animation: `aparecer .5s ${i * 18}ms both` }}
                />
                <span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 rounded-lg bg-tinta px-2 py-1 text-[11px] whitespace-nowrap text-papel group-hover:block">
                  {d.dia.slice(5)} · {d.bien + d.anomalia}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-tinta-suave">
            <span>{porDia[0].dia.slice(5)}</span>
            <span className="flex gap-3">
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-sm bg-musgo" /> Se ve bien
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-sm bg-estado-problema" /> Con anomalía
              </span>
            </span>
            <span>hoy</span>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Árboles que requieren revisión" accion={<Link href="/admin/arboles" className="text-sm font-bold text-musgo">Todos</Link>}>
          {prioritarios.length === 0 ? (
            <p className="text-sm text-tinta-suave">Nada pendiente. ✓</p>
          ) : (
            <ol className="divide-y divide-linea">
              {prioritarios.map((a) => (
                <li key={a.codigo}>
                  <Link href={`/admin/arboles/${a.codigo}`} className="flex items-center gap-3 py-2.5 hover:text-musgo">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">
                        {a.apodo ?? a.especie} <span className="font-mono text-xs font-normal text-tinta-suave">{a.codigo}</span>
                      </span>
                      <span className="text-xs text-tinta-suave">
                        {a.zona} · {a.reportes} {a.reportes === 1 ? "reporte" : "reportes"} en 14 días
                      </span>
                    </span>
                    <ChipEstado estado={a.estado_actual} compacto />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Tarjeta>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Tarjeta titulo="Mapa de estado">
          <MapaArboles puntos={puntos} className="h-[420px]" enlaceBase="/admin/arboles" />
        </Tarjeta>
        <div className="space-y-4">
          <Tarjeta titulo="Alertas abiertas" accion={<Link href="/admin/alertas" className="text-sm font-bold text-musgo">Ver todas</Link>}>
            {alertas.length === 0 ? (
              <p className="text-sm text-tinta-suave">No hay alertas abiertas.</p>
            ) : (
              <ul className="space-y-2">
                {alertas.map((a) => (
                  <li key={a.id}>
                    <Link href={`/admin/alertas/${a.id}`} className="block rounded-2xl border border-linea p-3 transition hover:border-musgo/40 hover:bg-papel/60">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">
                          {a.especie} <span className="font-mono text-xs font-normal text-tinta-suave">{a.codigo}</span>
                        </span>
                        <NivelAlerta nivel={a.nivel} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-tinta-suave">{a.motivo}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
          {fotos.length > 0 && (
            <Tarjeta titulo="Fotos recientes">
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((f) => (
                  <Link key={f.id} href={`/admin/arboles/${f.codigo}`} className="group relative overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urlFoto(f.fotografia)!} alt={`Foto de ${f.codigo}`} className="aspect-square w-full object-cover transition group-hover:scale-105" />
                    <span className="absolute inset-x-0 bottom-0 bg-black/50 px-1.5 py-0.5 text-[10px] text-white">{fechaCorta.format(f.fecha)}</span>
                  </Link>
                ))}
              </div>
            </Tarjeta>
          )}
        </div>
      </div>

      <Tarjeta titulo="¿Funciona el piloto?" className="mt-4">
        <p className="-mt-2 mb-4 text-sm text-tinta-suave">Indicadores de la sección 13 de la propuesta.</p>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { t: "Personas que escanearon al menos un árbol", v: piloto.escanearon, d: "con cuenta" },
            {
              t: "Vuelven una semana después",
              v: `${porcentaje(piloto.volvieron, piloto.elegibles)}%`,
              d: `${piloto.volvieron} de ${piloto.elegibles} con más de 7 días`,
            },
            { t: "Árboles con observaciones válidas", v: piloto.arboles_validos, d: `de ${ind.arboles} con placa` },
            { t: "Observaciones con fotografía", v: `${porcentaje(piloto.con_foto, piloto.observaciones)}%`, d: `${piloto.con_foto} de ${piloto.observaciones}` },
            { t: "Alertas generadas", v: piloto.alertas, d: `${piloto.alertas_utiles} útiles de ${piloto.alertas_evaluadas} evaluadas` },
            { t: "Tiempo para completar una observación", v: piloto.duracion_mediana_s !== null ? `${piloto.duracion_mediana_s} s` : "—", d: `mediana · promedio ${piloto.duracion_promedio_s ?? "—"} s · meta < 30 s` },
            { t: "Comentarios sobre la app", v: piloto.comentarios, d: "problemas de interfaz reportados" },
          ].map((m) => (
            <div key={m.t} className="rounded-2xl bg-papel/70 p-4">
              <dd className="font-display text-2xl font-bold">{m.v}</dd>
              <dt className="text-sm font-semibold">{m.t}</dt>
              <p className="text-xs text-tinta-suave">{m.d}</p>
            </div>
          ))}
        </dl>
      </Tarjeta>
    </>
  );
}
