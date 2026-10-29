"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Icono, type NombreIcono } from "@/components/Icono";
import { Logo } from "@/components/Logo";

const SECCIONES: { href: string; etiqueta: string; icono: NombreIcono; contador?: "alertas" | "revisar" | "comentarios" }[] = [
  { href: "/admin", etiqueta: "Resumen", icono: "grafica" },
  { href: "/admin/alertas", etiqueta: "Alertas", icono: "alerta", contador: "alertas" },
  { href: "/admin/observaciones", etiqueta: "Observaciones", icono: "ojo", contador: "revisar" },
  { href: "/admin/arboles", etiqueta: "Árboles", icono: "arbol" },
  { href: "/admin/especies", etiqueta: "Especies y sprites", icono: "hoja" },
  { href: "/admin/misiones", etiqueta: "Misiones", icono: "misiones" },
  { href: "/admin/usuarios", etiqueta: "Personas", icono: "usuarios" },
  { href: "/admin/comentarios", etiqueta: "Comentarios", icono: "mensaje", contador: "comentarios" },
  { href: "/admin/ajustes", etiqueta: "Reglas y ajustes", icono: "ajustes" },
];

export function BarraLateral({ alias, contadores }: { alias: string; contadores: Record<"alertas" | "revisar" | "comentarios", number> }) {
  const ruta = usePathname();
  const activo = (href: string) => (href === "/admin" ? ruta === "/admin" : ruta.startsWith(href));
  return (
    <aside className="sticky top-0 z-30 flex shrink-0 bg-musgo-oscuro text-papel max-md:overflow-x-auto md:h-dvh md:w-20 md:flex-col lg:w-64 print:hidden">
      <Link href="/admin" className="hidden items-center gap-3 px-5 py-6 md:flex md:justify-center md:px-0 lg:justify-start lg:px-6">
        <Logo className="size-10 shrink-0" />
        <span className="hidden leading-tight lg:block">
          <span className="font-display block text-lg font-bold">Bosque CUCEI</span>
          <span className="text-xs text-papel/60">Panel de Sustentabilidad</span>
        </span>
      </Link>
      <nav aria-label="Panel" className="flex gap-1 px-2 py-2 md:flex-1 md:flex-col md:px-3 md:py-0">
        {SECCIONES.map((s) => {
          const n = s.contador ? contadores[s.contador] : 0;
          const esActivo = activo(s.href);
          return (
            <Link
              key={s.href}
              href={s.href}
              title={s.etiqueta}
              aria-current={esActivo ? "page" : undefined}
              className={`relative isolate flex shrink-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition md:justify-center lg:justify-start ${
                esActivo ? "text-musgo-oscuro" : "text-papel/75 hover:bg-papel/10 hover:text-papel"
              }`}
            >
              {esActivo && (
                <motion.span layoutId="admin-activo" className="absolute inset-0 -z-10 rounded-2xl bg-brote" transition={{ type: "spring", stiffness: 420, damping: 36 }} />
              )}
              <Icono nombre={s.icono} className="relative size-5 shrink-0" />
              <span className="relative whitespace-nowrap md:sr-only lg:not-sr-only">{s.etiqueta}</span>
              {n > 0 && (
                <span
                  className={`relative ml-auto grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-black md:absolute md:top-1 md:right-1 lg:relative lg:top-auto lg:right-auto ${
                    s.contador === "alertas" ? "bg-tabachin text-white" : "bg-papel text-musgo-oscuro"
                  }`}
                >
                  {n}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="hidden space-y-1 border-t border-papel/10 p-3 md:block">
        <Link href="/" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-papel/70 hover:bg-papel/10 md:justify-center lg:justify-start" title="Ver sitio público">
          <Icono nombre="inicio" className="size-5 shrink-0" /> <span className="md:sr-only lg:not-sr-only">Ver sitio público</span>
        </Link>
        <p className="truncate px-3 pt-1 text-xs text-papel/50 md:text-center lg:text-left">{alias}</p>
      </div>
    </aside>
  );
}
