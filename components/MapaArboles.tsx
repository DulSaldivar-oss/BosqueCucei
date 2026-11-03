"use client";

import "leaflet/dist/leaflet.css";
import type * as L from "leaflet";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChipEstado } from "@/components/ChipEstado";
import { Icono } from "@/components/Icono";
import { distanciaMetros, fueraDeLugar } from "@/lib/geo";
import { ESTADOS_ARBOL, type EstadoArbol } from "@/lib/juego/catalogos";

export interface PuntoDelMapa {
  codigo: string;
  apodo: string | null;
  latitud: number;
  longitud: number;
  zona: string;
  estado: string;
  especie: string;
  slug: string;
  color: string;
  descubierto: boolean;
  regado: boolean;
}

type Filtro = "todos" | "atencion" | "jardin" | "pendientes";

const ATENCION = new Set(["pendiente", "posible_problema", "revision_requerida"]);

/**
 * El tamaño del marcador depende del zoom (variable --pin en el contenedor, ver globals.css):
 * con el inventario completo, a zoom de campus los pines grandes se taparían unos a otros.
 */
function htmlMarcador(p: PuntoDelMapa, seleccionado: boolean) {
  const estado = ESTADOS_ARBOL[p.estado as EstadoArbol] ?? ESTADOS_ARBOL.sin_datos;
  const pulso =
    p.estado === "revision_requerida" ? `<span class="marcador-pulso" style="border-color:${estado.color}"></span>` : "";
  const insignia = p.regado ? `<span class="marcador-regado"></span>` : "";
  return `<span class="marcador-arbol${seleccionado ? " elegido" : ""}">
    ${pulso}
    <span class="marcador-gota" style="background:${estado.color}"></span>
    <span class="marcador-centro" style="background:${p.color}"></span>
    ${insignia}
  </span>`;
}

function escalaPorZoom(zoom: number) {
  return zoom <= 16 ? "lejos" : zoom === 17 ? "medio" : zoom === 18 ? "cerca" : "detalle";
}

