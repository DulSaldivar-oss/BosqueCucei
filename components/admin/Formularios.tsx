"use client";

import { useActionState, useTransition } from "react";
import { estiloEntrada } from "@/components/Campo";
import { Icono } from "@/components/Icono";
import {
  actualizarAlerta,
  alternarMision,
  cambiarRol,
  marcarRetroalimentacion,
  validarObservacion,
  type EstadoAccion,
} from "@/lib/acciones/admin";
import { botonPrimario } from "./Piezas";

export function Aviso({ estado }: { estado: EstadoAccion }) {
  if (estado.ok) return <p role="status" className="animate-aparecer rounded-2xl bg-musgo-claro px-4 py-2.5 text-sm font-semibold text-musgo-oscuro">{estado.ok}</p>;
  if (estado.error) return <p role="alert" className="animate-aparecer rounded-2xl bg-tabachin/10 px-4 py-2.5 text-sm font-semibold text-tabachin">{estado.error}</p>;
  return null;
}

export function FormularioAlerta({
  alerta,
}: {
  alerta: { id: number; estado_revision: string; responsable: string | null; resolucion: string | null; util: boolean | null };
}) {
  const [estado, accion, pendiente] = useActionState(actualizarAlerta, {});
  return (
    <form action={accion} className="space-y-4">
      <input type="hidden" name="id" value={alerta.id} />
      <fieldset>
        <legend className="mb-2 text-sm font-bold">Estado de la revisión</legend>
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {[
            ["abierta", "Abierta"],
            ["en_revision", "En revisión"],
            ["resuelta", "Resuelta"],
            ["descartada", "Descartada"],
          ].map(([valor, texto]) => (
            <label key={valor} className="cursor-pointer">
              <input type="radio" name="estado_revision" value={valor} defaultChecked={alerta.estado_revision === valor} className="peer sr-only" />
              <span className="block rounded-2xl border border-linea bg-tarjeta px-3 py-2.5 text-center text-sm font-semibold transition peer-checked:border-musgo peer-checked:bg-musgo-claro peer-checked:text-musgo-oscuro peer-focus-visible:ring-4 peer-focus-visible:ring-agua/40">
                {texto}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">Responsable</span>
        <input name="responsable" defaultValue={alerta.responsable ?? ""} placeholder="Persona o cuadrilla asignada" className={estiloEntrada} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">Resolución / hallazgos</span>
        <textarea name="resolucion" rows={4} defaultValue={alerta.resolucion ?? ""} placeholder="Qué se encontró en la revisión física y qué se hizo." className={`${estiloEntrada} resize-y`} />
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-bold">¿La alerta resultó útil tras la revisión física?</legend>
        <div className="flex flex-wrap gap-2">
          {[
            ["", "Aún no se sabe"],
            ["si", "Sí, había algo"],
            ["no", "No, falsa alarma"],
          ].map(([valor, texto]) => (
            <label key={valor} className="cursor-pointer">
              <input
                type="radio"
                name="util"
                value={valor}
                defaultChecked={(alerta.util === null && valor === "") || (alerta.util === true && valor === "si") || (alerta.util === false && valor === "no")}
                className="peer sr-only"
              />
              <span className="block rounded-full border border-linea px-4 py-2 text-sm font-semibold peer-checked:border-musgo peer-checked:bg-musgo peer-checked:text-papel">{texto}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="inspeccion" value="si" className="size-4 accent-musgo" /> Registrar hoy como fecha de inspección del árbol
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button className={botonPrimario} disabled={pendiente}>
          <Icono nombre="check" className="size-4" grosor={2.4} /> Guardar revisión
        </button>
        <Aviso estado={estado} />
      </div>
    </form>
  );
}

export function BotonesValidacion({ id, validada }: { id: number; validada: boolean | null }) {
  const [pendiente, iniciar] = useTransition();
  const boton = (valor: boolean | null, icono: "check" | "cerrar", titulo: string, activo: string) => (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      aria-pressed={validada === valor}
      disabled={pendiente}
      onClick={() => iniciar(() => validarObservacion(id, validada === valor ? null : valor))}
      className={`grid size-9 place-items-center rounded-full border transition active:scale-90 disabled:opacity-50 ${validada === valor ? activo : "border-linea bg-tarjeta text-tinta-suave hover:border-tinta/30"}`}
    >
      <Icono nombre={icono} className="size-4" grosor={2.6} />
    </button>
  );
  return (
    <div className="flex gap-1.5">
      {boton(true, "check", "Válida (útil)", "border-musgo bg-musgo text-papel")}
      {boton(false, "cerrar", "No válida", "border-tabachin bg-tabachin text-white")}
    </div>
  );
}

export function InterruptorMision({ id, activa }: { id: number; activa: boolean }) {
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activa}
      aria-label="Misión activa"
      disabled={pendiente}
      onClick={() => iniciar(() => alternarMision(id))}
      className={`relative h-7 w-12 rounded-full transition ${activa ? "bg-musgo" : "bg-linea"}`}
    >
      <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${activa ? "left-6" : "left-1"}`} />
    </button>
  );
}

export function SelectorRol({ id, rol, propio }: { id: number; rol: string; propio: boolean }) {
  const [pendiente, iniciar] = useTransition();
  return (
    <select
      aria-label="Rol"
      defaultValue={rol}
      disabled={pendiente || propio}
      onChange={(e) => iniciar(() => cambiarRol(id, e.target.value as "usuario" | "admin"))}
      className="rounded-xl border border-linea bg-tarjeta px-2 py-1.5 text-sm disabled:opacity-60"
    >
      <option value="usuario">Participante</option>
      <option value="admin">Sustentabilidad</option>
    </select>
  );
}

export function BotonAtendida({ id, atendida }: { id: number; atendida: boolean }) {
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={pendiente}
      onClick={() => iniciar(() => marcarRetroalimentacion(id))}
      className={`rounded-full px-3 py-1.5 text-xs font-bold transition active:scale-95 ${atendida ? "bg-musgo-claro text-musgo-oscuro" : "border border-linea text-tinta-suave"}`}
    >
      {atendida ? "Atendido ✓" : "Marcar atendido"}
    </button>
  );
}
