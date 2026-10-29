import { ArbolSprite } from "@/components/ArbolSprite";
import { Logo } from "@/components/Logo";
import { BotonImprimir } from "@/components/admin/BotonImprimir";
import { Encabezado, botonSecundario } from "@/components/admin/Piezas";
import { estiloCompacto } from "@/components/Campo";
import { consulta } from "@/lib/db";
import { zonas } from "@/lib/consultas/admin";
import { qrSvg } from "@/lib/qr";
import type { GenomaSprite } from "@/lib/sprites/generar";

export const metadata = { title: "Imprimir QR" };

export default async function ImprimirQr({ searchParams }: { searchParams: Promise<{ zona?: string }> }) {
  const { zona = "" } = await searchParams;
  const [arboles, listaZonas] = await Promise.all([
    consulta<{ codigo: string; qr_id: string; apodo: string | null; nombre_comun: string; nombre_cientifico: string; sprite: GenomaSprite }>(
      `SELECT a.codigo, a.qr_id, a.apodo, e.nombre_comun, e.nombre_cientifico, e.sprite FROM arboles a JOIN especies e ON e.id = a.especie_id
       WHERE a.activo AND ($1 = '' OR a.zona = $1) ORDER BY a.codigo`,
      [zona],
    ),
    zonas(),
  ]);
  const etiquetas = await Promise.all(arboles.map(async (a) => ({ ...a, svg: await qrSvg(a.qr_id) })));
  return (
    <>
      <div className="print:hidden">
        <Encabezado titulo="Etiquetas QR" descripcion="Imprime en papel adhesivo resistente a la intemperie. Cada etiqueta mide 6 × 9 cm.">
          <BotonImprimir />
        </Encabezado>
        <form className="mb-6 flex gap-2">
          <select name="zona" defaultValue={zona} className={estiloCompacto} aria-label="Zona">
            <option value="">Todas las zonas ({listaZonas.length})</option>
            {listaZonas.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
          <button className={botonSecundario}>Filtrar</button>
        </form>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 print:grid-cols-3 print:gap-2">
        {etiquetas.map((a) => (
          <article key={a.codigo} className="flex break-inside-avoid flex-col items-center rounded-2xl border-2 border-musgo bg-white p-3 text-center print:h-[9cm] print:w-[6cm] print:rounded-lg">
            <div className="flex w-full items-center justify-between">
              <Logo className="size-6" />
              <span className="font-mono text-xs font-bold">{a.codigo}</span>
            </div>
            <div className="my-2 aspect-square w-full max-w-[4.5cm]" dangerouslySetInnerHTML={{ __html: a.svg }} />
            <div className="flex items-center gap-2">
              <ArbolSprite genoma={a.sprite} etapa={5} semilla={a.codigo} className="w-8" />
              <div className="text-left">
                <p className="text-sm leading-tight font-bold">{a.apodo ?? a.nombre_comun}</p>
                <p className="text-[10px] text-tinta-suave italic">{a.nombre_cientifico}</p>
              </div>
            </div>
            <p className="mt-1 text-[10px] font-semibold text-musgo">Escanéame y cuida este árbol · Bosque CUCEI</p>
          </article>
        ))}
      </div>
    </>
  );
}