export function MapaArboles({
  puntos,
  conSesion = false,
  inicial,
  especie: especieInicial,
  className = "h-[60vh]",
  enlaceBase = "/arbol",
}: {
  puntos: PuntoDelMapa[];
  conSesion?: boolean;
  inicial?: string;
  /** Slug de especie para mostrar solo sus árboles. */
  especie?: string;
  className?: string;
  enlaceBase?: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);
  const leaflet = useRef<typeof L | null>(null);
  const marcadores = useRef(new Map<string, L.Marker>());
  const yoMarcador = useRef<L.CircleMarker | null>(null);
  const [listo, setListo] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [especie, setEspecie] = useState<string | null>(
    especieInicial && puntos.some((p) => p.slug === especieInicial) ? especieInicial : null,
  );
  const [elegido, setElegido] = useState<string | null>(inicial ?? null);
  const elegidoActual = useRef(elegido);
  const [yo, setYo] = useState<[number, number] | null>(null);
  const [errorUbicacion, setErrorUbicacion] = useState("");

  const visibles = useMemo(
    () =>
      puntos.filter(
        (p) =>
          (!especie || p.slug === especie) &&
          (filtro === "todos" ? true : filtro === "atencion" ? ATENCION.has(p.estado) : filtro === "jardin" ? p.descubierto : !p.descubierto),
      ),
    [puntos, filtro, especie],
  );
  const nombreEspecie = especie ? puntos.find((p) => p.slug === especie)?.especie : null;

  useEffect(() => {
    let cancelado = false;
    import("leaflet").then((modulo) => {
      if (cancelado || !contenedor.current || mapa.current) return;
      const Lf = modulo.default ?? modulo;
      leaflet.current = Lf;
      const m = Lf.map(contenedor.current, { zoomControl: false, attributionControl: true, maxZoom: 20 });
      Lf.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(m);
      Lf.control.zoom({ position: "bottomright" }).addTo(m);
      // Encuadre inicial: los árboles (de la especie, si hay filtro) sin los que tienen coordenadas fuera de lugar.
      const base = especie ? puntos.filter((p) => p.slug === especie) : puntos;
      const lejos = new Set(fueraDeLugar(base).map((p) => p.codigo));
      const limites = Lf.latLngBounds(base.filter((p) => !lejos.has(p.codigo)).map((p) => [p.latitud, p.longitud] as [number, number]));
      if (limites.isValid()) m.fitBounds(limites, { padding: [30, 30], maxZoom: 18 });
      else m.setView([20.6566, -103.3253], 17);
      const escalar = () => contenedor.current?.setAttribute("data-zoom", escalaPorZoom(m.getZoom()));
      m.on("zoomend", escalar);
      escalar();
      capa.current = Lf.layerGroup().addTo(m);
      mapa.current = m;
      setListo(true);
    });
    const registro = marcadores.current;
    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
      registro.clear();
    };
    // Los puntos iniciales solo sirven para encuadrar el mapa la primera vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Los marcadores se crean solo cuando cambia el filtro; elegir uno solo actualiza dos marcadores.
  useEffect(() => {
    const Lf = leaflet.current;
    const grupo = capa.current;
    if (!listo || !Lf || !grupo) return;
    grupo.clearLayers();
    marcadores.current.clear();
    const conTeclado = visibles.length <= 150;
    for (const p of visibles) {
      const seleccionado = p.codigo === elegidoActual.current;
      const marcador = Lf.marker([p.latitud, p.longitud], {
        icon: Lf.divIcon({ html: htmlMarcador(p, seleccionado), className: "", iconSize: [0, 0], iconAnchor: [0, 0] }),
        zIndexOffset: seleccionado ? 1000 : 0,
        keyboard: conTeclado,
        title: `${p.apodo ?? p.especie} ${p.codigo}`,
      })
        .on("click", () => setElegido(p.codigo))
        .addTo(grupo);
      marcadores.current.set(p.codigo, marcador);
    }
  }, [listo, visibles]);

  useEffect(() => {
    const anterior = elegidoActual.current;
    elegidoActual.current = elegido;
    for (const [codigo, activo] of [
      [anterior, false],
      [elegido, true],
    ] as const) {
      const marcador = codigo ? marcadores.current.get(codigo) : undefined;
      if (!marcador) continue;
      marcador.getElement()?.querySelector(".marcador-arbol")?.classList.toggle("elegido", activo);
      marcador.setZIndexOffset(activo ? 1000 : 0);
    }
  }, [elegido]);

  useEffect(() => {
    const Lf = leaflet.current;
    if (!listo || !Lf || !mapa.current) return;
    yoMarcador.current?.remove();
    yoMarcador.current = yo
      ? Lf.circleMarker(yo, { radius: 9, color: "#fff", weight: 3, fillColor: "#3B9AE1", fillOpacity: 1 }).addTo(mapa.current)
      : null;
  }, [listo, yo]);

  useEffect(() => {
    if (!listo || !inicial) return;
    const p = puntos.find((x) => x.codigo === inicial);
    if (p) mapa.current?.setView([p.latitud, p.longitud], 19);
  }, [listo, inicial, puntos]);

  function ubicarme() {
    setErrorUbicacion("");
    if (!navigator.geolocation) {
      setErrorUbicacion("Tu navegador no permite ubicarte.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const punto: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setYo(punto);
        mapa.current?.setView(punto, 18);
      },
      () => setErrorUbicacion("No pudimos obtener tu ubicación."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  const cercanos = yo
    ? [...visibles]
        .map((p) => ({ ...p, distancia: distanciaMetros(yo, [p.latitud, p.longitud]) }))
        .sort((a, b) => a.distancia - b.distancia)
        .slice(0, 3)
    : [];
  const seleccion = puntos.find((p) => p.codigo === elegido) ?? null;
  const filtros: [Filtro, string][] = [
    ["todos", `Todos · ${puntos.length}`],
    ["atencion", `Requieren atención · ${puntos.filter((p) => ATENCION.has(p.estado)).length}`],
  ];
  if (conSesion) filtros.push(["jardin", "Mi jardín"], ["pendientes", "Por descubrir"]);

  return (
    <div className="space-y-3">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
        {nombreEspecie && (
          <button
            type="button"
            onClick={() => setEspecie(null)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-musgo px-4 py-2 text-sm font-bold whitespace-nowrap text-papel transition active:scale-95"
            aria-label={`Quitar el filtro de especie ${nombreEspecie}`}
          >
            {nombreEspecie} · {visibles.length} <Icono nombre="cerrar" className="size-3.5" grosor={2.4} />
          </button>
        )}
        {filtros.map(([id, texto]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filtro === id}
            onClick={() => setFiltro(id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition active:scale-95 ${
              filtro === id ? "bg-tinta text-papel" : "border border-linea bg-tarjeta text-tinta-suave"
            }`}
          >
            {texto}
          </button>
        ))}
      </div>

      <div className={`relative isolate overflow-hidden rounded-[28px] border border-linea shadow-tarjeta ${className}`}>
        <div ref={contenedor} className="mapa-arboles absolute inset-0 z-0" aria-label="Mapa del campus con los árboles" role="application" />
        {!listo && <div className="absolute inset-0 z-10 animate-pulse bg-papel-2" aria-hidden="true" />}

        <button
          type="button"
          onClick={ubicarme}
          className="absolute top-3 right-3 z-[500] inline-flex items-center gap-1.5 rounded-full bg-tarjeta px-3.5 py-2 text-sm font-bold text-agua shadow-flotante transition active:scale-95"
        >
          <Icono nombre="mira" className="size-4" grosor={2.2} /> Cerca de mí
        </button>

        <details className="group absolute top-3 left-3 z-[500] rounded-2xl bg-tarjeta/95 text-xs shadow-flotante backdrop-blur">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 font-bold">
            <Icono nombre="info" className="size-4" /> Semáforo
          </summary>
          <ul className="space-y-1.5 px-3 pb-3">
            {Object.entries(ESTADOS_ARBOL).map(([clave, e]) => (
              <li key={clave} className="flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ backgroundColor: e.color }} /> {e.etiqueta}
              </li>
            ))}
            <li className="flex items-center gap-2 border-t border-linea pt-1.5">
              <span className="size-3 rounded-full border-2 border-white bg-agua" /> Regado por ti esta semana
            </li>
          </ul>
        </details>

        <AnimatePresence>
          {seleccion && (
            <motion.div
              key={seleccion.codigo}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="absolute inset-x-3 bottom-3 z-[600] mx-auto max-w-md rounded-3xl bg-tarjeta p-4 shadow-flotante"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 size-10 shrink-0 rounded-2xl" style={{ backgroundColor: seleccion.color }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-tinta-suave">{seleccion.codigo}</p>
                  <p className="truncate text-lg leading-tight font-bold">{seleccion.apodo ?? seleccion.especie}</p>
                  <p className="truncate text-sm text-tinta-suave">
                    {seleccion.especie} · {seleccion.zona}
                  </p>
                </div>
                <button type="button" onClick={() => setElegido(null)} aria-label="Cerrar" className="grid size-8 shrink-0 place-items-center rounded-full bg-papel-2">
                  <Icono nombre="cerrar" className="size-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <ChipEstado estado={seleccion.estado} />
                <Link href={`${enlaceBase}/${seleccion.codigo}`} className="inline-flex items-center gap-1 rounded-full bg-musgo px-4 py-2 text-sm font-bold text-papel active:scale-95">
                  Ver ficha <Icono nombre="flechaDer" className="size-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {errorUbicacion && <p className="text-sm font-semibold text-tabachin">{errorUbicacion}</p>}
      {cercanos.length > 0 && (
        <div className="rounded-3xl border border-linea bg-tarjeta p-4 shadow-tarjeta">
          <p className="text-sm font-bold">Más cercanos a ti</p>
          <ul className="mt-2 divide-y divide-linea">
            {cercanos.map((p) => (
              <li key={p.codigo}>
                <button type="button" onClick={() => setElegido(p.codigo)} className="flex w-full items-center gap-3 py-2 text-left">
                  <span className="size-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="min-w-0 flex-1 truncate font-semibold">{p.apodo ?? p.especie}</span>
                  <span className="text-sm text-tinta-suave tabular-nums">{p.distancia < 1000 ? `${Math.round(p.distancia)} m` : `${(p.distancia / 1000).toFixed(1)} km`}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
