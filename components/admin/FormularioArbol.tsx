"use client";

import { useActionState, useState } from "react";
import { estiloEntrada } from "@/components/Campo";
import { Icono } from "@/components/Icono";
import { guardarArbol } from "@/lib/acciones/admin";
import { Aviso } from "./Formularios";
import { botonPrimario, botonSecundario } from "./Piezas";

interface Valores {
  id?: number;
  codigo: string;
  qr_id: string;
  especie_id: number | "";
  apodo: string | null;
  latitud: number | "";
  longitud: number | "";
  zona: string;
  fecha_registro: string;
  altura_m: number | null;
  diametro_cm: number | null;
  notas_publicas: string | null;
  activo: boolean;
}

export function FormularioArbol({
  valores,
  especies,
  zonas,
}: {
  valores: Valores;
  especies: { id: number; nombre_comun: string; nombre_cientifico: string }[];
  zonas: string[];
}) {
  const [estado, accion, pendiente] = useActionState(guardarArbol, {});
  const [coordenadas, setCoordenadas] = useState({ lat: String(valores.latitud), lng: String(valores.longitud) });
  const [ubicando, setUbicando] = useState(false);

  function usarUbicacion() {
    setUbicando(true);
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        setCoordenadas({ lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) });
        setUbicando(false);
      },
      () => setUbicando(false),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  const campo = (etiqueta: string, hijo: React.ReactNode, ayuda?: string) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{etiqueta}</span>
      {hijo}
      {ayuda && <span className="mt-1 block text-xs text-tinta-suave">{ayuda}</span>}
    </label>
  );

  return (
    <form action={accion} className="space-y-5">
      {valores.id && <input type="hidden" name="id" value={valores.id} />}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {campo("Código de la placa", <input name="codigo" required defaultValue={valores.codigo} placeholder="CUCEI-0072" className={`${estiloEntrada} font-mono uppercase`} />)}
        {campo(
          "Contenido del QR",
          <input name="qr_id" defaultValue={valores.qr_id} placeholder="Igual al código si se deja vacío" className={`${estiloEntrada} font-mono`} />,
          "Si las placas ya tienen un QR con otro texto o URL, cópialo aquí para que el escáner lo reconozca.",
        )}
        {campo(
          "Especie",
          <select name="especie_id" required defaultValue={valores.especie_id} className={estiloEntrada}>
            <option value="">Elige…</option>
            {especies.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre_comun} ({e.nombre_cientifico})
              </option>
            ))}
          </select>,
        )}
        {campo("Apodo (opcional)", <input name="apodo" defaultValue={valores.apodo ?? ""} placeholder="La abuela del Módulo O" className={estiloEntrada} />)}
        {campo(
          "Zona",
          <>
            <input name="zona" required list="zonas" defaultValue={valores.zona} className={estiloEntrada} />
            <datalist id="zonas">
              {zonas.map((z) => (
                <option key={z} value={z} />
              ))}
            </datalist>
          </>,
        )}
        {campo("Fecha de registro", <input name="fecha_registro" type="date" required defaultValue={valores.fecha_registro} className={estiloEntrada} />)}
      </div>

      <fieldset className="rounded-3xl bg-papel/70 p-4">
        <legend className="sr-only">Ubicación</legend>
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          {campo(
            "Latitud",
            <input name="latitud" required inputMode="decimal" value={coordenadas.lat} onChange={(e) => setCoordenadas((c) => ({ ...c, lat: e.target.value }))} className={estiloEntrada} />,
          )}
          {campo(
            "Longitud",
            <input name="longitud" required inputMode="decimal" value={coordenadas.lng} onChange={(e) => setCoordenadas((c) => ({ ...c, lng: e.target.value }))} className={estiloEntrada} />,
          )}
          <button type="button" onClick={usarUbicacion} className={`${botonSecundario} h-[50px]`} disabled={ubicando}>
            <Icono nombre="mira" className="size-4" /> {ubicando ? "Ubicando…" : "Usar mi ubicación"}
          </button>
        </div>
        <p className="mt-2 text-xs text-tinta-suave">Párate junto al árbol con la tablet o el teléfono para registrar su posición.</p>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campo("Altura aproximada (m)", <input name="altura_m" inputMode="decimal" defaultValue={valores.altura_m ?? ""} className={estiloEntrada} />)}
        {campo("Diámetro del tronco (cm)", <input name="diametro_cm" inputMode="decimal" defaultValue={valores.diametro_cm ?? ""} className={estiloEntrada} />)}
        {campo("Fotografía principal", <input name="foto" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-musgo-claro file:px-4 file:py-2.5 file:font-bold file:text-musgo-oscuro" />)}
      </div>
      {campo("Nota pública (opcional)", <textarea name="notas_publicas" rows={3} defaultValue={valores.notas_publicas ?? ""} placeholder="Algo que la comunidad deba saber de este ejemplar." className={`${estiloEntrada} resize-y`} />)}
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="activo" value="si" defaultChecked={valores.activo} className="size-4 accent-musgo" /> Activo (visible en la app)
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button className={botonPrimario} disabled={pendiente}>
          <Icono nombre="check" className="size-4" grosor={2.4} /> {valores.id ? "Guardar cambios" : "Crear árbol"}
        </button>
        <Aviso estado={estado} />
      </div>
    </form>
  );
}
