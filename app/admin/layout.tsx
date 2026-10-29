import type { Metadata } from "next";
import { BarraLateral } from "@/components/admin/BarraLateral";
import { requiereAdmin } from "@/lib/auth";
import { una } from "@/lib/db";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel Bosque CUCEI" }, robots: { index: false } };

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const admin = await requiereAdmin();
  const contadores = (await una<{ alertas: number; revisar: number; comentarios: number }>(
    `SELECT (SELECT count(*) FROM alertas WHERE estado_revision IN ('abierta','en_revision')) AS alertas,
            (SELECT count(*) FROM observaciones WHERE validada IS NULL AND estado_reportado <> 'bien') AS revisar,
            (SELECT count(*) FROM retroalimentacion WHERE NOT atendida) AS comentarios`,
  ))!;
  return (
    <div className="flex min-h-dvh flex-col bg-[#f3efe6] md:flex-row">
      <BarraLateral alias={admin.alias} contadores={contadores} />
      <div className="min-w-0 flex-1">
        <p className="bg-primavera/25 px-4 py-2 text-center text-xs font-semibold text-[#6b5300] md:hidden print:hidden">
          El panel está pensado para tablet o computadora. En teléfono puedes usarlo, pero se ve mejor en pantalla grande.
        </p>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
