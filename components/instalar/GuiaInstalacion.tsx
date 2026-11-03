"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Icono, type NombreIcono } from "@/components/Icono";
import { NOMBRE_NAVEGADOR, type Entorno } from "@/lib/instalacion";
import { useInstalacion } from "./useInstalacion";

type Telefono = "android" | "iphone";
type NavegadorGuia = "safari" | "chrome-ios" | "chrome" | "samsung" | "firefox";

interface Paso {
  icono: NombreIcono | "app";
  texto: React.ReactNode;
}

const B = ({ children }: { children: React.ReactNode }) => <strong className="font-bold text-tinta">{children}</strong>;

const ABRIR_APP: Paso = {
  icono: "app",
  texto: (
    <>
      Ábrela desde tu pantalla de inicio: el ícono de <B>Bosque CUCEI</B> abre directo, a pantalla completa.
    </>
  ),
};

const PASOS: Record<NavegadorGuia, Paso[]> = {
  safari: [
    {
      icono: "compartir",
      texto: (
        <>
          Toca <B>Compartir</B> en la barra de Safari (el cuadro con una flecha hacia arriba). En iOS 26 está dentro del botón <B>•••</B>.
        </>
      ),
    },
    {
      icono: "agregarInicio",
      texto: (
        <>
          Desliza hacia abajo y elige <B>Agregar a pantalla de inicio</B>.
        </>
      ),
    },
    {
      icono: "check",
      texto: (
        <>
          Si aparece <B>Abrir como app web</B>, déjalo activado. Toca <B>Agregar</B>.
        </>
      ),
    },
    ABRIR_APP,
  ],
  "chrome-ios": [
    {
      icono: "compartir",
      texto: (
        <>
          Toca <B>Compartir</B>: en Chrome está en la barra de direcciones, arriba a la derecha; en Firefox y Edge, dentro del menú.
        </>
      ),
    },
    {
      icono: "agregarInicio",
      texto: (
        <>
          Elige <B>Agregar a pantalla de inicio</B> y toca <B>Agregar</B>.
        </>
      ),
    },
    {
      icono: "info",
      texto: <>Si no aparece la opción (iOS anterior a 16.4), abre esta página en Safari y sigue los pasos de Safari.</>,
    },
    ABRIR_APP,
  ],
  chrome: [
    {
      icono: "puntos",
      texto: (
        <>
          Toca el menú <B>⋮</B>, arriba a la derecha.
        </>
      ),
    },
    {
      icono: "agregarInicio",
      texto: (
        <>
          Elige <B>Instalar app</B> o <B>Agregar a la pantalla principal</B>.
        </>
      ),
    },
    {
      icono: "check",
      texto: (
        <>
          Confirma con <B>Instalar</B>.
        </>
      ),
    },
    ABRIR_APP,
  ],
  samsung: [
    {
      icono: "menu",
      texto: (
        <>
          Toca el menú <B>≡</B>, abajo a la derecha. Si en la barra de direcciones ves el ícono de descarga, tócalo y salta al último paso.
        </>
      ),
    },
    {
      icono: "agregarInicio",
      texto: (
        <>
          Elige <B>Agregar página a</B> y luego <B>Pantalla de inicio</B>.
        </>
      ),
    },
    {
      icono: "check",
      texto: (
        <>
          Confirma con <B>Agregar</B>.
        </>
      ),
    },
    ABRIR_APP,
  ],
  firefox: [
    {
      icono: "puntos",
      texto: (
        <>
          Toca el menú <B>⋮</B>.
        </>
      ),
    },
    {
      icono: "agregarInicio",
      texto: (
        <>
          Elige <B>Agregar a pantalla de inicio</B> (en versiones recientes, <B>Instalar</B>).
        </>
      ),
    },
    {
      icono: "check",
      texto: (
        <>
          Confirma con <B>Agregar</B>.
        </>
      ),
    },
    ABRIR_APP,
  ],
};

const NAVEGADORES: Record<Telefono, { id: NavegadorGuia; etiqueta: string }[]> = {
  iphone: [
    { id: "safari", etiqueta: "Safari" },
    { id: "chrome-ios", etiqueta: "Chrome u otro" },
  ],
  android: [
    { id: "chrome", etiqueta: "Chrome" },
    { id: "samsung", etiqueta: "Samsung Internet" },
    { id: "firefox", etiqueta: "Firefox" },
  ],
};

function guiaInicial(entorno: Entorno | null): { telefono: Telefono; navegador: NavegadorGuia } {
  if (entorno?.plataforma === "ios") return { telefono: "iphone", navegador: entorno.navegador === "safari" ? "safari" : "chrome-ios" };
  if (entorno?.plataforma === "android") {
    const navegador = entorno.navegador === "samsung" ? "samsung" : entorno.navegador === "firefox" ? "firefox" : "chrome";
    return { telefono: "android", navegador };
  }
  return { telefono: "android", navegador: "chrome" };
}

