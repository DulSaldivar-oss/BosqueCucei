import type { Metadata } from "next";
import { Escaner } from "@/components/publico/Escaner";

export const metadata: Metadata = { title: "Escanear árbol" };

export default function Escanear() {
  return (
    <div className="space-y-5">
      <header className="mx-auto max-w-md text-center">
        <h1 className="font-display text-3xl font-bold">Escanea un árbol</h1>
        <p className="mt-1 text-tinta-suave">Busca la placa con código QR en el tronco o en la base del árbol.</p>
      </header>
      <Escaner />
    </div>
  );
}
