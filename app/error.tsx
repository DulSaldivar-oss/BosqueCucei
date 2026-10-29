"use client";

export default function ErrorGeneral({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-bold">Se cayó una rama</h1>
      <p className="mt-2 text-tinta-suave">Algo salió mal al cargar esta página. Intenta de nuevo en un momento.</p>
      <button onClick={reset} className="mt-6 rounded-full bg-musgo px-6 py-3 font-bold text-papel">
        Reintentar
      </button>
    </div>
  );
}
