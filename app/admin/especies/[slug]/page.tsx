import Link from "next/link";
import { notFound } from "next/navigation";
import { Icono } from "@/components/Icono";
import { EditorEspecie } from "@/components/admin/EditorEspecie";
import { Encabezado } from "@/components/admin/Piezas";
import { especiePorSlug } from "@/lib/consultas/publico";

export const metadata = { title: "Editar especie" };

export default async function EditarEspecie({ params }: { params: Promise<{ slug: string }> }) {
  const especie = await especiePorSlug((await params).slug);
  if (!especie) notFound();
  return (
    <>
      <Link href="/admin/especies" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-tinta-suave hover:text-tinta">
        <Icono nombre="flechaIzq" className="size-4" /> Especies
      </Link>
      <Encabezado titulo={especie.nombre_comun} descripcion="Ajusta el sprite y mira el resultado en vivo en todas las etapas." />
      <EditorEspecie especie={especie} />
    </>
  );
}
