/** Sello de goma con el código del árbol, como el de una ficha de herbario. */
export function Sello({ texto, className = "" }: { texto: string; className?: string }) {
  return (
    <span
      className={`animate-sello inline-block rounded-md border-2 border-dashed border-tabachin/70 px-2 py-0.5 font-mono text-xs font-bold tracking-widest text-tabachin/85 uppercase ${className}`}
      style={{ transform: "rotate(-6deg)" }}
    >
      {texto}
    </span>
  );
}
