import type { Metadata } from "next";
import Link from "next/link";
import { Icono } from "@/components/Icono";
import { TarjetaMision } from "@/components/publico/TarjetaMision";
import { usuarioActual } from "@/lib/auth";
import { consulta } from "@/lib/db";
import { misionesActivas, progresoMisiones, type ProgresoMision } from "@/lib/servicios/misiones";

export const metadata: Metadata = { title: "Misiones" };

const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" });

export default async function PaginaMisiones() {
  const usuario = await usuarioActual();
  const progreso: ProgresoMision[] = usuario
    ? await progresoMisiones(usuario.id)
    : (await misionesActivas()).map((m) => ({ mision: m, periodo: "", progreso: 0, completada: false, cierra: new Date(`${m.termina}T23:59:00-06:00`) }));
  const historial = usuario
    ? await consulta<{ titulo: string; recompensa_xp: number; completada_en: Date }>(
        `SELECT m.titulo, m.recompensa_xp, mc.completada_en FROM misiones_completadas mc JOIN misiones m ON m.id = mc.mision_id
         WHERE mc.usuario_id = $1 ORDER BY mc.completada_en DESC LIMIT 20`,
        [usuario.id],
      )
    : [];
  const semanales = progreso.filter((p) => p.mision.periodicidad === "semanal");
  const temporada = progreso.filter((p) => p.mision.periodicidad === "unica");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Misiones</h1>
        <p className="text-tinta-suave">Retos que premian la constancia y explorar el campus, no escanear muchas veces el mismo árbol.</p>
      </header>

      {!usuario && (
        <Link href="/registro?siguiente=/misiones" className="flex items-center justify-between gap-3 rounded-3xl bg-musgo-oscuro px-5 py-4 font-bold text-papel">
          Crea tu cuenta para avanzar en las misiones <Icono nombre="flechaDer" className="size-5" />
        </Link>
      )}

      {[
        { titulo: "Esta semana", lista: semanales, nota: "Se renuevan cada lunes." },
        { titulo: "De temporada", lista: temporada, nota: "Disponibles durante el semestre." },
      ].map(
        (grupo) =>
          grupo.lista.length > 0 && (
            <section key={grupo.titulo} aria-label={grupo.titulo}>
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl font-bold sm:text-2xl">{grupo.titulo}</h2>
                <p className="text-xs text-tinta-suave">{grupo.nota}</p>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 escalonado">
                {grupo.lista.map((p, i) => (
                  <div key={p.mision.id} style={{ "--i": i } as React.CSSProperties}>
                    <TarjetaMision progreso={p} />
                  </div>
                ))}
              </div>
            </section>
          ),
      )}

      {historial.length > 0 && (
        <section aria-labelledby="logros">
          <h2 id="logros" className="font-display text-xl font-bold sm:text-2xl">
            Completadas
          </h2>
          <ul className="mt-3 divide-y divide-linea rounded-3xl border border-linea bg-tarjeta px-4 shadow-tarjeta">
            {historial.map((h, i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <Icono nombre="estrella" className="size-5 text-primavera" grosor={2.2} />
                <span className="flex-1 font-semibold">{h.titulo}</span>
                <span className="text-xs text-tinta-suave">{fecha.format(h.completada_en)}</span>
                <span className="text-sm font-bold text-musgo">+{h.recompensa_xp}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
