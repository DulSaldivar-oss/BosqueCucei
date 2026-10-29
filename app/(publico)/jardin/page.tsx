import type { Metadata } from "next";
import Link from "next/link";
import { ArbolSprite } from "@/components/ArbolSprite";
import { Icono } from "@/components/Icono";
import { Jardin, type ArbolDelJardin } from "@/components/publico/Jardin";
import { SelectorJardin } from "@/components/publico/SelectorJardin";
import { requiereUsuario } from "@/lib/auth";
import { jardinDe } from "@/lib/consultas/publico";
import { etapaPorVisitas, nombreEtapa } from "@/lib/juego/crecimiento";
import { claveSemana, estadoRiego } from "@/lib/juego/semana";

export const metadata: Metadata = { title: "Mi jardín" };

const ORDEN_RIEGO = { sediento: 0, listo: 1, nuevo: 2, regado: 3 };

export default async function PaginaJardin() {
  const usuario = await requiereUsuario("/jardin");
  const filas = await jardinDe(usuario.id);
  const semana = claveSemana();
  const arboles: ArbolDelJardin[] = filas.map((f) => ({
    arbolId: f.arbol_id,
    codigo: f.codigo,
    nombre: f.apodo ?? f.especie_nombre,
    especie: f.especie_nombre,
    zona: f.zona,
    visitas: f.numero_visitas,
    riego: estadoRiego(f.ultima_semana, semana),
    guardian: f.guardian,
    sprite: f.sprite,
  }));
  const regados = arboles.filter((a) => a.riego === "regado").length;
  const especies = new Set(filas.map((f) => f.especie_slug)).size;
  const cuidados = arboles.filter((a) => a.guardian);
  const porAtender = [...arboles].sort((a, b) => ORDEN_RIEGO[a.riego] - ORDEN_RIEGO[b.riego]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Mi jardín</h1>
          <p className="text-tinta-suave">Cada árbol real que visitas tiene aquí su gemelo.</p>
        </div>
        <SelectorJardin actual="jardin" />
      </header>

      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { t: "árboles", d: arboles.length, c: "text-musgo" },
          { t: "especies", d: especies, c: "text-jacaranda" },
          { t: "regados esta semana", d: `${regados}/${arboles.length}`, c: "text-agua" },
        ].map((x) => (
          <div key={x.t} className="rounded-3xl border border-linea bg-tarjeta px-3 py-3 text-center shadow-tarjeta">
            <dd className={`font-display text-2xl font-bold sm:text-3xl ${x.c}`}>{x.d}</dd>
            <dt className="text-xs font-semibold text-tinta-suave">{x.t}</dt>
          </div>
        ))}
      </dl>

      {arboles.length === 0 ? (
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-[#d6e7ee] to-[#efe5cf] px-6 pt-10 pb-8 text-center">
          <div className="mx-auto w-40">
            <ArbolSprite
              genoma={{ copa: "redonda", hojas: ["#3E6A3A", "#5C8C49", "#8AB463"], tronco: "#6B5444" }}
              etapa={0}
              semilla="vacio"
              className="animate-flotar"
            />
          </div>
          <h2 className="font-display mt-2 text-2xl font-bold">Tu jardín está esperando su primera semilla</h2>
          <p className="mx-auto mt-2 max-w-sm text-tinta-suave">Escanea la placa de cualquier árbol del campus y registra cómo lo ves.</p>
          <Link href="/escanear" className="mt-5 inline-flex items-center gap-2 rounded-full bg-musgo px-6 py-3.5 font-bold text-papel shadow-flotante active:scale-95">
            <Icono nombre="escanear" className="size-5" grosor={2.2} /> Escanear mi primer árbol
          </Link>
        </section>
      ) : (
        <section aria-label="Parcela del jardín" className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-[#d6e7ee] via-[#e7efdc] to-[#f1e9d6] px-2 pt-4 pb-6 sm:px-6">
          <Jardin arboles={arboles} />
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold text-tinta-suave">
            <span className="inline-flex items-center gap-1">
              <span className="grid size-4 place-items-center rounded-full bg-agua text-white">
                <Icono nombre="check" className="size-3" grosor={3} />
              </span>
              Regado
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="grid size-4 place-items-center rounded-full border border-linea bg-tarjeta text-agua">
                <Icono nombre="gota" className="size-3" grosor={3} />
              </span>
              Listo para regar
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="grid size-4 place-items-center rounded-full bg-tabachin text-white">
                <Icono nombre="gota" className="size-3" grosor={3} />
              </span>
              Tiene sed
            </span>
          </p>
        </section>
      )}

      {cuidados.length > 0 && (
        <section aria-labelledby="cuido">
          <h2 id="cuido" className="font-display flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <Icono nombre="corazon" className="size-5 text-tabachin" grosor={2.2} /> Árboles que cuido
          </h2>
          <ListaArboles arboles={cuidados} />
        </section>
      )}

      {arboles.length > 0 && (
        <section aria-labelledby="todos">
          <h2 id="todos" className="font-display text-xl font-bold sm:text-2xl">
            Todos mis árboles
          </h2>
          <ListaArboles arboles={porAtender} />
        </section>
      )}
    </div>
  );
}

function ListaArboles({ arboles }: { arboles: ArbolDelJardin[] }) {
  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {arboles.map((a) => {
        const etapa = etapaPorVisitas(a.visitas);
        return (
          <li key={a.arbolId}>
            <Link
              href={`/arbol/${a.codigo}`}
              className="flex items-center gap-3 rounded-3xl border border-linea bg-tarjeta p-3 shadow-tarjeta transition hover:-translate-y-0.5 active:scale-[.98]"
            >
              <ArbolSprite genoma={a.sprite} etapa={etapa} semilla={a.codigo} className={`w-12 shrink-0 ${a.riego === "sediento" ? "saturate-[.4]" : ""}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{a.nombre}</span>
                <span className="block truncate text-xs text-tinta-suave">
                  {nombreEtapa(etapa)} · {a.visitas} {a.visitas === 1 ? "visita" : "visitas"} · {a.zona}
                </span>
              </span>
              <Icono
                nombre={a.riego === "regado" ? "check" : "gota"}
                className={`size-5 shrink-0 ${a.riego === "regado" ? "text-agua" : a.riego === "sediento" ? "text-tabachin" : "text-tinta-suave"}`}
                grosor={2.2}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
