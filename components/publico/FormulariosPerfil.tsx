"use client";

import { useActionState } from "react";
import { Campo, estiloEntrada } from "@/components/Campo";
import { actualizarPerfil, enviarRetroalimentacion, type EstadoPerfil } from "@/lib/acciones/perfil";

function Aviso({ estado }: { estado: EstadoPerfil }) {
  if (estado.ok) return <p className="animate-aparecer text-sm font-semibold text-musgo" role="status">{estado.ok}</p>;
  if (estado.error) return <p className="animate-aparecer text-sm font-semibold text-tabachin" role="alert">{estado.error}</p>;
  return null;
}

export function FormularioPerfil({ alias, carrera }: { alias: string; carrera: string | null }) {
  const [estado, accion, pendiente] = useActionState(actualizarPerfil, {});
  return (
    <form action={accion} className="space-y-3">
      <Campo etiqueta="Alias público">
        <input name="alias" defaultValue={alias} required className={estiloEntrada} />
      </Campo>
      <Campo etiqueta="Carrera o área">
        <input name="carrera_o_area" defaultValue={carrera ?? ""} className={estiloEntrada} />
      </Campo>
      <div className="flex items-center gap-3">
        <button disabled={pendiente} className="rounded-full bg-musgo px-5 py-2.5 text-sm font-bold text-papel active:scale-95 disabled:opacity-60">
          Guardar
        </button>
        <Aviso estado={estado} />
      </div>
    </form>
  );
}

export function FormularioRetro() {
  const [estado, accion, pendiente] = useActionState(enviarRetroalimentacion, {});
  return (
    <form action={accion} className="space-y-3">
      <input type="hidden" name="pagina" value="/perfil" />
      <textarea
        name="mensaje"
        rows={3}
        required
        placeholder="¿Algo no funcionó o fue confuso? Cuéntanos."
        className={`${estiloEntrada} resize-none`}
      />
      <div className="flex items-center gap-3">
        <button disabled={pendiente} className="rounded-full border border-musgo/30 px-5 py-2.5 text-sm font-bold text-musgo active:scale-95 disabled:opacity-60">
          Enviar
        </button>
        <Aviso estado={estado} />
      </div>
    </form>
  );
}
