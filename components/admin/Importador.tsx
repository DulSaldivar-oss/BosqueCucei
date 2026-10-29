"use client";

import { useActionState } from "react";
import { estiloEntrada } from "@/components/Campo";
import { Icono } from "@/components/Icono";
import { importarArboles, type ResultadoImportacion } from "@/lib/acciones/admin";
import { Aviso } from "./Formularios";
import { botonPrimario, botonSecundario } from "./Piezas";

const EJEMPLO = `codigo,qr_id,especie,latitud,longitud,zona,altura_m,diametro_cm,fecha_registro,apodo
CUCEI-0101,CUCEI-0101,jacaranda,20.65702,-103.32511,Módulo O,9.5,32,2024-03-12,
CUCEI-0102,https://qr.cucei.udg.mx/arbol/102,Fraxinus uhdei,20.65688,-103.32540,Explanada central,14,45,2024-03-12,El fresno de la fuente`;

export function Importador() {
  const [estado, accion, pendiente] = useActionState<ResultadoImportacion, FormData>(importarArboles, {});
  return (
    <div className="space-y-4">
      <form action={accion} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Archivo CSV</span>
          <input name="archivo" type="file" accept=".csv,text/csv" className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-musgo-claro file:px-4 file:py-2.5 file:font-bold file:text-musgo-oscuro" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">…o pega el contenido</span>
          <textarea name="csv" rows={8} defaultValue={estado.csv ?? ""} placeholder={EJEMPLO} className={`${estiloEntrada} font-mono text-xs`} />
        </label>
        <div className="flex flex-wrap gap-2">
          <button name="modo" value="vista" className={botonSecundario} disabled={pendiente}>
            <Icono nombre="ojo" className="size-4" /> Revisar
          </button>
          <button name="modo" value="importar" className={botonPrimario} disabled={pendiente || !estado.vista?.length || !!estado.errores?.length}>
            <Icono nombre="subir" className="size-4" /> Importar {estado.vista?.length ? `${estado.vista.length} árboles` : ""}
          </button>
        </div>
      </form>
      <Aviso estado={estado} />
      {estado.errores && estado.errores.length > 0 && (
        <div className="rounded-2xl bg-tabachin/10 p-4 text-sm">
          <p className="font-bold text-tabachin">
            {estado.errores.length} {estado.errores.length === 1 ? "fila con errores" : "filas con errores"}
          </p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5">
            {estado.errores.slice(0, 50).map((e) => (
              <li key={e.fila}>
                Fila {e.fila}: {e.mensaje}
              </li>
            ))}
          </ul>
        </div>
      )}
      {estado.vista && estado.vista.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-linea">
          <table className="w-full text-left text-sm">
            <thead className="bg-papel text-xs text-tinta-suave uppercase">
              <tr>
                <th className="px-3 py-2">Fila</th>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Especie</th>
                <th className="px-3 py-2">Zona</th>
                <th className="px-3 py-2">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linea">
              {estado.vista.slice(0, 200).map((v) => (
                <tr key={v.fila}>
                  <td className="px-3 py-1.5 text-tinta-suave">{v.fila}</td>
                  <td className="px-3 py-1.5 font-mono">{v.codigo}</td>
                  <td className="px-3 py-1.5">{v.especie}</td>
                  <td className="px-3 py-1.5">{v.zona}</td>
                  <td className="px-3 py-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${v.accion === "crear" ? "bg-musgo-claro text-musgo-oscuro" : "bg-agua-claro text-[#1d5d8c]"}`}>
                      {v.accion === "crear" ? "Nuevo" : "Actualizar"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
