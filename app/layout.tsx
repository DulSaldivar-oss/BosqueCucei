import "@fontsource-variable/fraunces/soft.css";
import "@fontsource-variable/manrope";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { CLAVE_GUIA_VISTA } from "@/lib/instalacion";

export const metadata: Metadata = {
  title: { default: "Bosque CUCEI", template: "%s · Bosque CUCEI" },
  description: "Conoce, cuida y haz crecer el arbolado de CUCEI. Escanea un árbol, regístralo y cultiva tu jardín virtual.",
  applicationName: "Bosque CUCEI",
  appleWebApp: { capable: true, title: "Bosque CUCEI", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#2d5a3d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Se ejecuta antes que React: guarda el aviso de instalación del navegador (beforeinstallprompt), que
 * llega muy pronto, para que el botón «Instalar» lo use cuando aparezca. Mientras la guía no se haya
 * mostrado, se pospone el aviso propio del navegador para ofrecerlo dentro de la guía; después, el
 * navegador lo muestra a su manera. En producción también registra el service worker.
 */
const CAPTURA_INSTALACION = `(function () {
  var w = window, guiaVista = false;
  try { guiaVista = localStorage.getItem(${JSON.stringify(CLAVE_GUIA_VISTA)}) !== null; } catch (e) {}
  w.addEventListener("beforeinstallprompt", function (e) {
    if (!guiaVista) e.preventDefault();
    w.__avisoInstalar = e;
    w.dispatchEvent(new Event("bosque:instalable"));
  });
  w.addEventListener("appinstalled", function () {
    w.__avisoInstalar = null;
    w.dispatchEvent(new Event("bosque:instalada"));
  });
  if (${process.env.NODE_ENV === "production"} && "serviceWorker" in navigator) {
    w.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
  }
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" data-scroll-behavior="smooth">
      <body className="min-h-dvh">
        {children}
        <Script id="captura-instalacion" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: CAPTURA_INSTALACION }} />
      </body>
    </html>
  );
}
