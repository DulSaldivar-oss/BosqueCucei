import { ESTADOS_ARBOL, type EstadoArbol } from "@/lib/juego/catalogos";

export function ChipEstado({ estado, compacto = false }: { estado: string; compacto?: boolean }) {
  const info = ESTADOS_ARBOL[estado as EstadoArbol] ?? ESTADOS_ARBOL.sin_datos;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: info.fondo, color: info.color }}
    >
      <span className="relative flex size-2">
        {estado === "revision_requerida" && (
          <span className="absolute inline-flex size-full animate-ping rounded-full opacity-60" style={{ backgroundColor: info.color }} />
        )}
        <span className="relative inline-flex size-2 rounded-full" style={{ backgroundColor: info.color }} />
      </span>
      {compacto ? info.corta : info.etiqueta}
    </span>
  );
}
