import "@fontsource-variable/fraunces/soft.css";
import "@fontsource-variable/manrope";
import "./globals.css";
import type { Metadata, Viewport } from "next";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" data-scroll-behavior="smooth">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
