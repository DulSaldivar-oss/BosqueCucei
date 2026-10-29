"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Campo, estiloEntrada } from "@/components/Campo";
import { Icono } from "@/components/Icono";
import { iniciarSesion, registrarse, type EstadoFormulario } from "@/lib/acciones/cuenta";
import { TIPOS_USUARIO } from "@/lib/juego/catalogos";

function BotonEnviar({ pendiente, children }: { pendiente: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pendiente}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-musgo px-6 py-3.5 text-base font-bold text-papel shadow-flotante transition hover:bg-musgo-oscuro active:scale-[.98] disabled:opacity-70"
    >
      {pendiente && <span className="size-4 animate-spin rounded-full border-2 border-papel/40 border-t-papel" aria-hidden="true" />}
      {children}
    </button>
  );
}

function Error({ estado }: { estado: EstadoFormulario }) {
  if (!estado.error) return null;
  return (
    <p role="alert" className="animate-aparecer flex items-start gap-2 rounded-2xl bg-tabachin/10 px-4 py-3 text-sm font-semibold text-tabachin">
      <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0" /> {estado.error}
    </p>
  );
}

function CampoContrasena({ autoComplete, defecto }: { autoComplete: string; defecto?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        name="contrasena"
        type={visible ? "text" : "password"}
        required
        minLength={8}
        autoComplete={autoComplete}
        defaultValue={defecto}
        className={`${estiloEntrada} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-1 my-1 grid w-10 place-items-center rounded-xl text-tinta-suave hover:bg-papel-2"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        <Icono nombre="ojo" className="size-5" />
      </button>
    </div>
  );
}

export function FormularioEntrar({ siguiente }: { siguiente: string }) {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, {});
  return (
    <form action={accion} className="space-y-4">
      <input type="hidden" name="siguiente" value={siguiente} />
      <Error estado={estado} />
      <Campo etiqueta="Correo">
        <input name="correo" type="email" required autoComplete="email" inputMode="email" defaultValue={estado.campos?.correo} className={estiloEntrada} />
      </Campo>
      <Campo etiqueta="Contraseña">
        <CampoContrasena autoComplete="current-password" />
      </Campo>
      <BotonEnviar pendiente={pendiente}>Entrar</BotonEnviar>
      <p className="text-center text-sm text-tinta-suave">
        ¿Primera vez?{" "}
        <Link href={`/registro?siguiente=${encodeURIComponent(siguiente)}`} className="font-bold text-musgo underline-offset-4 hover:underline">
          Crea tu cuenta
        </Link>
      </p>
    </form>
  );
}

export function FormularioRegistro({ siguiente }: { siguiente: string }) {
  const [estado, accion, pendiente] = useActionState(registrarse, {});
  const c = estado.campos ?? {};
  return (
    <form action={accion} className="space-y-4">
      <input type="hidden" name="siguiente" value={siguiente} />
      <Error estado={estado} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre">
          <input name="nombre" required autoComplete="name" defaultValue={c.nombre} className={estiloEntrada} />
        </Campo>
        <Campo etiqueta="Alias público" ayuda="Es lo único que verán los demás.">
          <input name="alias" required autoComplete="username" defaultValue={c.alias} placeholder="p. ej. jacaranda_23" className={estiloEntrada} />
        </Campo>
      </div>
      <Campo etiqueta="Correo">
        <input name="correo" type="email" required autoComplete="email" inputMode="email" defaultValue={c.correo} className={estiloEntrada} />
      </Campo>
      <Campo etiqueta="Contraseña" ayuda="Mínimo 8 caracteres.">
        <CampoContrasena autoComplete="new-password" />
      </Campo>
      <fieldset>
        <legend className="mb-1.5 text-sm font-bold">¿Cómo participas?</legend>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS_USUARIO.map((t) => (
            <label key={t.valor} className="relative cursor-pointer">
              <input type="radio" name="tipo_usuario" value={t.valor} required defaultChecked={c.tipo_usuario === t.valor} className="peer sr-only" />
              <span className="flex h-full items-center rounded-2xl border border-linea bg-tarjeta px-3 py-2.5 text-sm font-semibold transition peer-checked:border-musgo peer-checked:bg-musgo-claro peer-checked:text-musgo-oscuro peer-focus-visible:ring-4 peer-focus-visible:ring-agua/40">
                {t.etiqueta}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <Campo etiqueta="Carrera o área (opcional)">
        <input name="carrera_o_area" defaultValue={c.carrera_o_area} placeholder="p. ej. Ingeniería Química" className={estiloEntrada} />
      </Campo>
      <label className="flex items-start gap-3 rounded-2xl bg-papel-2/70 p-3 text-sm">
        <input type="checkbox" name="aviso" value="si" required defaultChecked={c.aviso === "si"} className="mt-0.5 size-5 accent-musgo" />
        <span className="text-tinta-suave">
          Acepto que mis observaciones y fotos se usen para el cuidado del arbolado. Públicamente solo se muestra mi alias y nivel.
        </span>
      </label>
      <BotonEnviar pendiente={pendiente}>Crear mi jardín</BotonEnviar>
      <p className="text-center text-sm text-tinta-suave">
        ¿Ya tienes cuenta?{" "}
        <Link href={`/entrar?siguiente=${encodeURIComponent(siguiente)}`} className="font-bold text-musgo underline-offset-4 hover:underline">
          Entra
        </Link>
      </p>
    </form>
  );
}
