import { ArbolSprite } from "@/components/ArbolSprite";
import especies from "@/data/especies.json";
import type { GenomaSprite } from "@/lib/sprites/generar";

/** Marco de las pantallas de entrar y registro: ilustración + tarjeta. */
export function PanelCuenta({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: React.ReactNode }) {
  const jacaranda = especies.especies.find((e) => e.slug === "jacaranda")!.sprite as unknown as GenomaSprite;
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-6 md:grid-cols-[1fr_1.1fr] md:gap-10">
      <div className="relative hidden aspect-[4/5] overflow-hidden rounded-[32px] bg-gradient-to-b from-[#d9e8ee] to-[#efe6d2] md:block">
        <ArbolSprite genoma={jacaranda} etapa={6} semilla="entrar" vivo className="absolute inset-x-6 bottom-6" />
        <p className="font-display absolute inset-x-8 top-8 text-3xl leading-tight font-bold text-musgo-oscuro">
          Tus visitas hacen crecer un bosque.
        </p>
      </div>
      <div className="animate-aparecer rounded-[28px] border border-linea bg-tarjeta p-5 shadow-tarjeta sm:p-8">
        <div className="mb-5 flex items-center gap-3 md:hidden">
          <ArbolSprite genoma={jacaranda} etapa={5} semilla="entrar" vivo className="w-16" />
          <p className="text-sm text-tinta-suave">Tus visitas hacen crecer un bosque.</p>
        </div>
        <h1 className="font-display text-3xl font-bold">{titulo}</h1>
        <p className="mt-1 mb-6 text-tinta-suave">{subtitulo}</p>
        {children}
      </div>
    </div>
  );
}
