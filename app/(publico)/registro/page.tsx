import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormularioRegistro } from "@/components/publico/FormularioCuenta";
import { BienvenidaInstalar } from "@/components/instalar/BienvenidaInstalar";
import { EnlaceInstalar } from "@/components/instalar/EnlaceInstalar";
import { PanelCuenta } from "@/components/publico/PanelCuenta";
import { usuarioActual } from "@/lib/auth";
import { qrSvgPagina } from "@/lib/qr";
import { destinoSeguro } from "@/lib/seguridad";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function Registro({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  const siguiente = destinoSeguro((await searchParams).siguiente);
  if (await usuarioActual()) redirect("/");
  const qr = await qrSvgPagina("/entrar");
  return (
    <PanelCuenta titulo="Planta tu jardín" subtitulo="Con tu cuenta, cada árbol que visites crecerá contigo.">
      <FormularioRegistro siguiente={siguiente} />
      <EnlaceInstalar qr={qr} />
      {/* La primera vez en este dispositivo, antes de entrar, se ofrece instalar la app. */}
      <BienvenidaInstalar qr={qr} />
    </PanelCuenta>
  );
}
