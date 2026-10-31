import { NextResponse } from "next/server";
import { una } from "@/lib/db";

/** Estado del servicio para Docker, Caddy y el script de despliegue. */
export async function GET() {
  const cabeceras = { "Cache-Control": "no-store" };
  try {
    await una("SELECT 1");
    return NextResponse.json({ ok: true, base_de_datos: "ok" }, { headers: cabeceras });
  } catch {
    return NextResponse.json({ ok: false, base_de_datos: "sin conexión" }, { status: 503, headers: cabeceras });
  }
}
