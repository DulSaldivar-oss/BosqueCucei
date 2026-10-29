import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArbolSprite } from "@/components/ArbolSprite";
import { ChipEstado } from "@/components/ChipEstado";
import { Floracion } from "@/components/Floracion";
import { Icono } from "@/components/Icono";
import { arbolesDeEspecie, especiePorSlug } from "@/lib/consultas/publico";
import { RAREZAS } from "@/lib/juego/catalogos";
import { VISITAS_POR_ETAPA } from "@/lib/juego/crecimiento";
import { ETAPAS } from "@/lib/sprites/generar";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const especie = await especiePorSlug((await params).slug);
  return { title: especie?.nombre_comun ?? "Especie" };
}

export default async function PaginaEspecie({ params }: Props) {
  const especie = await especiePorSlug((await params).slug);
  if (!especie) notFound();
  const arboles = await arbolesDeEspecie(especie.id);
  const rareza = RAREZAS[especie.rareza];

  return (
    <div className="space-y-8">
      <Link href="/herbario" className="inline-flex items-center gap-1 text-sm font-semibold text-tinta-suave hover:text-tinta">
        <Icono nombre="flechaIzq" className="size-4" /> Herbario
      </Link>

      <section className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_1.2fr]">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-[#d6e7ee] via-[#eaf0dd] to-[#efe5cf]">
          {especie.foto_url ? (
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={especie.foto_url} alt={`Fotografía de ${especie.nombre_comun}`} className="aspect-[4/5] w-full object-cover" />
              {especie.foto_credito && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-black/45 px-3 py-1.5 text-[11px] text-white">{especie.foto_credito}</figcaption>
              )}
            </figure>
          ) : (
            <div className="relative aspect-[4/5]">
              <ArbolSprite genoma={especie.sprite} etapa={6} semilla={especie.slug} vivo className="absolute inset-x-[8%] bottom-[4%]" />
              <div className="absolute inset-x-0 bottom-0 h-[10%] bg-[#9fc27a]" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: `${rareza.color}22`, color: rareza.color }}>
              {rareza.etiqueta} · {especie.ejemplares} {especie.ejemplares === 1 ? "ejemplar" : "ejemplares"}
            </span>
            <span className="rounded-full bg-papel-2 px-2.5 py-1 text-xs font-bold text-tinta-suave">
              {especie.origen === "nativa" ? "Nativa de México" : "Introducida"}
            </span>
            <span className="rounded-full bg-papel-2 px-2.5 py-1 text-xs font-bold text-tinta-suave">{especie.familia}</span>
          </div>
          <h1 className="font-display text-4xl leading-none font-bold sm:text-5xl">{especie.nombre_comun}</h1>
          <p className="text-lg text-tinta-suave italic">{especie.nombre_cientifico}</p>
          {especie.otros_nombres.length > 0 && <p className="text-sm text-tinta-suave">También: {especie.otros_nombres.join(", ")}</p>}
          <p className="leading-relaxed text-pretty">{especie.descripcion}</p>
          {especie.dato_curioso && (
            <p className="font-display rounded-3xl bg-primavera/20 p-4 text-lg leading-snug">
              <Icono nombre="estrella" className="mr-1 inline size-5 text-[#8a6a00]" /> {especie.dato_curioso}
            </p>
          )}
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border border-linea bg-tarjeta px-3 py-2.5">
              <dt className="text-xs font-semibold text-tinta-suave">Altura máx.</dt>
              <dd className="font-bold">{especie.altura_max_m ? `${especie.altura_max_m} m` : "—"}</dd>
            </div>
            <div className="rounded-2xl border border-linea bg-tarjeta px-3 py-2.5">
              <dt className="text-xs font-semibold text-tinta-suave">Follaje</dt>
              <dd className="font-bold capitalize">{especie.follaje ?? "—"}</dd>
            </div>
            <div className="col-span-2 rounded-2xl border border-linea bg-tarjeta px-3 py-2.5 sm:col-span-1">
              <dt className="text-xs font-semibold text-tinta-suave">Origen</dt>
              <dd className="font-bold">{especie.distribucion ?? "—"}</dd>
            </div>
          </dl>
          {especie.wikipedia_url && (
            <a href={especie.wikipedia_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-musgo hover:underline">
              Leer más en Wikipedia <Icono nombre="flechaDer" className="size-4" />
            </a>
          )}
        </div>
      </section>

      <section aria-labelledby="etapas" className="rounded-[28px] border border-linea bg-tarjeta p-5 shadow-tarjeta sm:p-6">
        <h2 id="etapas" className="font-display text-2xl font-bold">
          Cómo crece en tu jardín
        </h2>
        <p className="text-sm text-tinta-suave">Cada visita válida (una por semana) lo acerca a la siguiente etapa.</p>
        <ol className="mt-4 grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-7">
          {ETAPAS.map((e) => (
            <li key={e.n} className="text-center">
              <ArbolSprite genoma={especie.sprite} etapa={e.n} semilla={especie.slug} encuadre="completo" vivo={e.n >= 3} className="aspect-[5/6] w-full" />
              <p className="text-xs font-bold sm:text-sm">{e.nombre}</p>
              <p className="text-[11px] text-tinta-suave sm:text-xs">{e.n === 0 ? "por descubrir" : `${VISITAS_POR_ETAPA[e.n]} ${VISITAS_POR_ETAPA[e.n] === 1 ? "visita" : "visitas"}`}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border border-linea bg-tarjeta p-5 shadow-tarjeta">
          <h2 className="font-display mb-3 text-xl font-bold">Floración</h2>
          <Floracion meses={especie.floracion_meses} color={especie.color_flor} />
          {especie.beneficios.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {especie.beneficios.map((b) => (
                <li key={b} className="rounded-full bg-musgo-claro px-3 py-1 text-xs font-bold text-musgo-oscuro">
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-[28px] border border-linea bg-tarjeta p-5 shadow-tarjeta">
          <h2 className="font-display text-xl font-bold">Dónde encontrarla</h2>
          <ul className="mt-3 max-h-72 divide-y divide-linea overflow-y-auto">
            {arboles.map((a) => (
              <li key={a.codigo}>
                <Link href={`/arbol/${a.codigo}`} className="flex items-center gap-3 py-2.5 hover:text-musgo">
                  <span className="font-mono text-xs text-tinta-suave">{a.codigo}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{a.apodo ?? a.zona}</span>
                  <ChipEstado estado={a.estado_actual} compacto />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
