"use client";

import { useActionState, useMemo, useState } from "react";
import { ArbolSprite } from "@/components/ArbolSprite";
import { estiloEntrada } from "@/components/Campo";
import { Icono } from "@/components/Icono";
import { guardarEspecie } from "@/lib/acciones/admin";
import { ETAPAS, type FormaCopa, type GenomaSprite } from "@/lib/sprites/generar";
import { Aviso } from "./Formularios";
import { botonPrimario, botonSecundario } from "./Piezas";

const COPAS: { valor: FormaCopa; etiqueta: string }[] = [
  { valor: "redonda", etiqueta: "Redonda" },
  { valor: "paraguas", etiqueta: "Sombrilla" },
  { valor: "abierta", etiqueta: "Abierta" },
  { valor: "columnar", etiqueta: "Columnar" },
  { valor: "conica", etiqueta: "Cónica" },
  { valor: "llorona", etiqueta: "Llorona" },
  { valor: "palmera", etiqueta: "Palmera" },
];

interface DatosEspecie {
  id: number;
  slug: string;
  nombre_comun: string;
  nombre_cientifico: string;
  familia: string;
  origen: string | null;
  descripcion: string;
  dato_curioso: string | null;
  sprite: GenomaSprite;
}

function SelectorColor({ etiqueta, valor, alCambiar }: { etiqueta: string; valor: string; alCambiar: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-2xl border border-linea bg-tarjeta px-2.5 py-2 text-sm">
      <input type="color" value={valor} onChange={(e) => alCambiar(e.target.value)} className="size-8 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
      <span className="min-w-0">
        <span className="block text-xs font-bold">{etiqueta}</span>
        <span className="font-mono text-[11px] text-tinta-suave uppercase">{valor}</span>
      </span>
    </label>
  );
}

function Deslizador({ etiqueta, valor, min, max, paso, alCambiar }: { etiqueta: string; valor: number; min: number; max: number; paso: number; alCambiar: (v: number) => void }) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between font-bold">
        {etiqueta} <span className="font-mono text-xs text-tinta-suave">{valor.toFixed(2)}</span>
      </span>
      <input type="range" min={min} max={max} step={paso} value={valor} onChange={(e) => alCambiar(Number(e.target.value))} className="mt-1 w-full accent-musgo" />
    </label>
  );
}

