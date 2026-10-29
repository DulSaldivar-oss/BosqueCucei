import Link from "next/link";
import { AnillosNivel } from "@/components/AnillosNivel";
import { Icono } from "@/components/Icono";
import { Logo } from "@/components/Logo";
import { NavegacionInferior, NavegacionSuperior } from "@/components/publico/Navegacion";
import { usuarioActual } from "@/lib/auth";

export default async function LayoutPublico({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioActual();
  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-50 rounded-lg bg-musgo px-3 py-2 text-papel focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 border-b border-linea/60 bg-papel/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Bosque CUCEI, inicio">
            <Logo className="size-8 sm:size-9" />
            <span className="font-display text-lg leading-none font-bold tracking-tight sm:text-xl">
              Bosque <span className="text-musgo">CUCEI</span>
            </span>
          </Link>
          <NavegacionSuperior />
          <div className="flex items-center gap-2">
            <Link
              href="/escanear"
              className="hidden items-center gap-2 rounded-full bg-musgo px-4 py-2 text-sm font-bold text-papel shadow-tarjeta transition hover:bg-musgo-oscuro active:scale-95 md:inline-flex"
            >
              <Icono nombre="escanear" className="size-4" grosor={2.2} /> Escanear
            </Link>
            {usuario ? (
              <Link
                href="/perfil"
                className="flex items-center gap-2 rounded-full py-1 pr-1 pl-3 transition hover:bg-papel-2"
                aria-label={`Tu perfil: ${usuario.alias}, nivel ${usuario.nivel}`}
              >
                <span className="hidden text-sm font-semibold lg:inline">{usuario.alias}</span>
                <AnillosNivel xp={usuario.xp} tamano={38} />
              </Link>
            ) : (
              <Link
                href="/entrar"
                className="rounded-full border border-musgo/30 px-4 py-2 text-sm font-bold text-musgo transition hover:bg-musgo-claro active:scale-95"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>
      <main id="contenido" className="mx-auto w-full max-w-6xl px-4 pt-4 pb-32 sm:px-6 sm:pt-6 md:pb-16">
        {children}
      </main>
      <NavegacionInferior />
    </>
  );
}
