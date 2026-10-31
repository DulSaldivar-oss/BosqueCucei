import Link from "next/link";
import { ArbolSprite } from "@/components/ArbolSprite";
import { Encabezado } from "@/components/admin/Piezas";
import { listarEspeciesAdmin } from "@/lib/consultas/admin";

export const metadata = { title: "Especies" };

export default async function Especies() {
  const especies = await listarEspeciesAdmin();
  return (
    <>
      <Encabezado
        titulo="Especies y sprites"
        descripcion="Catálogo del herbario. Cada especie tiene un genoma con el que se dibuja su árbol virtual en las 7 etapas de crecimiento."
      />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 escalonado">
        {especies.map((e, i) => (
          <li key={e.id} style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
            <Link href={`/admin/especies/${e.slug}`} className="group flex h-full flex-col rounded-3xl border border-linea bg-tarjeta p-4 shadow-tarjeta transition hover:-translate-y-1 hover:border-musgo/40">
              <ArbolSprite genoma={e.sprite} etapa={6} semilla={e.slug} vivo retraso={-i * 0.5} className="mx-auto aspect-[5/6] w-3/4" />
              <p className="mt-2 font-bold">{e.nombre_comun}</p>
              <p className="text-xs text-tinta-suave italic">{e.nombre_cientifico}</p>
              <p className="mt-auto pt-2 text-xs text-tinta-suave">
                {e.ejemplares} ejemplares · {e.observaciones} obs. · {e.origen === "nativa" ? "Nativa" : e.origen === "introducida" ? "Introducida" : "Origen por confirmar"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