export function EditorEspecie({ especie }: { especie: DatosEspecie }) {
  const [estado, accion, pendiente] = useActionState(guardarEspecie, {});
  const [genoma, setGenoma] = useState<GenomaSprite>({ alto: 1, ancho: 1, densidadFlor: 0.6, ...especie.sprite });
  const [semilla, setSemilla] = useState(especie.slug);
  const [etapa, setEtapa] = useState(6);
  const [copiado, setCopiado] = useState(false);
  const json = useMemo(() => JSON.stringify(genoma), [genoma]);
  const cambiar = <K extends keyof GenomaSprite>(clave: K, valor: GenomaSprite[K]) => setGenoma((g) => ({ ...g, [clave]: valor }));

  return (
    <form action={accion} className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr]">
      <input type="hidden" name="id" value={especie.id} />
      <input type="hidden" name="sprite" value={json} />

      <div className="space-y-4">
        <section className="rounded-3xl border border-linea bg-gradient-to-b from-[#d6e7ee] via-[#eaf0dd] to-[#efe5cf] p-4">
          <div className="relative mx-auto aspect-[5/6] w-full max-w-xs">
            <ArbolSprite genoma={genoma} etapa={etapa} semilla={semilla} vivo className="absolute inset-0" encuadre="completo" />
          </div>
          <label className="mt-2 block text-sm">
            <span className="flex justify-between font-bold">
              Etapa <span>{ETAPAS[etapa].nombre}</span>
            </span>
            <input type="range" min={0} max={6} value={etapa} onChange={(e) => setEtapa(Number(e.target.value))} className="w-full accent-musgo" />
          </label>
        </section>
        <section className="rounded-3xl border border-linea bg-tarjeta p-4">
          <p className="mb-2 text-sm font-bold">Hoja de sprites</p>
          <div className="grid grid-cols-7 gap-1">
            {ETAPAS.map((e) => (
              <button key={e.n} type="button" onClick={() => setEtapa(e.n)} className={`rounded-xl p-1 transition ${etapa === e.n ? "bg-musgo-claro" : "hover:bg-papel-2"}`} title={e.nombre}>
                <ArbolSprite genoma={genoma} etapa={e.n} semilla={semilla} encuadre="completo" className="aspect-[5/6] w-full" />
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={botonSecundario} onClick={() => setSemilla(Math.random().toString(36).slice(2, 8))}>
              <Icono nombre="brillo" className="size-4" /> Otra variante
            </button>
            <button
              type="button"
              className={botonSecundario}
              onClick={async () => {
                await navigator.clipboard.writeText(JSON.stringify({ sprite: genoma }, null, 2));
                setCopiado(true);
                setTimeout(() => setCopiado(false), 1600);
              }}
            >
              <Icono nombre={copiado ? "check" : "descargar"} className="size-4" /> {copiado ? "Copiado" : "Copiar genoma (JSON)"}
            </button>
          </div>
          <p className="mt-2 text-xs text-tinta-suave">Cada árbol del campus usa su código como variante: dos jacarandas nunca se ven idénticas.</p>
        </section>
      </div>

      <div className="space-y-4">
        <section className="space-y-3 rounded-3xl border border-linea bg-tarjeta p-4">
          <p className="text-sm font-bold">Forma de la copa</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 xl:grid-cols-4">
            {COPAS.map((c) => (
              <button
                key={c.valor}
                type="button"
                aria-pressed={genoma.copa === c.valor}
                onClick={() => cambiar("copa", c.valor)}
                className={`rounded-2xl border p-1.5 text-center text-[11px] font-bold transition ${genoma.copa === c.valor ? "border-musgo bg-musgo-claro" : "border-linea hover:border-musgo/40"}`}
              >
                <ArbolSprite genoma={{ ...genoma, copa: c.valor }} etapa={5} semilla="forma" encuadre="completo" className="aspect-[5/6] w-full" />
                {c.etiqueta}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SelectorColor etiqueta="Hoja en sombra" valor={genoma.hojas[0]} alCambiar={(v) => cambiar("hojas", [v, genoma.hojas[1], genoma.hojas[2]])} />
            <SelectorColor etiqueta="Hoja media" valor={genoma.hojas[1]} alCambiar={(v) => cambiar("hojas", [genoma.hojas[0], v, genoma.hojas[2]])} />
            <SelectorColor etiqueta="Hoja con luz" valor={genoma.hojas[2]} alCambiar={(v) => cambiar("hojas", [genoma.hojas[0], genoma.hojas[1], v])} />
            <SelectorColor etiqueta="Corteza" valor={genoma.tronco} alCambiar={(v) => cambiar("tronco", v)} />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={!!genoma.flor} onChange={(e) => cambiar("flor", e.target.checked ? "#8E6CC4" : null)} className="size-4 accent-musgo" />
              Flores o frutos vistosos
            </label>
            {genoma.flor && <SelectorColor etiqueta="Flor" valor={genoma.flor} alCambiar={(v) => cambiar("flor", v)} />}
          </div>
          {genoma.flor && <Deslizador etiqueta="Densidad de floración" valor={genoma.densidadFlor ?? 0.6} min={0} max={1} paso={0.05} alCambiar={(v) => cambiar("densidadFlor", v)} />}
          <div className="grid grid-cols-2 gap-3">
            <Deslizador etiqueta="Altura" valor={genoma.alto ?? 1} min={0.6} max={1.4} paso={0.05} alCambiar={(v) => cambiar("alto", v)} />
            <Deslizador etiqueta="Ancho de copa" valor={genoma.ancho ?? 1} min={0.7} max={1.5} paso={0.05} alCambiar={(v) => cambiar("ancho", v)} />
          </div>
        </section>

        <section className="space-y-3 rounded-3xl border border-linea bg-tarjeta p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-bold">Nombre común</span>
              <input name="nombre_comun" defaultValue={especie.nombre_comun} className={estiloEntrada} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-bold">Nombre científico</span>
              <input name="nombre_cientifico" defaultValue={especie.nombre_cientifico} className={`${estiloEntrada} italic`} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-bold">Familia</span>
              <input name="familia" defaultValue={especie.familia} className={estiloEntrada} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-bold">Origen</span>
              <select name="origen" defaultValue={especie.origen ?? ""} className={estiloEntrada}>
                <option value="">Por confirmar</option>
                <option value="nativa">Nativa de México</option>
                <option value="introducida">Introducida</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-bold">Descripción</span>
            <textarea name="descripcion" rows={4} defaultValue={especie.descripcion} className={`${estiloEntrada} resize-y`} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-bold">Dato curioso</span>
            <textarea name="dato_curioso" rows={2} defaultValue={especie.dato_curioso ?? ""} className={`${estiloEntrada} resize-y`} />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button className={botonPrimario} disabled={pendiente}>
              <Icono nombre="check" className="size-4" grosor={2.4} /> Guardar especie
            </button>
            <Aviso estado={estado} />
          </div>
        </section>
      </div>
    </form>
  );
}
