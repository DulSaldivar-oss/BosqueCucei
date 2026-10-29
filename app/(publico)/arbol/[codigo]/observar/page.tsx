import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormularioObservacion } from "@/components/publico/FormularioObservacion";
import { requiereUsuario } from "@/lib/auth";
import { arbolPorCodigo, relacionConArbol } from "@/lib/consultas/publico";
import { etapaPorVisitas } from "@/lib/juego/crecimiento";
import { claveSemana } from "@/lib/juego/semana";

export const metadata: Metadata = { title: "Registrar observación" };

export default async function Observar({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const usuario = await requiereUsuario(`/arbol/${codigo}/observar`);
  const arbol = await arbolPorCodigo(codigo);
  if (!arbol) notFound();
  const relacion = await relacionConArbol(usuario.id, arbol.id);
  return (
    <FormularioObservacion
      arbol={{
        id: arbol.id,
        codigo: arbol.codigo,
        nombre: arbol.apodo ?? arbol.especie.nombre_comun,
        especie: arbol.especie.nombre_comun,
        sprite: arbol.especie.sprite,
        etapa: etapaPorVisitas(relacion?.numero_visitas ?? 0),
      }}
      yaRegado={relacion?.ultima_semana === claveSemana()}
    />
  );
}
