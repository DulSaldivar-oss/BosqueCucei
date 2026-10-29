import type { Metadata } from "next";
import Link from "next/link";
import { AnillosNivel } from "@/components/AnillosNivel";
import { Icono, type NombreIcono } from "@/components/Icono";
import { FormularioPerfil, FormularioRetro } from "@/components/publico/FormulariosPerfil";
import { salir } from "@/lib/acciones/cuenta";
import { requiereUsuario } from "@/lib/auth";
import { estadisticasUsuario, eventosXp } from "@/lib/consultas/publico";
import { TIPOS_USUARIO } from "@/lib/juego/catalogos";
import { progresoNivel, xpParaNivel } from "@/lib/juego/niveles";

export const metadata: Metadata = { title: "Mi perfil" };

const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" });
const fechaLarga = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "America/Mexico_City" });

export default async function Perfil() {
  const usuario = await requiereUsuario("/perfil");
  const [stats, eventos] = await Promise.all([estadisticasUsuario(usuario.id), eventosXp(usuario.id)]);
  const nivel = progresoNivel(usuario.xp);
  const insignias: { nombre: string; detalle: string; icono: NombreIcono; logrado: boolean; color: string }[] = [
    { nombre: "Primera semilla", detalle: "Descubre tu primer árbol", icono: "jardin", logrado: stats.arboles >= 1, color: "#2D5A3D" },
    { nombre: "Botánica", detalle: "5 especies en tu herbario", icono: "herbario", logrado: stats.especies >= 5, color: "#8E6CC4" },
    { nombre: "Coleccionista", detalle: "15 especies en tu herbario", icono: "libro", logrado: stats.especies >= 15, color: "#8E6CC4" },
    { nombre: "Constancia", detalle: "Racha de 4 semanas", icono: "fuego", logrado: usuario.racha_semanas >= 4, color: "#E4572E" },
    { nombre: "Ojo de lince", detalle: "5 observaciones con foto", icono: "camara", logrado: stats.fotos >= 5, color: "#3B9AE1" },
    { nombre: "Bosque propio", detalle: "20 árboles descubiertos", icono: "arbol", logrado: stats.arboles >= 20, color: "#C9930F" },
  ];

  return (
    <div className="space-y-6">
      <section className="animate-aparecer relative overflow-hidden rounded-[32px] bg-musgo-oscuro p-6 text-papel sm:p-8">
        <div className="absolute -top-20 -right-20 size-72 rounded-full bg-musgo opacity-70" aria-hidden="true" />
        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <AnillosNivel xp={usuario.xp} tamano={120} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display truncate text-3xl font-bold sm:text-4xl">{usuario.alias}</h1>
            <p className="text-papel/75">
              {TIPOS_USUARIO.find((t) => t.valor === usuario.tipo_usuario)?.etiqueta}
              {usuario.carrera_o_area && ` · ${usuario.carrera_o_area}`}
            </p>
            <p className="mt-1 text-sm text-brote">
              Nivel {nivel.nivel} · {nivel.titulo} · desde {fechaLarga.format(usuario.fecha_alta)}
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-papel/15">
              <div className="brillo-barra h-full rounded-full bg-brote" style={{ width: `${nivel.porcentaje}%` }} />
            </div>
            <p className="mt-1 text-xs text-papel/70">
              {usuario.xp} XP · {xpParaNivel(nivel.nivel + 1) - usuario.xp} para el nivel {nivel.nivel + 1}
            </p>
          </div>
        </div>
      </section>

      <dl className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
        {[
          { t: "árboles", d: stats.arboles },
          { t: "especies", d: stats.especies },
          { t: "observaciones", d: stats.observaciones },
          { t: "con foto", d: stats.fotos },
          { t: "misiones", d: stats.misiones },
        ].map((x) => (
          <div key={x.t} className="rounded-3xl border border-linea bg-tarjeta px-2 py-3 text-center shadow-tarjeta">
            <dd className="font-display text-2xl font-bold">{x.d}</dd>
            <dt className="text-xs font-semibold text-tinta-suave">{x.t}</dt>
          </div>
        ))}
      </dl>

      <section aria-labelledby="insignias">
        <h2 id="insignias" className="font-display text-xl font-bold sm:text-2xl">
          Insignias
        </h2>
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
          {insignias.map((i, k) => (
            <li
              key={i.nombre}
              className={`flex flex-col items-center rounded-3xl border p-3 text-center ${i.logrado ? "animate-pop border-linea bg-tarjeta shadow-tarjeta" : "border-dashed border-linea bg-papel-2/40"}`}
              style={{ animationDelay: `${k * 70}ms` }}
            >
              <span
                className="grid size-12 place-items-center rounded-full"
                style={i.logrado ? { backgroundColor: `${i.color}22`, color: i.color } : { backgroundColor: "#e6dccb", color: "#b5a991" }}
              >
                <Icono nombre={i.logrado ? i.icono : "candado"} className="size-6" />
              </span>
              <span className={`mt-2 text-xs leading-tight font-bold ${i.logrado ? "" : "text-tinta-suave"}`}>{i.nombre}</span>
              <span className="mt-0.5 text-[10px] leading-tight text-tinta-suave">{i.detalle}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section aria-labelledby="historial" className="rounded-[28px] border border-linea bg-tarjeta p-5 shadow-tarjeta">
          <h2 id="historial" className="font-display text-xl font-bold">
            Experiencia reciente
          </h2>
          {eventos.length === 0 ? (
            <p className="mt-3 text-sm text-tinta-suave">Aún no ganas experiencia. ¡Escanea tu primer árbol!</p>
          ) : (
            <ul className="mt-3 divide-y divide-linea">
              {eventos.map((e, i) => (
                <li key={i} className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-14 shrink-0 text-xs text-tinta-suave">{fecha.format(e.creado_en)}</span>
                  <span className="min-w-0 flex-1 truncate">{e.detalle ?? e.motivo}</span>
                  <span className={`font-bold ${e.cantidad >= 0 ? "text-musgo" : "text-tabachin"}`}>
                    {e.cantidad >= 0 ? "+" : ""}
                    {e.cantidad}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="space-y-4">
          <section className="rounded-[28px] border border-linea bg-tarjeta p-5 shadow-tarjeta">
            <h2 className="font-display mb-3 text-xl font-bold">Tus datos</h2>
            <FormularioPerfil alias={usuario.alias} carrera={usuario.carrera_o_area} />
          </section>
          <section className="rounded-[28px] border border-linea bg-tarjeta p-5 shadow-tarjeta">
            <h2 className="font-display mb-1 text-xl font-bold">¿Algo falló?</h2>
            <p className="mb-3 text-sm text-tinta-suave">Estamos en piloto: tus comentarios mejoran la app.</p>
            <FormularioRetro />
          </section>
          <div className="flex flex-wrap gap-2">
            {usuario.rol === "admin" && (
              <Link href="/admin" className="inline-flex items-center gap-2 rounded-full bg-tinta px-5 py-3 text-sm font-bold text-papel active:scale-95">
                <Icono nombre="grafica" className="size-4" /> Panel de Sustentabilidad
              </Link>
            )}
            <form action={salir}>
              <button className="inline-flex items-center gap-2 rounded-full border border-linea bg-tarjeta px-5 py-3 text-sm font-bold text-tinta-suave active:scale-95">
                <Icono nombre="salir" className="size-4" /> Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
