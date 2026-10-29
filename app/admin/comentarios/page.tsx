import { BotonAtendida } from "@/components/admin/Formularios";
import { Encabezado } from "@/components/admin/Piezas";
import { listarRetroalimentacion } from "@/lib/consultas/admin";

export const metadata = { title: "Comentarios" };

const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });

export default async function Comentarios() {
  const lista = await listarRetroalimentacion();
  return (
    <>
      <Encabezado titulo="Comentarios sobre la app" descripcion="Problemas de interfaz y sugerencias que envía la comunidad desde su perfil." />
      {lista.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-linea p-10 text-center text-tinta-suave">Aún no hay comentarios.</p>
      ) : (
        <ul className="space-y-3">
          {lista.map((r) => (
            <li key={r.id} className={`rounded-3xl border border-linea bg-tarjeta p-4 shadow-tarjeta ${r.atendida ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-tinta-suave">
                  <span className="font-bold text-tinta">{r.alias ?? "Anónimo"}</span> · {fecha.format(r.fecha)}
                  {r.pagina && <> · {r.pagina}</>}
                </p>
                <BotonAtendida id={r.id} atendida={r.atendida} />
              </div>
              <p className="mt-2 whitespace-pre-line">{r.mensaje}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
