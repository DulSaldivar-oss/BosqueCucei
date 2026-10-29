import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArbolSprite } from "@/components/ArbolSprite";
import { ChipEstado } from "@/components/ChipEstado";
import { Floracion } from "@/components/Floracion";
import { Icono } from "@/components/Icono";
import { Pestanas } from "@/components/Pestanas";
import { Sello } from "@/components/Sello";
import { BotonGuardian } from "@/components/publico/BotonGuardian";
import { usuarioActual } from "@/lib/auth";
import {
  arbolPorCodigo,
  guardianesArbol,
  historialArbol,
  relacionConArbol,
  saludPorSemana,
  type Arbol,
  type RelacionArbol,
} from "@/lib/consultas/publico";
import { urlFoto } from "@/lib/fotos";
import { ESTADOS_ARBOL, RAREZAS, etiquetaCategoria, etiquetaEstadoReporte, ESTADOS_REPORTE, type EstadoArbol } from "@/lib/juego/catalogos";
import { etapaPorVisitas, nombreEtapa, siguienteEtapa } from "@/lib/juego/crecimiento";
import { claveSemana, estadoRiego, inicioProximaSemana } from "@/lib/juego/semana";

type Props = { params: Promise<{ codigo: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const arbol = await arbolPorCodigo((await params).codigo);
  return arbol ? { title: `${arbol.apodo ?? arbol.especie.nombre_comun} · ${arbol.codigo}` } : { title: "Árbol no encontrado" };
}

const fechaCorta = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Mexico_City" });
const fechaRelativa = new Intl.RelativeTimeFormat("es-MX", { numeric: "auto" });

function haceCuanto(fecha: Date) {
  const dias = Math.round((fecha.getTime() - Date.now()) / 86_400_000);
  if (dias === 0) return "hoy";
  if (Math.abs(dias) < 30) return fechaRelativa.format(dias, "day");
  return fechaCorta.format(fecha);
}

export default async function FichaArbol({ params }: Props) {
  const { codigo } = await params;
  const arbol = await arbolPorCodigo(codigo);
  if (!arbol) notFound();
  const usuario = await usuarioActual();
  const [relacion, historial, salud, guardianes] = await Promise.all([
    usuario ? relacionConArbol(usuario.id, arbol.id) : null,
    historialArbol(arbol.id),
    saludPorSemana(arbol.id),
    guardianesArbol(arbol.id),
  ]);
  const e = arbol.especie;
  const semana = claveSemana();
  const yaRegado = relacion?.ultima_semana === semana;
  const destinoObservar = `/arbol/${arbol.codigo}/observar`;
  const rareza = RAREZAS[e.rareza];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <Link href="/mapa" className="inline-flex items-center gap-1 text-sm font-semibold text-tinta-suave hover:text-tinta">
        <Icono nombre="flechaIzq" className="size-4" /> Mapa
      </Link>

      <article className="grid gap-5 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-8">
        {/* Lámina del ejemplar */}
        <div className="animate-aparecer relative">
          <div className="relative overflow-hidden rounded-[28px] border-8 border-tarjeta bg-gradient-to-b from-[#d6e7ee] via-[#eaf0dd] to-[#efe5cf] shadow-tarjeta">
            {arbol.foto_principal ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlFoto(arbol.foto_principal)!} alt={`Fotografía de ${arbol.codigo}`} className="aspect-[4/5] w-full object-cover" />
            ) : (
              <div className="relative aspect-[4/5] w-full">
                <ArbolSprite genoma={e.sprite} etapa={6} semilla={arbol.codigo} vivo className="absolute inset-x-[6%] bottom-[4%]" />
                <div className="absolute inset-x-0 bottom-0 h-[10%] bg-[#9fc27a]" aria-hidden="true" />
              </div>
            )}
            <span className="absolute top-3 left-3">
              <Sello texto={arbol.codigo} className="bg-tarjeta/80 backdrop-blur" />
            </span>
          </div>
          {/* Cinta adhesiva en las esquinas, como en un herbario */}
          <span className="absolute -top-2 left-8 h-6 w-20 -rotate-6 bg-primavera/50 mix-blend-multiply" aria-hidden="true" />
          <span className="absolute -top-1 right-6 h-6 w-16 rotate-[8deg] bg-jacaranda/35 mix-blend-multiply" aria-hidden="true" />
        </div>

        <div className="space-y-5">
          <header className="animate-aparecer" style={{ animationDelay: "60ms" }}>
            <div className="flex flex-wrap items-center gap-2">
              <ChipEstado estado={arbol.estado_actual} />
              <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: `${rareza.color}22`, color: rareza.color }}>
                {rareza.etiqueta} en el campus
              </span>
              <span className="rounded-full bg-papel-2 px-2.5 py-1 text-xs font-bold text-tinta-suave">
                {e.origen === "nativa" ? "Nativa de México" : "Introducida"}
              </span>
            </div>
            <h1 className="font-display mt-3 text-[2rem] leading-[1.05] font-bold tracking-tight sm:text-5xl">
              {arbol.apodo ?? e.nombre_comun}
            </h1>
            <p className="mt-1 text-lg text-tinta-suave">
              {arbol.apodo && <span>{e.nombre_comun} · </span>}
              <Link href={`/especie/${e.slug}`} className="italic underline decoration-linea underline-offset-4 hover:decoration-musgo">
                {e.nombre_cientifico}
              </Link>
            </p>
          </header>

          <dl className="grid grid-cols-2 gap-2 text-sm min-[420px]:grid-cols-3">
            {[
              { t: "Ubicación", d: arbol.zona, i: "ubicacion" as const },
              { t: "Altura aprox.", d: arbol.altura_m ? `${arbol.altura_m} m` : "—", i: "flechaArriba" as const },
              { t: "Diámetro", d: arbol.diametro_cm ? `${arbol.diametro_cm} cm` : "—", i: "mira" as const },
              { t: "Familia", d: e.familia, i: "hoja" as const },
              { t: "Observaciones", d: String(arbol.observaciones), i: "ojo" as const },
              { t: "Última", d: arbol.ultima_observacion ? haceCuanto(arbol.ultima_observacion) : "Sin datos", i: "reloj" as const },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-linea bg-tarjeta px-3 py-2.5">
                <dt className="flex items-center gap-1 text-xs font-semibold text-tinta-suave">
                  <Icono nombre={x.i} className="size-3.5" /> {x.t}
                </dt>
                <dd className="mt-0.5 truncate font-bold">{x.d}</dd>
              </div>
            ))}
          </dl>

          <TuArbol arbol={arbol} relacion={relacion} conSesion={!!usuario} />

          <div className="hidden md:block">
            <BotonObservar destino={destinoObservar} conSesion={!!usuario} yaRegado={yaRegado} />
          </div>
        </div>
      </article>

      <Pestanas
        pestanas={[
          {
            id: "info",
            etiqueta: "Información",
            contenido: (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4 rounded-3xl border border-linea bg-tarjeta p-5 shadow-tarjeta">
                  <p className="leading-relaxed text-pretty">{e.descripcion}</p>
                  {arbol.notas_publicas && <p className="rounded-2xl bg-papel-2/70 p-3 text-sm">{arbol.notas_publicas}</p>}
                  {e.beneficios.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                      {e.beneficios.map((b) => (
                        <li key={b} className="inline-flex items-center gap-1 rounded-full bg-musgo-claro px-3 py-1 text-xs font-bold text-musgo-oscuro">
                          <Icono nombre="hoja" className="size-3.5" /> {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-sm text-tinta-suave">
                    <strong className="text-tinta">Origen:</strong> {e.distribucion ?? (e.origen === "nativa" ? "México" : "Fuera de México")}
                  </p>
                </div>
                <div className="space-y-4">
                  {e.dato_curioso && (
                    <div className="rounded-3xl bg-primavera/20 p-5">
                      <p className="flex items-center gap-2 text-xs font-black tracking-widest text-[#8a6a00] uppercase">
                        <Icono nombre="estrella" className="size-4" /> ¿Sabías que…?
                      </p>
                      <p className="font-display mt-2 text-lg leading-snug">{e.dato_curioso}</p>
                    </div>
                  )}
                  <div className="rounded-3xl border border-linea bg-tarjeta p-5 shadow-tarjeta">
                    <p className="mb-3 text-sm font-bold">Calendario de floración</p>
                    <Floracion meses={e.floracion_meses} color={e.color_flor} />
                  </div>
                  <Link href={`/especie/${e.slug}`} className="flex items-center justify-between rounded-3xl border border-linea bg-tarjeta px-5 py-4 font-bold shadow-tarjeta transition hover:-translate-y-0.5">
                    Ver la especie y sus {e.ejemplares} ejemplares <Icono nombre="flechaDer" className="size-5" />
                  </Link>
                </div>
              </div>
            ),
          },
          {
            id: "salud",
            etiqueta: "Salud",
            contenido: <Salud arbol={arbol} historial={historial} salud={salud} />,
          },
          {
            id: "guardianes",
            etiqueta: "Guardianes",
            contenido: (
              <div className="rounded-3xl border border-linea bg-tarjeta p-5 shadow-tarjeta">
                <p className="text-sm text-tinta-suave">
                  Personas que han visitado este árbol. Se ordena por visitas válidas (una por semana), no por escaneos.
                </p>
                {guardianes.length === 0 ? (
                  <p className="mt-4 rounded-2xl bg-papel-2/60 p-4 text-center font-semibold">Aún nadie lo cuida. ¡Sé la primera persona!</p>
                ) : (
                  <ol className="mt-3 divide-y divide-linea">
                    {guardianes.map((g, i) => (
                      <li key={g.alias} className="flex items-center gap-3 py-3">
                        <span className={`font-display w-6 text-center text-lg font-bold ${i === 0 ? "text-primavera" : "text-tinta-suave"}`}>{i + 1}</span>
                        <span className="grid size-10 place-items-center rounded-full bg-musgo-claro font-bold text-musgo">{g.alias[0].toUpperCase()}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 truncate font-bold">
                            {g.alias}
                            {g.guardian && <Icono nombre="corazon" className="size-3.5 text-tabachin" grosor={2.4} titulo="Lo cuida" />}
                          </span>
                          <span className="text-xs text-tinta-suave">Nivel {g.nivel}</span>
                        </span>
                        <span className="text-right text-sm">
                          <span className="font-bold">{g.numero_visitas}</span>{" "}
                          <span className="text-tinta-suave">{g.numero_visitas === 1 ? "visita" : "visitas"}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ),
          },
        ]}
      />

      <div className="fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 px-4 md:hidden">
        <div className="mx-auto max-w-md">
          <BotonObservar destino={destinoObservar} conSesion={!!usuario} yaRegado={yaRegado} />
        </div>
      </div>
    </div>
  );
}

function BotonObservar({ destino, conSesion, yaRegado }: { destino: string; conSesion: boolean; yaRegado: boolean }) {
  const href = conSesion ? destino : `/entrar?siguiente=${encodeURIComponent(destino)}`;
  return (
    <Link
      href={href}
      className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-bold shadow-flotante transition active:scale-[.98] ${
        yaRegado ? "bg-tarjeta text-musgo ring-2 ring-musgo/25 hover:bg-musgo-claro" : "bg-musgo text-papel hover:bg-musgo-oscuro"
      }`}
    >
      <Icono nombre={yaRegado ? "ojo" : "regadera"} className="size-5" grosor={2.2} />
      {yaRegado ? "Observar de nuevo" : conSesion ? "Registrar observación" : "Entra para registrar"}
    </Link>
  );
}

function TuArbol({ arbol, relacion, conSesion }: { arbol: Arbol; relacion: RelacionArbol | null; conSesion: boolean }) {
  if (!conSesion) {
    return (
      <div className="rounded-3xl border border-dashed border-musgo/30 bg-musgo-claro/50 p-4 text-sm">
        <p className="font-bold text-musgo-oscuro">Haz crecer este árbol en tu jardín</p>
        <p className="mt-1 text-tinta-suave">Con una cuenta, cada visita semanal lo riega y lo hace crecer. La ficha es pública.</p>
      </div>
    );
  }
  if (!relacion) {
    return (
      <div className="flex items-center gap-4 rounded-3xl border border-linea bg-tarjeta p-4 shadow-tarjeta">
        <ArbolSprite genoma={arbol.especie.sprite} etapa={0} semilla={arbol.codigo} className="w-16 shrink-0" />
        <div className="text-sm">
          <p className="font-bold">Aún no lo descubres</p>
          <p className="text-tinta-suave">Registra tu primera observación y plantarás su semilla en tu jardín.</p>
        </div>
      </div>
    );
  }
  const semana = claveSemana();
  const etapa = etapaPorVisitas(relacion.numero_visitas);
  const siguiente = siguienteEtapa(relacion.numero_visitas);
  const riego = estadoRiego(relacion.ultima_semana, semana);
  const dias = Math.max(1, Math.ceil((inicioProximaSemana().getTime() - Date.now()) / 86_400_000));
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-linea bg-tarjeta p-4 shadow-tarjeta">
      <div className="relative w-20 shrink-0">
        <ArbolSprite genoma={arbol.especie.sprite} etapa={etapa} semilla={arbol.codigo} vivo className={riego === "sediento" ? "saturate-50" : ""} />
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="text-xs font-bold tracking-wide text-tinta-suave uppercase">Tu árbol · {nombreEtapa(etapa)}</p>
        <p className="mt-0.5 font-bold">
          {relacion.numero_visitas} {relacion.numero_visitas === 1 ? "visita válida" : "visitas válidas"}
          {siguiente && <span className="font-normal text-tinta-suave"> · faltan {siguiente.faltan} para crecer</span>}
        </p>
        <p className={`mt-1 flex items-center gap-1 font-semibold ${riego === "regado" ? "text-agua" : riego === "sediento" ? "text-tabachin" : "text-musgo"}`}>
          <Icono nombre="gota" className="size-4" grosor={2.2} />
          {riego === "regado" ? `Regado esta semana · vuelve a contar en ${dias} ${dias === 1 ? "día" : "días"}` : riego === "sediento" ? "Tiene sed: hace semanas que no lo visitas" : "Listo para regar esta semana"}
        </p>
        <div className="mt-2">
          <BotonGuardian arbolId={arbol.id} codigo={arbol.codigo} guardian={relacion.guardian} />
        </div>
      </div>
    </div>
  );
}

function Salud({
  arbol,
  historial,
  salud,
}: {
  arbol: Arbol;
  historial: Awaited<ReturnType<typeof historialArbol>>;
  salud: Awaited<ReturnType<typeof saludPorSemana>>;
}) {
  const maximo = Math.max(1, ...salud.map((s) => s.bien + s.anomalia));
  const info = ESTADOS_ARBOL[arbol.estado_actual as EstadoArbol];
  const explicacion: Record<string, string> = {
    normal: "Las observaciones recientes no muestran problemas.",
    pendiente: "Alguien notó algo diferente. Si puedes, obsérvalo tú también.",
    posible_problema: "Varias personas reportaron anomalías. Sustentabilidad ya fue avisado.",
    revision_requerida: "Se pidió una revisión. Ten precaución cerca del árbol.",
    sin_datos: "Hace tiempo que nadie lo observa. ¡Tu visita es muy valiosa!",
  };
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-4">
        <div className="rounded-3xl p-5" style={{ backgroundColor: info.fondo }}>
          <p className="text-xs font-black tracking-widest uppercase" style={{ color: info.color }}>
            Estado actual
          </p>
          <p className="font-display mt-1 text-2xl font-bold" style={{ color: info.color }}>
            {info.etiqueta}
          </p>
          <p className="mt-1 text-sm text-tinta">{explicacion[arbol.estado_actual]}</p>
        </div>
        <div className="rounded-3xl border border-linea bg-tarjeta p-5 shadow-tarjeta">
          <p className="text-sm font-bold">Observaciones por semana</p>
          <div className="mt-4 flex h-32 items-end gap-1.5" role="img" aria-label="Observaciones de las últimas 10 semanas">
            {salud.map((s, i) => (
              <div key={s.semana} className="flex h-full flex-1 flex-col justify-end gap-0.5" title={`${s.semana}: ${s.bien} bien, ${s.anomalia} con anomalía`}>
                <span
                  className="w-full origin-bottom rounded-t-md bg-estado-problema transition-all"
                  style={{ height: `${(s.anomalia / maximo) * 100}%`, animation: `aparecer .6s ${i * 40}ms both` }}
                />
                <span
                  className="w-full origin-bottom rounded-md bg-estado-normal"
                  style={{ height: `${(s.bien / maximo) * 100}%`, minHeight: s.bien + s.anomalia === 0 ? 3 : undefined, opacity: s.bien + s.anomalia === 0 ? 0.15 : 1, animation: `aparecer .6s ${i * 40}ms both` }}
                />
              </div>
            ))}
          </div>
          <p className="mt-2 flex gap-4 text-xs text-tinta-suave">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-estado-normal" /> Se ve bien
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-estado-problema" /> Con anomalía
            </span>
          </p>
        </div>
      </div>
      <div className="rounded-3xl border border-linea bg-tarjeta p-5 shadow-tarjeta">
        <p className="text-sm font-bold">Observaciones recientes</p>
        {historial.length === 0 ? (
          <p className="mt-3 text-sm text-tinta-suave">Todavía no hay observaciones.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {historial.map((o) => {
              const estado = ESTADOS_REPORTE.find((x) => x.valor === o.estado_reportado);
              return (
                <li key={o.id} className="flex gap-3">
                  <span className="mt-1 size-3 shrink-0 rounded-full" style={{ backgroundColor: estado?.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-bold">{etiquetaEstadoReporte(o.estado_reportado)}</span>{" "}
                      <span className="text-tinta-suave">
                        · {o.alias} · {haceCuanto(o.fecha)}
                      </span>
                    </p>
                    {o.categorias.length > 0 && (
                      <p className="mt-1 flex flex-wrap gap-1">
                        {o.categorias.map((c) => (
                          <span key={c} className="rounded-full bg-papel-2 px-2 py-0.5 text-xs font-semibold">
                            {etiquetaCategoria(c)}
                          </span>
                        ))}
                      </p>
                    )}
                    {o.comentario && <p className="mt-1 text-sm text-tinta-suave">“{o.comentario}”</p>}
                  </div>
                  {o.fotografia && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={urlFoto(o.fotografia)!} alt="Foto de la observación" className="size-14 shrink-0 rounded-xl object-cover" loading="lazy" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
