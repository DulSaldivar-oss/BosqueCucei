/** Íconos de trazo (24×24) dibujados para Bosque CUCEI. */

const RUTAS = {
  inicio: "M4 11.5 12 4l8 7.5M6 10v9.5h4.5V15h3v4.5H18V10",
  mapa: "M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Zm0 0v14m6-12v14",
  escanear: "M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8m8 0h2.5A1.5 1.5 0 0 1 20 5.5V8m0 8v2.5a1.5 1.5 0 0 1-1.5 1.5H16m-8 0H5.5A1.5 1.5 0 0 1 4 18.5V16M4 12h16",
  jardin: "M12 20v-6m0 0c-3.5 0-6-2.5-6-6 3.5 0 6 2.5 6 6Zm0 0c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6ZM5 20h14",
  misiones: "M5 4v16M5 5h10.5l-1.8 3.5L15.5 12H5",
  perfil: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.6-3.4 3.4-5.5 7-5.5s6.4 2.1 7 5.5",
  herbario: "M5 4.5h10.5A2.5 2.5 0 0 1 18 7v13H7.5A2.5 2.5 0 0 1 5 17.5v-13Zm0 13A2.5 2.5 0 0 1 7.5 15H18M10 7.5c2 0 3.5 1.5 3.5 3.5-2 0-3.5-1.5-3.5-3.5Z",
  hoja: "M5 19C5 10 10 5 19 5c0 9-5 14-14 14Zm0 0 7-7",
  gota: "M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5Z",
  regadera: "M4 10h9.5v6.5A2.5 2.5 0 0 1 11 19H6.5A2.5 2.5 0 0 1 4 16.5V10Zm9.5 2 6-4.5M7 10V7.5a2 2 0 0 1 2-2h1M19.5 7.5 21 9",
  lupa: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm4.6-1.9L20 20",
  camara: "M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9ZM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  corazon: "M12 19s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 7.3a3.8 3.8 0 0 1 7 2.2C19 14.6 12 19 12 19Z",
  estrella: "m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 4Z",
  flechaIzq: "M15 5l-7 7 7 7",
  flechaDer: "M9 5l7 7-7 7",
  flechaArriba: "M12 19V5m-6 6 6-6 6 6",
  cerrar: "M6 6l12 12M18 6 6 18",
  check: "M5 12.5 10 17.5 19 7",
  alerta: "M12 4 3 19.5h18L12 4Zm0 6v4.5m0 2.5v.01",
  ubicacion: "M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  mira: "M12 4v3m0 10v3M4 12h3m10 0h3m-8 4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z",
  candado: "M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9h-13v-9Z",
  mas: "M12 5v14M5 12h14",
  salir: "M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 8l-4 4 4 4m-4-4h11",
  ajustes: "M4 7h10m4 0h2M4 17h4m4 0h8M14 5v4m-4 6v4",
  arbol: "M12 21v-6m-4.5 0h9a4.5 4.5 0 0 0 .8-8.9A5.5 5.5 0 0 0 7 8a4 4 0 0 0 .5 7Z",
  usuarios: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9c.5-3 3-5 6-5s5.5 2 6 5m1.5-9a3 3 0 1 0-1-5.8M21 19c-.3-2.3-1.7-4-3.8-4.6",
  grafica: "M4 20h16M7 16v-4m5 4V8m5 8v-6",
  qr: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h2.5v2.5H14V14Zm3.5 3.5H20V20h-2.5v-2.5ZM14 20h1m5-6v1M7 7h.01M17 7h.01M7 17h.01",
  subir: "M12 16V4m-5 5 5-5 5 5M5 20h14",
  lapiz: "M15.5 5.5 18.5 8.5M5 19l1-4 10-10a2.1 2.1 0 0 1 3 3L9 18l-4 1Z",
  basura: "M5 7h14M10 4h4M7 7l1 13h8l1-13",
  reloj: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-12v4l2.5 2.5",
  fuego: "M12 21c3.6 0 6-2.4 6-5.8 0-3.7-3-6-4-9.2-1.8 1.4-2.6 3.2-2.4 5.2C10.4 10.4 9.5 9 9.2 8 7.5 9.7 6 12.3 6 15.2 6 18.6 8.4 21 12 21Z",
  libro: "M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5v13c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5v-13ZM12 6v13",
  ojo: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  menu: "M4 7h16M4 12h16M4 17h16",
  descargar: "M12 4v12m-5-5 5 5 5-5M5 20h14",
  imprimir: "M7 9V4h10v5M7 17H5a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 5 9h14a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 19 17h-2M7 14h10v6H7v-6Z",
  info: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-8.5V16m0-7.5v.01",
  mensaje: "M5 5h14v10H9l-4 4V5Z",
  calendario: "M5 6h14v14H5V6Zm0 4h14M9 4v4m6-4v4",
  brillo: "M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5m7 7L18 18M6 18l2.5-2.5m7-7L18 6",
} as const;

export type NombreIcono = keyof typeof RUTAS;

export function Icono({
  nombre,
  className = "size-5",
  grosor = 1.8,
  titulo,
}: {
  nombre: NombreIcono;
  className?: string;
  grosor?: number;
  titulo?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={titulo ? undefined : true}
      role={titulo ? "img" : undefined}
    >
      {titulo && <title>{titulo}</title>}
      <path d={RUTAS[nombre]} />
    </svg>
  );
}
