import { InterruptorMision } from "@/components/admin/Formularios";
import { FormularioMision } from "@/components/admin/FormularioMision";
import { Encabezado, Tarjeta } from "@/components/admin/Piezas";
import { zonas } from "@/lib/consultas/admin";
import { consulta } from "@/lib/db";
import type { Mision } from "@/lib/servicios/misiones";

export const metadata = { title: "Misiones" };

export default async function Misiones() {
  const [misiones, listaZonas] = await Promise.all([
    consulta<Mision & { completadas: number }>(
      `SELECT m.*, (SELECT count(*) FROM misiones_completadas mc WHERE mc.mision_id = m.id) AS completadas
       FROM misiones m ORDER BY m.activa DESC, m.periodicidad DESC, m.id`,
    ),
    zonas(),
  ]);
  return (
    <>
      <Encabezado titulo="Misiones" descripcion="Retos temporales. Se recomienda premiar constancia y variedad, no cantidad de escaneos." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          {misiones.map((m) => (
            <details key={m.id} className="group rounded-3xl border border-linea bg-tarjeta shadow-tarjeta">
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {m.titulo} <span className="ml-1 rounded-full bg-brote/30 px-2 py-0.5 text-xs text-musgo-oscuro">+{m.recompensa_xp} XP</span>
                  </p>
                  <p className="text-sm text-tinta-suave">{m.descripcion}</p>
                  <p className="mt-1 text-xs text-tinta-suave">
                    {m.periodicidad === "semanal" ? "Semanal" : "Una vez"} · {m.inicia} → {m.termina} · completada {m.completadas} veces
                  </p>
                </div>
                <InterruptorMision id={m.id} activa={m.activa} />
              </summary>
              <div className="border-t border-linea p-4">
                <FormularioMision mision={m} zonas={listaZonas} />
              </div>
            </details>
          ))}
        </div>
        <Tarjeta titulo="Nueva misión" className="self-start">
          <FormularioMision zonas={listaZonas} />
        </Tarjeta>
      </div>
    </>
  );
}
