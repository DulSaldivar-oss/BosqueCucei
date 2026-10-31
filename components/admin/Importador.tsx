"use client";

import { startTransition, useActionState } from "react";
import { estiloEntrada } from "@/components/Campo";
import { Icono } from "@/components/Icono";
import { importarArboles, type ResultadoImportacion } from "@/lib/acciones/admin";
import { Aviso } from "./Formularios";
import { botonPrimario, botonSecundario } from "./Piezas";

const EJEMPLO = `codigo,qr_id,especie,latitud,longitud,zona,altura_m,diametro_cm,fecha_registro,apodo
CUCEI-0101,CUCEI-0101,jacaranda,20.65702,-103.32511,Sector 4,9.5,32,2024-03-12,
CUCEI-0102,https://qr.cucei.udg.mx/arbol/102,Fraxinus uhdei,20.65688,-103.32540,Explanada central,14,45,2024-03-12,El fresno de la fuente`;

export function Importador() {
  const [estado, accion, pendiente] = useActionState<ResultadoImportacion, FormData>(importarArboles, {});
  // Con el inventario oficial también cuenta como cambio dar de baja árboles que ya no vienen.
  const hayCambios = !!estado.vista?.length || (estado.inventario?.resumen.bajas ?? 0) > 0;
  return (
    <div className="space-y-4">
      {/* Se envía a mano para que el formulario no se limpie: «Importar» vuelve a mandar el mismo archivo. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const datos = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
          startTransition(() => accion(datos));
        }}
        className="space-y-4"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Excel del inventario (.xlsx) o CSV</span>
          <input
            name="archivo"
            type="file"
            accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-musgo-claro file:px-4 file:py-2.5 file:font-bold file:text-musgo-oscuro"
          />
        </label>
        <details className="rounded-2xl border border-linea px-3 py-2 text-sm" open={!!estado.csv}>
          <summary className="cursor-pointer font-bold">…o pega un CSV</summary>
          <textarea name="csv" rows={8} defaultValue={estado.csv ?? ""} placeholder={EJEMPLO} className={`${estiloEntrada} mt-2 font-mono text-xs`} />
        </details>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="bajas" value="si" className="mt-0.5 size-4 accent-musgo" />
          <span>
            <span className="font-bold">Es el inventario completo:</span> dar de baja los árboles del inventario que ya no vengan en el archivo
            {estado.inventario && estado.inventario.resumen.bajas > 0 && (
              <span className="font-bold text-tabachin"> ({estado.inventario.resumen.bajas})</span>
            )}
            . Sus observaciones se conservan.
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          <button name="modo" value="vista" className={botonSecundario} disabled={pendiente}>
            <Icono nombre="ojo" className="size-4" /> Revisar
          </button>
          <button name="modo" value="importar" className={botonPrimario} disabled={pendiente || !hayCambios || !!estado.errores?.length}>
            <Icono nombre="subir" className="size-4" /> Importar {estado.vista?.length ? `${estado.vista.length} árboles` : ""}
          </button>
        </div>
      </form>
      <Aviso estado={estado} />
      {estado.inventario && <ResumenInventario inventario={estado.inventario} />}
      {estado.inventario && !hayCambios && (
        <p className="rounded-2xl bg-musgo-claro px-4 py-3 text-sm font-semibold text-musgo-oscuro">La base ya está al día con este archivo.</p>
      )}
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

function ResumenInventario({ inventario }: { inventario: NonNullable<ResultadoImportacion["inventario"]> }) {
  const { resumen, especiesNuevas, avisos } = inventario;
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {[
          ["En el archivo", resumen.total],
          ["Nuevos", resumen.crear],
          ["Con cambios", resumen.actualizar],
          ["Sin cambios", resumen.sinCambios],
        ].map(([t, n]) => (
          <div key={t} className="rounded-2xl border border-linea px-3 py-2">
            <dt className="text-xs font-semibold text-tinta-suave">{t}</dt>
            <dd className="font-display text-2xl font-bold">{n}</dd>
          </div>
        ))}
      </dl>
      {especiesNuevas.length > 0 && (
        <div className="rounded-2xl bg-primavera/15 p-4 text-sm">
          <p className="font-bold">
            {especiesNuevas.length} {especiesNuevas.length === 1 ? "especie nueva se agregará" : "especies nuevas se agregarán"} al catálogo con un sprite
            propuesto. Después revisa su nombre común y origen en Especies.
          </p>
          <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2">
            {especiesNuevas.map((e) => (
              <li key={e.nombre_cientifico}>
                <span className="font-semibold">{e.nombre_comun}</span> <span className="text-tinta-suave italic">{e.nombre_cientifico}</span> · {e.arboles}
              </li>
            ))}
          </ul>
        </div>
      )}
      {avisos.length > 0 && (
        <details className="rounded-2xl bg-papel-2/70 p-4 text-sm">
          <summary className="cursor-pointer font-bold">
            {avisos.length} {avisos.length === 1 ? "aviso" : "avisos"} (se importan igual)
          </summary>
          <ul className="mt-2 list-disc space-y-0.5 pl-5">
            {avisos.slice(0, 100).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
