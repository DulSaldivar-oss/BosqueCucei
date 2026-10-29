import { SelectorRol } from "@/components/admin/Formularios";
import { Encabezado, botonSecundario } from "@/components/admin/Piezas";
import { estiloCompacto } from "@/components/Campo";
import { requiereAdmin } from "@/lib/auth";
import { listarUsuarios } from "@/lib/consultas/admin";
import { TIPOS_USUARIO } from "@/lib/juego/catalogos";

export const metadata = { title: "Personas" };

const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" });

export default async function Usuarios({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q = "" }, admin] = await Promise.all([searchParams, requiereAdmin()]);
  const usuarios = await listarUsuarios(q.trim());
  return (
    <>
      <Encabezado titulo="Personas" descripcion="Participantes del piloto. Públicamente solo se muestra su alias y nivel." />
      <form className="mb-4 flex gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Buscar alias, nombre o correo" className={`${estiloCompacto} min-w-0 max-w-md flex-1`} />
        <button className={botonSecundario}>Buscar</button>
      </form>
      <div className="overflow-x-auto rounded-3xl border border-linea bg-tarjeta shadow-tarjeta">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-linea text-xs tracking-wide text-tinta-suave uppercase">
            <tr>
              <th className="px-4 py-3 font-bold">Persona</th>
              <th className="px-4 py-3 font-bold">Tipo</th>
              <th className="px-4 py-3 text-right font-bold">Nivel</th>
              <th className="px-4 py-3 text-right font-bold">Árboles</th>
              <th className="px-4 py-3 text-right font-bold">Obs.</th>
              <th className="px-4 py-3 font-bold">Última</th>
              <th className="px-4 py-3 font-bold">Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linea">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-papel/60">
                <td className="px-4 py-2.5">
                  <p className="font-bold">{u.alias}</p>
                  <p className="text-xs text-tinta-suave">
                    {u.nombre} · {u.correo}
                  </p>
                </td>
                <td className="px-4 py-2.5">
                  {TIPOS_USUARIO.find((t) => t.valor === u.tipo_usuario)?.etiqueta}
                  {u.carrera_o_area && <span className="block text-xs text-tinta-suave">{u.carrera_o_area}</span>}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="font-bold">{u.nivel}</span> <span className="text-xs text-tinta-suave">{u.xp} XP</span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{u.arboles}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{u.observaciones}</td>
                <td className="px-4 py-2.5 text-tinta-suave">{u.ultima ? fecha.format(u.ultima) : "—"}</td>
                <td className="px-4 py-2.5">
                  <SelectorRol id={u.id} rol={u.rol} propio={u.id === admin.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
