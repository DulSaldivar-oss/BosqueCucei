import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormularioEntrar } from "@/components/publico/FormularioCuenta";
import { PanelCuenta } from "@/components/publico/PanelCuenta";
import { usuarioActual } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  const { siguiente = "/" } = await searchParams;
  if (await usuarioActual()) redirect(siguiente.startsWith("/") ? siguiente : "/");
  return (
    <PanelCuenta titulo="Qué gusto verte" subtitulo="Entra para seguir cuidando tu jardín.">
      <FormularioEntrar siguiente={siguiente} />
    </PanelCuenta>
  );
}
