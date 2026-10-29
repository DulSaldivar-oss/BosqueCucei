import { leerFoto } from "@/lib/fotos";

export async function GET(_: Request, { params }: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await params;
  const foto = await leerFoto(archivo);
  if (!foto) return new Response("No encontrada", { status: 404 });
  return new Response(new Uint8Array(foto.datos), {
    headers: {
      "Content-Type": foto.tipo,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
