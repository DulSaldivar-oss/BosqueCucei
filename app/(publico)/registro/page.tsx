import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormularioRegistro } from "@/components/publico/FormularioCuenta";
import { PanelCuenta } from "@/components/publico/PanelCuenta";
import { usuarioActual } from "@/lib/auth";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function Registro({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  const { siguiente = "/" } = await searchParams;
  if (await usuarioActual()) redirect("/");
  return (
    <PanelCuenta titulo="Planta tu jardín" subtitulo="Con tu cuenta, cada árbol que visites crecerá contigo.">
      <FormularioRegistro siguiente={siguiente} />
    </PanelCuenta>
  );
}
