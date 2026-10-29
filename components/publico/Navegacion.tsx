"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Icono, type NombreIcono } from "@/components/Icono";

const ENLACES: { href: string; etiqueta: string; icono: NombreIcono }[] = [
  { href: "/", etiqueta: "Inicio", icono: "inicio" },
  { href: "/mapa", etiqueta: "Mapa", icono: "mapa" },
  { href: "/jardin", etiqueta: "Jardín", icono: "jardin" },
  { href: "/herbario", etiqueta: "Herbario", icono: "herbario" },
  { href: "/misiones", etiqueta: "Misiones", icono: "misiones" },
];

function activo(ruta: string, href: string) {
  return href === "/" ? ruta === "/" : ruta.startsWith(href);
}

/** Enlaces horizontales para tablet y escritorio. */
export function NavegacionSuperior() {
  const ruta = usePathname();
  return (
    <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
      {ENLACES.map((e) => {
        const esActivo = activo(ruta, e.href);
        return (
          <Link
            key={e.href}
            href={e.href}
            aria-current={esActivo ? "page" : undefined}
            className="relative rounded-full px-3.5 py-2 text-sm font-semibold text-tinta-suave transition-colors hover:text-tinta lg:px-4"
          >
            {esActivo && (
              <motion.span
                layoutId="nav-superior"
                className="absolute inset-0 rounded-full bg-musgo-claro"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className={`relative ${esActivo ? "text-musgo-oscuro" : ""}`}>{e.etiqueta}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Barra inferior para teléfono con el botón de escanear al centro. */
export function NavegacionInferior() {
  const ruta = usePathname();
  const lados = [ENLACES[0], ENLACES[1], null, ENLACES[2], ENLACES[4]];
  if (ruta.includes("/observar")) return null;
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="mx-auto flex max-w-md items-end justify-between rounded-[26px] border border-linea/80 bg-tarjeta/92 px-2 pt-1.5 pb-1.5 shadow-flotante backdrop-blur-md">
        {lados.map((e) => {
          if (!e) {
            const esActivo = ruta.startsWith("/escanear");
            return (
              <Link
                key="escanear"
                href="/escanear"
                aria-label="Escanear árbol"
                aria-current={esActivo ? "page" : undefined}
                className="-mt-7 flex flex-col items-center gap-1"
              >
                <span className="grid size-[60px] animate-latido place-items-center rounded-full border-4 border-papel bg-musgo text-papel shadow-flotante transition-transform active:scale-90">
                  <Icono nombre="escanear" className="size-7" grosor={2} />
                </span>
                <span className="text-[11px] font-bold text-musgo">Escanear</span>
              </Link>
            );
          }
          const esActivo = activo(ruta, e.href) || (e.href === "/jardin" && ruta.startsWith("/herbario"));
          return (
            <Link
              key={e.href}
              href={e.href}
              aria-current={esActivo ? "page" : undefined}
              className="relative flex min-w-14 flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 transition-transform active:scale-90"
            >
              {esActivo && (
                <motion.span
                  layoutId="nav-inferior"
                  className="absolute inset-x-2 inset-y-0 rounded-2xl bg-musgo-claro"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <Icono
                nombre={e.icono}
                className={`relative size-6 ${esActivo ? "text-musgo-oscuro" : "text-tinta-suave"}`}
                grosor={esActivo ? 2.2 : 1.8}
              />
              <span className={`relative text-[11px] font-semibold ${esActivo ? "text-musgo-oscuro" : "text-tinta-suave"}`}>
                {e.etiqueta}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
