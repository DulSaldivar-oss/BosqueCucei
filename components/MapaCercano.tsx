"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icono } from "@/components/Icono";
import { MapaArboles, type PuntoDelMapa } from "@/components/MapaArboles";
import { distanciaMetros } from "@/lib/geo";
import type { FondoMapa } from "@/lib/mapa";

type Estado = "buscando" | "listo" | "sin-permiso" | "sin-gps";

/** Cada cuántos metros que camina la persona se vuelven a pedir los árboles cercanos. */
const PASO_M = 10;

const distanciaLegible = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);

function Aviso({ icono, titulo, children }: { icono: "mira" | "ubicacion" | "alerta"; titulo: string; children?: React.ReactNode }) {
  return (
    <div className="animate-aparecer rounded-2xl bg-tarjeta/95 p-4 text-sm shadow-flotante backdrop-blur" role="status">
      <p className="flex items-center gap-2 font-bold">
        <Icono nombre={icono} className="size-4 shrink-0 text-musgo" /> {titulo}
      </p>
      {children && <div className="mt-1 space-y-2 text-tinta-suave">{children}</div>}
    </div>
  );
}

/**
 * Mapa «cerca de mí»: sigue la ubicación de la persona y solo pide al servidor (y dibuja) los
 * árboles a `radio` metros. Vuelve a pedirlos cada PASO_M metros que camina.
 */
export function MapaCercano({ radio, conSesion, fondo, className }: { radio: number; conSesion: boolean; fondo: FondoMapa; className?: string }) {
  const [estado, setEstado] = useState<Estado>("buscando");
  const [ubicacion, setUbicacion] = useState<{ punto: [number, number]; precision: number } | null>(null);
  const [puntos, setPuntos] = useState<PuntoDelMapa[]>([]);
  const [masCercano, setMasCercano] = useState<{ codigo: string; distancia: number } | null>(null);
  const [cargando, setCargando] = useState(false);
  const ultimaConsulta = useRef<[number, number] | null>(null);
  const pendiente = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      const id = setTimeout(() => setEstado("sin-gps"), 0);
      return () => clearTimeout(id);
    }
    const reloj = navigator.geolocation.watchPosition(
      (pos) => {
        const punto: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUbicacion({ punto, precision: pos.coords.accuracy });
        setEstado("listo");
        if (ultimaConsulta.current && distanciaMetros(ultimaConsulta.current, punto) < PASO_M) return;
        ultimaConsulta.current = punto;
        pendiente.current?.abort();
        const control = new AbortController();
        pendiente.current = control;
        setCargando(true);
        fetch(`/api/arboles/cerca?lat=${punto[0]}&lng=${punto[1]}`, { signal: control.signal })
          .then((r) => r.json())
          .then((datos: { puntos: PuntoDelMapa[]; masCercano: { codigo: string; distancia: number } | null }) => {
            setPuntos(datos.puntos);
            setMasCercano(datos.masCercano);
            setCargando(false);
          })
          .catch(() => {
            if (!control.signal.aborted) {
              setCargando(false);
              ultimaConsulta.current = null;
            }
          });
      },
      (error) => setEstado(error.code === error.PERMISSION_DENIED ? "sin-permiso" : "sin-gps"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => {
      navigator.geolocation.clearWatch(reloj);
      pendiente.current?.abort();
    };
  }, []);

  const verTodo = (
    <Link href="/mapa?todos=1" className="inline-flex items-center gap-1 font-bold text-musgo hover:underline">
      Ver todo el campus <Icono nombre="flechaDer" className="size-4" />
    </Link>
  );

  let aviso: React.ReactNode = null;
  if (estado === "buscando") {
    aviso = (
      <Aviso icono="mira" titulo="Buscando tu ubicación…">
        <p>Te mostraremos los árboles a {radio} m de ti. Si el navegador lo pide, permite usar tu ubicación.</p>
      </Aviso>
    );
  } else if (estado === "sin-permiso" || estado === "sin-gps") {
    aviso = (
      <Aviso icono="alerta" titulo={estado === "sin-permiso" ? "Sin permiso para usar tu ubicación" : "No pudimos obtener tu ubicación"}>
        <p>
          {estado === "sin-permiso"
            ? "Actívalo en los ajustes del sitio de tu navegador (el candado junto a la dirección) y recarga la página."
            : "Revisa que el GPS esté encendido. La ubicación solo funciona en sitios con HTTPS."}
        </p>
        {verTodo}
      </Aviso>
    );
  } else if (!cargando && puntos.length === 0 && masCercano) {
    aviso =
      masCercano.distancia > 400 ? (
        <Aviso icono="ubicacion" titulo={`Estás a ${distanciaLegible(masCercano.distancia)} del árbol más cercano`}>
          <p>Este mapa muestra los árboles a {radio} m de ti. Acércate al campus o explora el mapa completo.</p>
          {verTodo}
        </Aviso>
      ) : (
        <Aviso icono="ubicacion" titulo={`No hay árboles a ${radio} m`}>
          <p>El más cercano está a {distanciaLegible(masCercano.distancia)}.</p>
          <Link href={`/mapa?arbol=${masCercano.codigo}`} className="inline-flex items-center gap-1 font-bold text-musgo hover:underline">
            Ver dónde está <Icono nombre="flechaDer" className="size-4" />
          </Link>
        </Aviso>
      );
  }

  return (
    <MapaArboles puntos={puntos} conSesion={conSesion} fondo={fondo} className={className} ubicacion={ubicacion} radio={radio} aviso={aviso} />
  );
}
