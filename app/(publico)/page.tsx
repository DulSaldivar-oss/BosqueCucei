import Link from "next/link";
import { AnillosNivel } from "@/components/AnillosNivel";
import { ArbolSprite } from "@/components/ArbolSprite";
import { Contador } from "@/components/Contador";
import { Icono } from "@/components/Icono";
import { EscenaBosque } from "@/components/publico/EscenaBosque";
import { TarjetaMision } from "@/components/publico/TarjetaMision";
import { usuarioActual, type Usuario } from "@/lib/auth";
import { guardianesDeLaSemana, herbario, jardinDe, resumenCampus } from "@/lib/consultas/publico";
import { etapaPorVisitas } from "@/lib/juego/crecimiento";
import { progresoNivel } from "@/lib/juego/niveles";
import { claveSemana, estadoRiego, inicioProximaSemana, semanaAnterior } from "@/lib/juego/semana";
import { progresoMisiones } from "@/lib/servicios/misiones";

export default async function Inicio({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const [usuario, { aviso }] = await Promise.all([usuarioActual(), searchParams]);
  return (
    <>
      {aviso === "sin-permiso" && (
        <p className="mb-4 rounded-2xl bg-tabachin/10 px-4 py-3 text-sm font-semibold text-tabachin">
          Esa sección es solo para el equipo de Sustentabilidad.
        </p>
      )}
      {usuario ? <InicioPersona usuario={usuario} /> : <InicioVisitante />}
    </>
  );
}

async function InicioVisitante() {
  const [resumen, especies, guardianes] = await Promise.all([resumenCampus(), herbario(null), guardianesDeLaSemana()]);
  const destacadas = ["primavera", "jacaranda", "fresno", "tabachin", "palma-washingtonia"]
    .map((slug) => especies.find((e) => e.slug === slug))
    .filter((e) => e !== undefined);
  const escena = (destacadas.length >= 3 ? destacadas : especies.slice(0, 5)).map((e, i) => ({
    slug: e.slug,
    sprite: e.sprite,
    etapa: i % 2 === 0 ? 6 : 5,
  }));

  return (
    <div className="space-y-10 sm:space-y-14">
      <EscenaBosque arboles={escena} className="min-h-[560px] lg:min-h-[600px]">
        <div className="relative z-20 mx-auto max-w-2xl px-5 pt-8 text-center sm:pt-14 escalonado">
          <p style={{ "--i": 0 } as React.CSSProperties} className="mx-auto inline-flex items-center gap-2 rounded-full bg-tarjeta/80 px-3 py-1 text-xs font-bold tracking-wide text-musgo uppercase backdrop-blur">
            <Icono nombre="hoja" className="size-3.5" grosor={2.2} /> CUCEI Sustentable
          </p>
          <h1
            style={{ "--i": 1 } as React.CSSProperties}
            className="font-display mt-4 text-[2.15rem] leading-[1.05] font-bold tracking-tight text-balance text-tinta min-[400px]:text-[2.5rem] sm:text-5xl lg:text-6xl"
          >
            Cada árbol del campus tiene una historia.
          </h1>
          <p style={{ "--i": 2 } as React.CSSProperties} className="mx-auto mt-4 max-w-md text-base text-pretty text-tinta-suave sm:text-lg">
            Escanea su placa, cuéntanos cómo lo ves y haz crecer tu propio bosque. Tus visitas ayudan a cuidarlo.
          </p>
          <div style={{ "--i": 3 } as React.CSSProperties} className="mt-6 flex flex-col items-center justify-center gap-3 min-[400px]:flex-row">
            <Link
              href="/escanear"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-musgo px-6 py-3.5 text-base font-bold text-papel shadow-flotante transition hover:bg-musgo-oscuro active:scale-95 min-[400px]:w-auto"
            >
              <Icono nombre="escanear" className="size-5" grosor={2.2} /> Escanear un árbol
            </Link>
            <Link
              href="/registro"
              className="inline-flex w-full items-center justify-center rounded-full bg-tarjeta/90 px-6 py-3.5 text-base font-bold text-musgo shadow-tarjeta backdrop-blur transition hover:bg-tarjeta active:scale-95 min-[400px]:w-auto"
            >
              Crear mi jardín
            </Link>
          </div>
          <Link
            style={{ "--i": 4 } as React.CSSProperties}
            href="/mapa"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-musgo underline decoration-musgo/30 underline-offset-4 hover:decoration-musgo"
          >
            Explorar el mapa sin cuenta <Icono nombre="flechaDer" className="size-4" />
          </Link>
        </div>
      </EscenaBosque>

      <section aria-label="El bosque en números" className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { valor: resumen.arboles, etiqueta: "árboles con placa", color: "text-musgo" },
          { valor: resumen.especies, etiqueta: "especies", color: "text-jacaranda" },
          { valor: resumen.observaciones, etiqueta: "observaciones", color: "text-tabachin" },
        ].map((d) => (
          <div key={d.etiqueta} className="rounded-3xl border border-linea bg-tarjeta px-2 py-4 text-center shadow-tarjeta sm:py-6">
            <Contador valor={d.valor} className={`font-display block text-3xl font-bold sm:text-5xl ${d.color}`} />
            <span className="mt-1 block text-xs font-semibold text-tinta-suave sm:text-sm">{d.etiqueta}</span>
          </div>
        ))}
      </section>

      <section aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="font-display text-2xl font-bold sm:text-3xl">
          Así funciona
        </h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3 sm:gap-4 escalonado">
          {[
            { icono: "qr" as const, titulo: "Escanea la placa", texto: "Cada árbol tiene un código QR. Ábrelo con tu cámara o desde aquí." },
            { icono: "ojo" as const, titulo: "Cuenta cómo lo ves", texto: "Tres toques y listo: menos de 30 segundos. No necesitas saber de árboles." },
            { icono: "regadera" as const, titulo: "Tu árbol crece", texto: "Cada visita semanal riega su gemelo en tu jardín y suma experiencia." },
          ].map((paso, i) => (
            <li
              key={paso.titulo}
              style={{ "--i": i } as React.CSSProperties}
              className="relative overflow-hidden rounded-3xl border border-linea bg-tarjeta p-5 shadow-tarjeta"
            >
              <span className="font-display absolute -top-3 -right-1 text-[5.5rem] leading-none font-bold text-papel-2" aria-hidden="true">
                {i + 1}
              </span>
              <span className="relative grid size-11 place-items-center rounded-2xl bg-musgo-claro text-musgo">
                <Icono nombre={paso.icono} className="size-6" />
              </span>
              <h3 className="relative mt-3 text-lg font-bold">{paso.titulo}</h3>
              <p className="relative mt-1 text-sm text-tinta-suave">{paso.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <ReglaDeOro />

      <section aria-labelledby="especies">
        <div className="flex items-end justify-between gap-4">
          <h2 id="especies" className="font-display text-2xl font-bold sm:text-3xl">
            Especies del campus
          </h2>
          <Link href="/herbario" className="shrink-0 text-sm font-bold text-musgo hover:underline">
            Ver herbario
          </Link>
        </div>
        <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
          {especies.slice(0, 12).map((e, i) => (
            <Link
              key={e.slug}
              href={`/especie/${e.slug}`}
              className="group w-36 shrink-0 snap-start rounded-3xl border border-linea bg-tarjeta p-3 shadow-tarjeta transition hover:-translate-y-1 active:scale-95 sm:w-44"
            >
              <ArbolSprite genoma={e.sprite} etapa={5} semilla={e.slug} vivo retraso={-i * 0.6} className="mx-auto aspect-[5/6] w-full" />
              <p className="mt-1 truncate font-bold">{e.nombre_comun}</p>
              <p className="truncate text-xs text-tinta-suave italic">{e.nombre_cientifico}</p>
            </Link>
          ))}
        </div>
      </section>

      {guardianes.length > 0 && <GuardianesSemana guardianes={guardianes} />}
    </div>
  );
}

function ReglaDeOro() {
  const dias = ["L", "M", "M", "J", "V", "S", "D"];
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-musgo-oscuro p-6 text-papel sm:p-8">
      <div className="absolute -right-10 -bottom-16 size-56 rounded-full bg-musgo opacity-60" aria-hidden="true" />
      <div className="relative grid items-center gap-6 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-xs font-bold tracking-widest text-brote uppercase">La regla del jardín</p>
          <h2 className="font-display mt-2 text-2xl leading-tight font-bold sm:text-3xl">Un riego por árbol, cada semana.</h2>
          <p className="mt-3 max-w-prose text-sm text-papel/80 sm:text-base">
            Puedes observar un árbol todas las veces que quieras y cada reporte ayuda a cuidarlo. Pero solo la{" "}
            <strong className="text-brote">primera visita de la semana</strong> hace crecer tu árbol y suma experiencia.
            La semana empieza cada lunes.
          </p>
        </div>
        <div className="rounded-3xl bg-papel/10 p-4 backdrop-blur" aria-label="Ejemplo de una semana: solo el martes cuenta">
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {dias.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-papel/60">{d}</span>
                <span
                  className={`grid aspect-square w-full place-items-center rounded-xl ${
                    i === 1 ? "bg-agua text-white" : i === 3 ? "bg-papel/15 text-papel/50" : "bg-papel/5"
                  }`}
                >
                  {i === 1 && <Icono nombre="gota" className="size-4 animate-flotar" grosor={2.2} />}
                  {i === 3 && <Icono nombre="ojo" className="size-4" />}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-papel/70">
            <span className="font-bold text-agua">Martes:</span> cuenta y crece. <span className="font-bold text-papel/90">Jueves:</span> se
            registra, sin experiencia.
          </p>
        </div>
      </div>
    </section>
  );
}

function GuardianesSemana({ guardianes }: { guardianes: { alias: string; nivel: number; xp_semana: number; arboles: number }[] }) {
  return (
    <section aria-labelledby="guardianes-semana" className="rounded-[28px] border border-linea bg-tarjeta p-5 shadow-tarjeta sm:p-6">
      <h2 id="guardianes-semana" className="font-display text-xl font-bold sm:text-2xl">
        Guardianes de la semana
      </h2>
      <p className="text-sm text-tinta-suave">Cuenta la constancia y la variedad de árboles, no los escaneos repetidos.</p>
      <ol className="mt-4 divide-y divide-linea">
        {guardianes.map((g, i) => (
          <li key={g.alias} className="flex items-center gap-3 py-2.5">
            <span className={`font-display w-6 text-center text-lg font-bold ${i === 0 ? "text-primavera" : "text-tinta-suave"}`}>{i + 1}</span>
            <span className="grid size-9 place-items-center rounded-full bg-musgo-claro text-sm font-bold text-musgo">
              {g.alias.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{g.alias}</span>
              <span className="text-xs text-tinta-suave">
                Nivel {g.nivel} · {g.arboles} {g.arboles === 1 ? "árbol" : "árboles"}
              </span>
            </span>
            <span className="text-sm font-bold text-musgo">+{g.xp_semana} XP</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

async function InicioPersona({ usuario }: { usuario: Usuario }) {
  const [jardin, misiones, guardianes, especies] = await Promise.all([
    jardinDe(usuario.id),
    progresoMisiones(usuario.id),
    guardianesDeLaSemana(),
    herbario(usuario.id),
  ]);
  const semana = claveSemana();
  const nivel = progresoNivel(usuario.xp);
  const regados = jardin.filter((a) => a.ultima_semana === semana).length;
  const pendientes = jardin
    .filter((a) => a.ultima_semana !== semana)
    .sort((a, b) => (a.guardian === b.guardian ? (a.ultima_semana ?? "").localeCompare(b.ultima_semana ?? "") : a.guardian ? -1 : 1));
  const dias = Math.max(1, Math.ceil((inicioProximaSemana().getTime() - Date.now()) / 86_400_000));
  const descubiertas = especies.filter((e) => e.descubierta).length;
  const rachaActiva =
    usuario.ultima_semana_activa === semana || usuario.ultima_semana_activa === semanaAnterior(semana) ? usuario.racha_semanas : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="animate-aparecer flex items-center gap-4 rounded-[28px] border border-linea bg-tarjeta p-5 shadow-tarjeta sm:gap-6 sm:p-6">
          <div className="sm:hidden">
            <AnillosNivel xp={usuario.xp} tamano={88} />
          </div>
          <div className="hidden sm:block">
            <AnillosNivel xp={usuario.xp} tamano={112} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-tinta-suave">Hola,</p>
            <h1 className="font-display truncate text-2xl leading-tight font-bold sm:text-3xl">{usuario.alias}</h1>
            <p className="text-sm font-semibold text-musgo">
              Nivel {nivel.nivel} · {nivel.titulo}
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-papel-2" role="progressbar" aria-valuenow={nivel.porcentaje} aria-valuemin={0} aria-valuemax={100} aria-label="Avance al siguiente nivel">
              <div className="brillo-barra h-full rounded-full bg-brote transition-[width] duration-1000" style={{ width: `${nivel.porcentaje}%` }} />
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tinta-suave">
              <span>Faltan {nivel.faltan} XP para el nivel {nivel.nivel + 1}</span>
              {rachaActiva >= 2 && (
                <span className="inline-flex items-center gap-1 font-bold text-tabachin">
                  <Icono nombre="fuego" className="size-3.5" grosor={2} /> {rachaActiva} semanas seguidas
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="animate-aparecer relative overflow-hidden rounded-[28px] bg-musgo-oscuro p-5 text-papel sm:p-6" style={{ animationDelay: "80ms" }}>
          <div className="absolute -top-10 -right-10 size-40 rounded-full bg-agua/25 blur-2xl" aria-hidden="true" />
          <p className="text-xs font-bold tracking-widest text-brote uppercase">Esta semana</p>
          <p className="font-display mt-1 text-4xl font-bold">
            {regados}
            <span className="text-xl text-papel/60"> / {jardin.length}</span>
          </p>
          <p className="text-sm text-papel/80">{jardin.length === 0 ? "Aún no tienes árboles. ¡Escanea el primero!" : "árboles regados en tu jardín"}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-papel/70">
            <Icono nombre="reloj" className="size-4" /> La semana se reinicia en {dias} {dias === 1 ? "día" : "días"}
          </div>
          <Link
            href="/escanear"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brote px-4 py-2.5 text-sm font-bold text-musgo-oscuro transition hover:brightness-105 active:scale-95"
          >
            <Icono nombre="escanear" className="size-4" grosor={2.2} /> Escanear árbol
          </Link>
        </div>
      </section>

      {pendientes.length > 0 && (
        <section aria-labelledby="por-regar">
          <div className="flex items-end justify-between">
            <h2 id="por-regar" className="font-display text-xl font-bold sm:text-2xl">
              Te están esperando
            </h2>
            <Link href="/jardin" className="text-sm font-bold text-musgo hover:underline">
              Mi jardín
            </Link>
          </div>
          <div className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
            {pendientes.slice(0, 10).map((a, i) => {
              const riego = estadoRiego(a.ultima_semana, semana);
              return (
                <Link
                  key={a.arbol_id}
                  href={`/arbol/${a.codigo}`}
                  className="relative w-32 shrink-0 snap-start rounded-3xl border border-linea bg-tarjeta p-3 shadow-tarjeta transition hover:-translate-y-1 active:scale-95"
                >
                  <span
                    className={`absolute top-2.5 right-2.5 z-10 grid size-7 place-items-center rounded-full ${riego === "sediento" ? "bg-tabachin/15 text-tabachin" : "bg-agua-claro text-agua"}`}
                    title={riego === "sediento" ? "Sediento" : "Listo para regar"}
                  >
                    <Icono nombre="gota" className="size-4 animate-flotar" grosor={2} />
                  </span>
                  <ArbolSprite
                    genoma={a.sprite}
                    etapa={etapaPorVisitas(a.numero_visitas)}
                    semilla={a.codigo}
                    vivo
                    retraso={-i * 0.7}
                    className={`mx-auto aspect-[5/6] w-full ${riego === "sediento" ? "saturate-50" : ""}`}
                  />
                  <p className="truncate text-sm font-bold">{a.apodo ?? a.especie_nombre}</p>
                  <p className="truncate text-xs text-tinta-suave">{a.zona}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border border-linea bg-tarjeta p-5 shadow-tarjeta sm:p-6">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-xl font-bold sm:text-2xl">Misiones</h2>
            <Link href="/misiones" className="text-sm font-bold text-musgo hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {misiones
              .filter((m) => !m.completada)
              .slice(0, 3)
              .map((m) => (
                <TarjetaMision key={m.mision.id} progreso={m} compacta />
              ))}
            {misiones.every((m) => m.completada) && <p className="text-sm text-tinta-suave">Completaste todas las misiones activas. ✦</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/herbario"
            className="group flex flex-col justify-between rounded-[28px] border border-linea bg-tarjeta p-5 shadow-tarjeta transition hover:-translate-y-1"
          >
            <Icono nombre="herbario" className="size-7 text-jacaranda" />
            <div>
              <p className="font-display text-3xl font-bold">
                {descubiertas}
                <span className="text-lg text-tinta-suave">/{especies.length}</span>
              </p>
              <p className="text-sm font-semibold text-tinta-suave">especies en tu herbario</p>
            </div>
          </Link>
          <Link
            href="/mapa"
            className="group flex flex-col justify-between rounded-[28px] border border-linea bg-tarjeta p-5 shadow-tarjeta transition hover:-translate-y-1"
          >
            <Icono nombre="mapa" className="size-7 text-agua" />
            <div>
              <p className="font-display text-xl leading-tight font-bold">Mapa del arbolado</p>
              <p className="text-sm font-semibold text-tinta-suave">encuentra árboles cerca</p>
            </div>
          </Link>
          {guardianes.length > 0 && (
            <div className="col-span-2">
              <GuardianesSemana guardianes={guardianes.slice(0, 3)} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
