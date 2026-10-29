import type { Metadata } from "next";
import Link from "next/link";
import { Herbario } from "@/components/publico/Herbario";
import { SelectorJardin } from "@/components/publico/SelectorJardin";
import { usuarioActual } from "@/lib/auth";
import { herbario } from "@/lib/consultas/publico";

export const metadata: Metadata = { title: "Herbario" };

export default async function PaginaHerbario() {
  const usuario = await usuarioActual();
  const especies = await herbario(usuario?.id ?? null);
  const descubiertas = especies.filter((e) => e.descubierta).length;
  const porcentaje = especies.length ? Math.round((descubiertas / especies.length) * 100) : 0;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{usuario ? "Mi herbario" : "Especies del campus"}</h1>
          <p className="text-tinta-suave">
            {usuario ? "Cada especie que descubres queda prensada aquí." : "Crea una cuenta para coleccionarlas mientras recorres CUCEI."}
          </p>
        </div>
        {usuario && <SelectorJardin actual="herbario" />}
      </header>

      {usuario ? (
        <div className="rounded-3xl border border-linea bg-tarjeta p-4 shadow-tarjeta sm:p-5">
          <div className="flex items-end justify-between">
            <p className="font-display text-3xl font-bold">
              {descubiertas}
              <span className="text-lg text-tinta-suave"> de {especies.length} especies</span>
            </p>
            <p className="text-sm font-bold text-jacaranda">{porcentaje}%</p>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-papel-2">
            <div className="brillo-barra h-full rounded-full bg-jacaranda transition-[width] duration-1000" style={{ width: `${porcentaje}%` }} />
          </div>
        </div>
      ) : (
        <Link href="/registro?siguiente=/herbario" className="block rounded-3xl bg-jacaranda/12 px-5 py-4 font-semibold text-jacaranda transition hover:bg-jacaranda/20">
          Crea tu cuenta para empezar tu colección →
        </Link>
      )}

      <Herbario
        conSesion={!!usuario}
        fichas={especies.map((e) => ({
          slug: e.slug,
          nombre: e.nombre_comun,
          cientifico: e.nombre_cientifico,
          familia: e.familia,
          rareza: e.rareza,
          sprite: e.sprite,
          descubierta: e.descubierta ? new Date(e.descubierta).toISOString() : null,
          pista: e.zonas.length ? `Búscala cerca de ${e.zonas[0]}` : "Pista no disponible",
          ejemplares: e.ejemplares,
        }))}
      />
    </div>
  );
}
