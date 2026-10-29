import Link from "next/link";
import { ArbolSprite } from "@/components/ArbolSprite";

export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <ArbolSprite
        genoma={{ copa: "redonda", hojas: ["#3E6A3A", "#5C8C49", "#8AB463"], tronco: "#6B5444" }}
        etapa={1}
        semilla="404"
        className="mx-auto w-40 animate-flotar"
      />
      <h1 className="font-display mt-4 text-3xl font-bold">Aquí no ha crecido nada</h1>
      <p className="mt-2 text-tinta-suave">No encontramos esa página ni ese árbol. Revisa el código de la placa o vuelve al inicio.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/" className="rounded-full bg-musgo px-5 py-3 font-bold text-papel">
          Ir al inicio
        </Link>
        <Link href="/escanear" className="rounded-full border border-musgo/30 px-5 py-3 font-bold text-musgo">
          Escanear
        </Link>
      </div>
    </div>
  );
}
