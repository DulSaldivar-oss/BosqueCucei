import { FormularioAjustes } from "@/components/admin/FormularioAjustes";
import { Encabezado } from "@/components/admin/Piezas";
import { listarAjustes } from "@/lib/consultas/admin";

export const metadata = { title: "Reglas y ajustes" };

export default async function Ajustes() {
  const ajustes = await listarAjustes();
  return (
    <>
      <Encabezado
        titulo="Reglas y ajustes"
        descripcion="La regla inicial de alertas es parametrizable (sección 7): ajústala después de las primeras pruebas del piloto."
      />
      <FormularioAjustes ajustes={ajustes} />
    </>
  );
}