function Segmentos<T extends string>({
  opciones,
  valor,
  alCambiar,
  etiqueta,
  chico = false,
}: {
  opciones: { id: T; etiqueta: string; icono?: NombreIcono }[];
  valor: T;
  alCambiar: (v: T) => void;
  etiqueta: string;
  chico?: boolean;
}) {
  return (
    <div role="tablist" aria-label={etiqueta} className={`flex gap-1 rounded-full bg-papel-2 p-1 ${chico ? "text-xs" : "text-sm"}`}>
      {opciones.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={valor === o.id}
          onClick={() => alCambiar(o.id)}
          className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full font-bold whitespace-nowrap transition ${chico ? "px-2.5 py-1.5" : "px-3 py-2"} ${
            valor === o.id ? "text-papel" : "text-tinta-suave hover:text-tinta"
          }`}
        >
          {valor === o.id && (
            <motion.span layoutId={`segmento-${etiqueta}`} className="absolute inset-0 rounded-full bg-musgo" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
          )}
          <span className="relative flex items-center gap-1.5">
            {o.icono && <Icono nombre={o.icono} className="size-4" />}
            {o.etiqueta}
          </span>
        </button>
      ))}
    </div>
  );
}

function ListaPasos({ pasos }: { pasos: Paso[] }) {
  const reducido = useReducedMotion();
  return (
    <ol className="space-y-2.5">
      {pasos.map((p, i) => (
        <motion.li
          key={i}
          initial={reducido ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex items-start gap-3 rounded-2xl bg-tarjeta p-3 text-sm leading-snug text-tinta-suave ring-1 ring-linea"
        >
          <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-musgo-claro text-musgo">
            {p.icono === "app" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/icono-192.png" alt="" className="size-10 rounded-xl" />
            ) : (
              <Icono nombre={p.icono} className="size-5" grosor={p.icono === "puntos" ? 3.2 : 2} />
            )}
            <span className="absolute -top-1.5 -left-1.5 grid size-5 place-items-center rounded-full bg-tinta text-[11px] font-black text-papel">{i + 1}</span>
          </span>
          <span className="pt-0.5">{p.texto}</span>
        </motion.li>
      ))}
    </ol>
  );
}

/**
 * Cómo instalar Bosque CUCEI: con un toque donde el navegador lo permite (Chrome, Edge, Samsung
 * Internet) y paso a paso en iPhone (Safari o Chrome) y en el resto de navegadores de Android.
 */
export function GuiaInstalacion({ qr, alContinuar, textoContinuar }: { qr?: string | null; alContinuar: () => void; textoContinuar: string }) {
  const { entorno, metodo, instalada, instalar } = useInstalacion();
  const inicial = guiaInicial(entorno);
  const [telefono, setTelefono] = useState<Telefono | null>(null);
  const [navegador, setNavegador] = useState<NavegadorGuia | null>(null);
  const [resultado, setResultado] = useState<"rechazada" | null>(null);
  const [copiado, setCopiado] = useState(false);
  const telefonoActual = telefono ?? inicial.telefono;
  const navegadorActual = navegador ?? (telefono ? NAVEGADORES[telefono][0].id : inicial.navegador);

  async function instalarAhora() {
    const r = await instalar();
    if (r === "rechazada") setResultado("rechazada");
  }

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  if (!entorno) return <div className="h-72 animate-pulse rounded-3xl bg-papel-2" aria-hidden="true" />;

  const pasosManuales = (
    <div className="space-y-3">
      <Segmentos
        etiqueta="Teléfono"
        valor={telefonoActual}
        alCambiar={(t) => {
          setTelefono(t);
          setNavegador(null);
        }}
        opciones={[
          { id: "android", etiqueta: "Android", icono: "telefono" },
          { id: "iphone", etiqueta: "iPhone", icono: "telefono" },
        ]}
      />
      <Segmentos
        chico
        etiqueta={`Navegador en ${telefonoActual === "iphone" ? "iPhone" : "Android"}`}
        valor={navegadorActual}
        alCambiar={setNavegador}
        opciones={NAVEGADORES[telefonoActual]}
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={navegadorActual} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <ListaPasos pasos={PASOS[navegadorActual]} />
        </motion.div>
      </AnimatePresence>
      {telefonoActual === "iphone" && (
        <p className="text-xs text-tinta-suave">En iPhone y iPad, Apple no permite instalar con un botón: siempre se agrega desde Compartir.</p>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-4 pr-9">
        <motion.span
          initial={{ rotate: -12, scale: 0.7 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 14 }}
          className="relative shrink-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icono-192.png" alt="" className="size-16 rounded-[20px] shadow-flotante" />
          <span className="absolute -right-1.5 -bottom-1.5 grid size-7 place-items-center rounded-full bg-brote text-tinta ring-4 ring-papel">
            <Icono nombre="descargar" className="size-4" grosor={2.4} />
          </span>
        </motion.span>
        <div>
          <h2 id="titulo-instalar" className="font-display text-2xl leading-tight font-bold sm:text-[1.7rem]">
            Lleva el bosque en tu teléfono
          </h2>
          <p className="mt-0.5 text-sm text-tinta-suave">Instala Bosque CUCEI como app. Es gratis y no necesitas tienda de apps.</p>
        </div>
      </header>

      <ul className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-tinta-suave">
        {[
          { i: "escanear" as const, t: "Abre directo al escáner" },
          { i: "telefono" as const, t: "Pantalla completa" },
          { i: "hoja" as const, t: "Casi no ocupa espacio" },
        ].map((b) => (
          <li key={b.t} className="flex flex-col items-center gap-1.5 rounded-2xl bg-papel-2/70 px-2 py-3">
            <Icono nombre={b.i} className="size-5 text-musgo" />
            {b.t}
          </li>
        ))}
      </ul>

      <AnimatePresence mode="wait" initial={false}>
        {instalada ? (
          <motion.div
            key="lista"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-musgo-claro p-5 text-center text-musgo-oscuro"
            role="status"
          >
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-musgo text-papel">
              <Icono nombre="check" className="size-6" grosor={2.6} />
            </span>
            <p className="font-display mt-3 text-xl font-bold">¡Listo, ya la tienes!</p>
            <p className="mt-1 text-sm">Búscala en tu pantalla de inicio como Bosque CUCEI.</p>
          </motion.div>
        ) : metodo === "abrir-en-navegador" ? (
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 rounded-3xl bg-primavera/15 p-4 text-sm">
            <p className="font-bold text-tinta">Estás en el navegador de {entorno.dentroDeApp}: desde ahí no se puede instalar.</p>
            <p className="text-tinta-suave">
              Toca el menú <B>•••</B> o <B>⋮</B> de arriba y elige{" "}
              <B>{entorno.plataforma === "ios" ? "Abrir en Safari" : "Abrir en el navegador"}</B>. Ahí vuelve a entrar y te mostraremos cómo instalarla.
            </p>
            <button
              type="button"
              onClick={copiarEnlace}
              className="inline-flex items-center gap-2 rounded-full bg-tarjeta px-4 py-2 font-bold text-musgo ring-1 ring-linea active:scale-95"
            >
              <Icono nombre={copiado ? "check" : "copiar"} className="size-4" /> {copiado ? "Enlace copiado" : "Copiar el enlace"}
            </button>
          </motion.div>
        ) : (
          <motion.div key="pasos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {metodo === "boton" && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={instalarAhora}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-musgo px-6 py-4 text-base font-bold text-papel shadow-flotante transition hover:bg-musgo-oscuro active:scale-[.98]"
                >
                  <span className="brillo-barra absolute inset-0 opacity-30" aria-hidden="true" />
                  <Icono nombre="descargar" className="relative size-5" grosor={2.4} />
                  <span className="relative">Instalar con un toque</span>
                </button>
                <p className="text-center text-xs text-tinta-suave">
                  {NOMBRE_NAVEGADOR[entorno.navegador]} te pedirá confirmar. Tarda unos segundos.
                </p>
              </div>
            )}
            {resultado === "rechazada" && (
              <p className="rounded-2xl bg-papel-2 px-4 py-3 text-sm text-tinta-suave" role="status">
                No pasa nada: cuando quieras, la instalas desde tu perfil o con los pasos de abajo.
              </p>
            )}

            {entorno.plataforma === "escritorio" && qr && (
              <div className="flex items-center gap-4 rounded-3xl bg-papel-2/70 p-4">
                <div className="size-28 shrink-0 rounded-2xl bg-white p-2" dangerouslySetInnerHTML={{ __html: qr }} aria-label="Código QR de Bosque CUCEI" role="img" />
                <div className="text-sm text-tinta-suave">
                  <p className="font-bold text-tinta">Está pensada para tu celular</p>
                  <p className="mt-1">Escanea este código con la cámara de tu teléfono y sigue los pasos de abajo según tu teléfono.</p>
                  {entorno.navegador === "safari" && (
                    <p className="mt-1">
                      En esta Mac también puedes usar <B>Archivo → Agregar al Dock</B>.
                    </p>
                  )}
                </div>
              </div>
            )}

            {metodo === "boton" ? (
              <details className="group space-y-3">
                <summary className="cursor-pointer list-none text-center text-sm font-bold text-musgo [&::-webkit-details-marker]:hidden">
                  ¿Prefieres hacerlo a mano? <span className="inline-block transition group-open:rotate-180">⌄</span>
                </summary>
                {pasosManuales}
              </details>
            ) : (
              pasosManuales
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={alContinuar}
        className="flex w-full items-center justify-center gap-1.5 rounded-full px-6 py-3 text-sm font-bold text-tinta-suave ring-1 ring-linea transition hover:bg-papel-2 hover:text-tinta active:scale-[.98]"
      >
        {instalada ? "Continuar" : textoContinuar} <Icono nombre="flechaDer" className="size-4" />
      </button>
    </div>
  );
}
