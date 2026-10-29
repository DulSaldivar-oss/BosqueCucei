const base =
  "rounded-2xl border border-linea bg-tarjeta text-base text-tinta shadow-[inset_0_1px_2px_rgb(30_43_34/0.05)] outline-none transition placeholder:text-tinta-suave/60 focus:border-musgo focus:ring-4 focus:ring-musgo/15";

export const estiloEntrada = `${base} w-full px-4 py-3`;

/** Sin ancho fijo, para filtros y campos cortos en línea. */
export const estiloCompacto = `${base} px-4 py-2.5`;

export function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{etiqueta}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-tinta-suave">{ayuda}</span>}
    </label>
  );
}
