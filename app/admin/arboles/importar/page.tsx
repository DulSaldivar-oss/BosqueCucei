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
      <Encabezado
        titulo="Importar inventario"
        descripcion="Sube el Excel oficial del inventario de árboles (el mismo de la semilla inicial). Primero revisa, luego importa."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Tarjeta>
          <Importador />
        </Tarjeta>
        <div className="space-y-4">
          <Tarjeta titulo="Excel del inventario">
            <p className="text-sm text-tinta-suave">
              Se reconocen sus columnas aunque cambien de orden: <strong className="text-tinta">No. de árbol</strong>,{" "}
              <strong className="text-tinta">Nombre científico</strong>, <strong className="text-tinta">Latitud</strong> y{" "}
              <strong className="text-tinta">Longitud</strong> son obligatorias; también se usan Especie, Sector, Estado, Fecha de registro, Estado
              fitosanitario, medidas, CO₂, Familia, Follaje, Clima, Floración y fruto y Campus.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-tinta-suave">
              <li>El código del árbol es campus + número: el 27 queda como CUCEI-0027.</li>
              <li>La especie sale del nombre científico (sin autores ni sinónimos). Las que no existan se crean.</li>
              <li>Una medida vacía no borra la que ya esté guardada. Apodo, foto, notas y QR no se tocan.</li>
              <li>
                Para conservarlo, guarda también el Excel en el repositorio (
                <code className="font-mono text-xs">data/inventario/arboles-cucei.xlsx</code>) y corre{" "}
                <code className="font-mono text-xs">npm run inventario:importar</code>: la semilla se vuelve a aplicar cada vez que cambia.
              </li>
            </ul>
          </Tarjeta>
          <Tarjeta titulo="CSV sencillo">
            <dl className="space-y-2 text-sm">
              {[
                ["codigo", "Obligatoria. Código de la placa (CUCEI-0027). Si ya existe, se actualiza."],
                ["especie", "Obligatoria. Identificador (jacaranda), nombre científico o nombre común del catálogo."],
                ["latitud, longitud", "Obligatorias. Grados decimales; se acepta coma decimal."],
                ["zona", "Obligatoria. Sector o área del campus."],
                ["qr_id", "Texto que trae el QR ya colocado (puede ser una URL). Si falta, se usa el código."],
                ["altura_m, diametro_cm, fecha_registro, apodo", "Opcionales (fecha AAAA-MM-DD)."],
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
      </div>
    </>
  );
}
