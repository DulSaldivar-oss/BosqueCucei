import Link from "next/link";
import { Icono } from "@/components/Icono";
import { FormularioArbol } from "@/components/admin/FormularioArbol";
import { Encabezado, Tarjeta } from "@/components/admin/Piezas";
import { especiesParaSelector, zonas } from "@/lib/consultas/admin";
import { diaLocal } from "@/lib/juego/semana";

export const metadata = { title: "Nuevo árbol" };

export default async function NuevoArbol() {
  const [especies, listaZonas] = await Promise.all([especiesParaSelector(), zonas()]);
  return (
    <>
      <Link href="/admin/arboles" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-tinta-suave hover:text-tinta">
        <Icono nombre="flechaIzq" className="size-4" /> Árboles
      </Link>
      <Encabezado titulo="Nuevo árbol" descripcion="Registra un ejemplar con su placa. Después podrás imprimir su código QR." />
      <Tarjeta>
        <FormularioArbol
          especies={especies}
          zonas={listaZonas}
          valores={{
            codigo: "",
            qr_id: "",
            especie_id: "",
            apodo: null,
            latitud: "",
            longitud: "",
            zona: "",
            fecha_registro: diaLocal(new Date()),
            altura_m: null,
            diametro_cm: null,
            notas_publicas: null,
            activo: true,
          }}
        />
      </Tarjeta>
    </>
  );
}
