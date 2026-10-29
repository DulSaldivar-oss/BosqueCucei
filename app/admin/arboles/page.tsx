import Link from "next/link";
import { ChipEstado } from "@/components/ChipEstado";
import { Icono } from "@/components/Icono";
import { Encabezado, botonPrimario, botonSecundario } from "@/components/admin/Piezas";
import { estiloCompacto } from "@/components/Campo";
import { listarArboles } from "@/lib/consultas/admin";
import { ESTADOS_ARBOL } from "@/lib/juego/catalogos";

export const metadata = { title: "Árboles" };

const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" });

export default async function Arboles({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string }> }) {
  const { q = "", estado = "" } = await searchParams;
  const arboles = await listarArboles(q.trim(), estado || null);
  return (
    <>
      <Encabezado titulo="Árboles" descripcion="Inventario con placa QR. Ordenado por prioridad de revisión.">
        <Link href="/admin/arboles/qr" className={botonSecundario}>
          <Icono nombre="imprimir" className="size-4" /> Imprimir QR
        </Link>
        <Link href="/admin/arboles/importar" className={botonSecundario}>
          <Icono nombre="subir" className="size-4" /> Importar CSV
        </Link>
        <Link href="/admin/arboles/nuevo" className={botonPrimario}>
          <Icono nombre="mas" className="size-4" grosor={2.4} /> Nuevo árbol
        </Link>
      </Encabezado>
      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Buscar código, especie, zona o apodo" className={`${estiloCompacto} min-w-0 max-w-md flex-1`} />
        <select name="estado" defaultValue={estado} className={estiloCompacto} aria-label="Estado">
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_ARBOL).map(([k, v]) => (
            <option key={k} value={k}>
              {v.etiqueta}
            </option>
          ))}
        </select>
        <button className={botonSecundario}>Filtrar</button>
      </form>
      <p className="mb-2 text-sm text-tinta-suave">{arboles.length} árboles</p>
      <div className="overflow-x-auto rounded-3xl border border-linea bg-tarjeta shadow-tarjeta">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-linea text-xs tracking-wide text-tinta-suave uppercase">
            <tr>
              <th className="px-4 py-3 font-bold">Código</th>
              <th className="px-4 py-3 font-bold">Especie</th>
              <th className="px-4 py-3 font-bold">Zona</th>
              <th className="px-4 py-3 font-bold">Estado</th>
              <th className="px-4 py-3 text-right font-bold">Obs.</th>
              <th className="px-4 py-3 font-bold">Última</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linea">
            {arboles.map((a) => (
              <tr key={a.id} className={`transition hover:bg-papel/60 ${a.activo ? "" : "opacity-50"}`}>
                <td className="px-4 py-2.5">
                  <Link href={`/admin/arboles/${a.codigo}`} className="font-mono font-bold text-musgo hover:underline">
                    {a.codigo}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <span className="font-semibold">{a.apodo ?? a.especie}</span>
                  {a.apodo && <span className="block text-xs text-tinta-suave">{a.especie}</span>}
                </td>
                <td className="px-4 py-2.5">{a.zona}</td>
                <td className="px-4 py-2.5">
                  <ChipEstado estado={a.estado_actual} />
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{a.observaciones}</td>
                <td className="px-4 py-2.5 text-tinta-suave">{a.ultima_observacion ? fecha.format(a.ultima_observacion) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
