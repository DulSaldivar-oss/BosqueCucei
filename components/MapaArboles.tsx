"use client";

import "leaflet/dist/leaflet.css";
import type * as L from "leaflet";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChipEstado } from "@/components/ChipEstado";
import { Icono } from "@/components/Icono";
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

function distanciaMetros(a: [number, number], b: [number, number]) {
  const r = 6371000;
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad;
  const dLng = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

function htmlMarcador(p: PuntoDelMapa, seleccionado: boolean) {
  const estado = ESTADOS_ARBOL[p.estado as EstadoArbol] ?? ESTADOS_ARBOL.sin_datos;
  const tam = seleccionado ? 38 : 28;
  const pulso =
    p.estado === "revision_requerida"
      ? `<span style="position:absolute;inset:-6px;border-radius:999px;border:3px solid ${estado.color};animation:ping 1.6s cubic-bezier(0,0,.2,1) infinite"></span>`
      : "";
  const insignia = p.regado
    ? `<span style="position:absolute;right:-4px;top:-4px;width:14px;height:14px;border-radius:99px;background:#3B9AE1;border:2px solid #fff"></span>`
    : "";
  return `<span class="marcador-arbol" style="position:relative;display:block;width:${tam}px;height:${tam}px">
    ${pulso}
    <span style="position:absolute;inset:0;border-radius:999px 999px 999px 4px;transform:rotate(-45deg);background:${estado.color};box-shadow:0 6px 14px -6px rgba(30,43,34,.6)"></span>
    <span style="position:absolute;inset:${tam * 0.2}px;border-radius:999px;background:${p.color};border:2px solid #fffcf6;opacity:${p.descubierto || !insignia ? 1 : 0.95}"></span>
    ${insignia}
  </span>`;
}

export function MapaArboles({
  puntos,
  conSesion = false,
  inicial,
  className = "h-[60vh]",
  enlaceBase = "/arbol",
}: {
  puntos: PuntoDelMapa[];
  conSesion?: boolean;
  inicial?: string;
  className?: string;
  enlaceBase?: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);
  const leaflet = useRef<typeof L | null>(null);
  const [listo, setListo] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [elegido, setElegido] = useState<string | null>(inicial ?? null);
  const [yo, setYo] = useState<[number, number] | null>(null);
  const [errorUbicacion, setErrorUbicacion] = useState("");

  const visibles = useMemo(
    () =>
      puntos.filter((p) =>
        filtro === "todos" ? true : filtro === "atencion" ? ATENCION.has(p.estado) : filtro === "jardin" ? p.descubierto : !p.descubierto,
      ),
    [puntos, filtro],
  );

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
      const limites = Lf.latLngBounds(puntos.map((p) => [p.latitud, p.longitud] as [number, number]));
      if (limites.isValid()) m.fitBounds(limites, { padding: [30, 30], maxZoom: 18 });
      else m.setView([20.6566, -103.3253], 17);
      capa.current = Lf.layerGroup().addTo(m);
      mapa.current = m;
      setListo(true);
    });
    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
    };
    // Los puntos iniciales solo sirven para encuadrar el mapa la primera vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const Lf = leaflet.current;
    if (!listo || !Lf || !capa.current) return;
    capa.current.clearLayers();
    for (const p of visibles) {
      const seleccionado = p.codigo === elegido;
      const icono = Lf.divIcon({
        html: htmlMarcador(p, seleccionado),
        className: "",
        iconSize: [seleccionado ? 38 : 28, seleccionado ? 38 : 28],
        iconAnchor: [seleccionado ? 4 : 3, seleccionado ? 36 : 27],
      });
      Lf.marker([p.latitud, p.longitud], { icon: icono, zIndexOffset: seleccionado ? 1000 : 0, keyboard: true, title: `${p.apodo ?? p.especie} ${p.codigo}` })
        .on("click", () => setElegido(p.codigo))
        .addTo(capa.current);
    }
    if (yo) {
      Lf.circleMarker(yo, { radius: 9, color: "#fff", weight: 3, fillColor: "#3B9AE1", fillOpacity: 1 }).addTo(capa.current);
    }
  }, [listo, visibles, elegido, yo]);

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
        <div ref={contenedor} className="absolute inset-0 z-0" aria-label="Mapa del campus con los árboles" role="application" />
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
