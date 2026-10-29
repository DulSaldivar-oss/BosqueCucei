"use client";

import { useActionState, useState } from "react";
import { estiloEntrada } from "@/components/Campo";
import { guardarMision } from "@/lib/acciones/admin";
import type { Mision } from "@/lib/servicios/misiones";
import { Aviso } from "./Formularios";
import { botonPrimario } from "./Piezas";

const TIPOS = [
  ["visitar_arboles", "Visitar árboles distintos"],
  ["descubrir_especies", "Descubrir especies nuevas"],
  ["constancia", "Mismo árbol varias semanas"],
  ["zona", "Árboles de una zona"],
  ["fotografo", "Observaciones con foto"],
];

export function FormularioMision({ mision, zonas }: { mision?: Mision; zonas: string[] }) {
  const [estado, accion, pendiente] = useActionState(guardarMision, {});
  const [tipo, setTipo] = useState(mision?.tipo ?? "visitar_arboles");
  const c = "mb-1 block text-sm font-bold";
  return (
    <form action={accion} className="space-y-3">
      {mision && <input type="hidden" name="id" value={mision.id} />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label>
          <span className={c}>Título</span>
          <input name="titulo" required defaultValue={mision?.titulo} className={estiloEntrada} />
        </label>
        <label>
          <span className={c}>Identificador</span>
          <input name="slug" required defaultValue={mision?.slug} placeholder="ruta-modulo-x" className={`${estiloEntrada} font-mono`} />
        </label>
      </div>
      <label className="block">
        <span className={c}>Descripción</span>
        <input name="descripcion" required defaultValue={mision?.descripcion} className={estiloEntrada} />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label>
          <span className={c}>Tipo</span>
          <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as Mision["tipo"])} className={estiloEntrada}>
            {TIPOS.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={c}>Meta</span>
          <input name="meta" type="number" min={1} required defaultValue={mision?.meta ?? 3} className={estiloEntrada} />
        </label>
        <label>
          <span className={c}>Recompensa (XP)</span>
          <input name="recompensa_xp" type="number" min={0} required defaultValue={mision?.recompensa_xp ?? 30} className={estiloEntrada} />
        </label>
      </div>
      {tipo === "zona" && (
        <label className="block">
          <span className={c}>Zona</span>
          <select name="zona" defaultValue={mision?.zona ?? ""} className={estiloEntrada}>
            {zonas.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
        </label>
      )}
      {tipo !== "zona" && <input type="hidden" name="zona" value="" />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <label>
          <span className={c}>Ícono</span>
          <select name="icono" defaultValue={mision?.icono ?? "hoja"} className={estiloEntrada}>
            {["regadera", "lupa", "corazon", "mapa", "camara", "hoja", "estrella"].map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={c}>Se repite</span>
          <select name="periodicidad" defaultValue={mision?.periodicidad ?? "semanal"} className={estiloEntrada}>
            <option value="semanal">Cada semana</option>
            <option value="unica">Una vez</option>
          </select>
        </label>
        <label>
          <span className={c}>Inicia</span>
          <input name="inicia" type="date" required defaultValue={mision?.inicia} className={estiloEntrada} />
        </label>
        <label>
          <span className={c}>Termina</span>
          <input name="termina" type="date" required defaultValue={mision?.termina} className={estiloEntrada} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button className={botonPrimario} disabled={pendiente}>
          {mision ? "Guardar" : "Crear misión"}
        </button>
        <Aviso estado={estado} />
      </div>
    </form>
  );
}
