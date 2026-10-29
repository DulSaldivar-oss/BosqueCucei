import Link from "next/link";
import { Icono } from "@/components/Icono";
import { Importador } from "@/components/admin/Importador";
import { Encabezado, Tarjeta } from "@/components/admin/Piezas";

export const metadata = { title: "Importar árboles" };

export default function Importar() {
  return (
    <>
      <Link href="/admin/arboles" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-tinta-suave hover:text-tinta">
        <Icono nombre="flechaIzq" className="size-4" /> Árboles
      </Link>
      <Encabezado titulo="Importar inventario" descripcion="Carga el inventario real de CUCEI desde Excel (guardado como CSV). Primero revisa, luego importa." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Tarjeta>
          <Importador />
        </Tarjeta>
        <Tarjeta titulo="Columnas">
          <dl className="space-y-2 text-sm">
            {[
              ["codigo", "Obligatoria. Código de la placa (CUCEI-0027). Si ya existe, se actualiza."],
              ["especie", "Obligatoria. Identificador (jacaranda), nombre científico o nombre común del catálogo."],
              ["latitud, longitud", "Obligatorias. Grados decimales; se acepta coma decimal."],
              ["zona", "Obligatoria. Módulo o área del campus."],
              ["qr_id", "Texto que trae el QR ya colocado (puede ser una URL). Si falta, se usa el código."],
              ["altura_m, diametro_cm", "Opcionales."],
              ["fecha_registro", "Opcional, AAAA-MM-DD."],
              ["apodo", "Opcional."],
            ].map(([c, d]) => (
              <div key={c}>
                <dt className="font-mono text-xs font-bold text-musgo">{c}</dt>
                <dd className="text-tinta-suave">{d}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-tinta-suave">Excel en español separa con «;» y usa coma decimal: ambas cosas se detectan solas.</p>
        </Tarjeta>
      </div>
    </>
  );
}
