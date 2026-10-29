"use client";

import { useActionState } from "react";
import { estiloCompacto } from "@/components/Campo";
import { guardarAjustes } from "@/lib/acciones/admin";
import { CATEGORIAS } from "@/lib/juego/catalogos";
import { Aviso } from "./Formularios";
import { botonPrimario } from "./Piezas";

const GRUPOS = [
  { titulo: "Regla de alertas", claves: ["alerta_ventana_dias", "alerta_min_usuarios", "alerta_min_anomalias", "dias_sin_datos"] },
  { titulo: "Experiencia", claves: ["xp_visita", "xp_descubrimiento", "xp_especie_nueva", "xp_foto", "xp_racha_por_semana", "xp_racha_max", "xp_validacion"] },
];

export function FormularioAjustes({ ajustes }: { ajustes: { clave: string; valor: unknown; descripcion: string }[] }) {
  const [estado, accion, pendiente] = useActionState(guardarAjustes, {});
  const porClave = Object.fromEntries(ajustes.map((a) => [a.clave, a]));
  const criticas = (porClave.categorias_criticas?.valor as string[]) ?? [];
  return (
    <form action={accion} className="space-y-6">
      {GRUPOS.map((g) => (
        <section key={g.titulo} className="rounded-3xl border border-linea bg-tarjeta p-5 shadow-tarjeta">
          <h2 className="font-display mb-4 text-lg font-bold">{g.titulo}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {g.claves
              .filter((c) => porClave[c])
              .map((c) => (
                <label key={c} className="flex items-start gap-3">
                  <input name={c} type="number" min={0} defaultValue={String(porClave[c].valor)} className={`${estiloCompacto} w-24 shrink-0 text-center font-bold`} />
                  <span className="text-sm">
                    <span className="block font-mono text-xs text-tinta-suave">{c}</span>
                    {porClave[c].descripcion}
                  </span>
                </label>
              ))}
          </div>
        </section>
      ))}
      <section className="rounded-3xl border border-linea bg-tarjeta p-5 shadow-tarjeta">
        <h2 className="font-display text-lg font-bold">Categorías críticas</h2>
        <p className="mb-3 text-sm text-tinta-suave">{porClave.categorias_criticas?.descripcion}</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map((c) => (
            <label key={c.valor} className="cursor-pointer">
              <input type="checkbox" name="categorias_criticas" value={c.valor} defaultChecked={criticas.includes(c.valor)} className="peer sr-only" />
              <span className="block rounded-full border border-linea px-3.5 py-2 text-sm font-semibold transition peer-checked:border-estado-revision peer-checked:bg-estado-revision peer-checked:text-white">
                {c.etiqueta}
              </span>
            </label>
          ))}
        </div>
        {/* Garantiza que el campo exista aunque no se marque ninguna. */}
        <input type="hidden" name="categorias_criticas" value="" />
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <button className={botonPrimario} disabled={pendiente}>
          Guardar ajustes
        </button>
        <Aviso estado={estado} />
      </div>
    </form>
  );
}
