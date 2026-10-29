import Link from "next/link";

/** Alterna entre Jardín y Herbario (comparten lugar en la barra inferior). */
export function SelectorJardin({ actual }: { actual: "jardin" | "herbario" }) {
  return (
    <nav aria-label="Colección" className="inline-flex rounded-full border border-linea bg-papel-2/70 p-1 text-sm font-bold">
      {(
        [
          ["jardin", "/jardin", "Mi jardín"],
          ["herbario", "/herbario", "Herbario"],
        ] as const
      ).map(([id, href, texto]) => (
        <Link
          key={id}
          href={href}
          aria-current={actual === id ? "page" : undefined}
          className={`rounded-full px-4 py-1.5 transition ${actual === id ? "bg-tarjeta text-musgo-oscuro shadow-tarjeta" : "text-tinta-suave hover:text-tinta"}`}
        >
          {texto}
        </Link>
      ))}
    </nav>
  );
}
