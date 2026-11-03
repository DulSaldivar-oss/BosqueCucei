/**
 * Instalar Bosque CUCEI como app (PWA): qué teléfono y navegador usa la persona y cómo
 * puede instalarla ahí. Funciones puras para poder probarlas; el componente las usa en el cliente.
 */

export type Plataforma = "ios" | "android" | "escritorio";
export type Navegador = "safari" | "chrome" | "edge" | "samsung" | "firefox" | "opera" | "otro";

export interface Entorno {
  plataforma: Plataforma;
  navegador: Navegador;
  /** Navegador dentro de otra app (Instagram, Facebook, TikTok…): ahí no se puede instalar. */
  dentroDeApp: string | null;
}

/**
 * Cómo se instala en este entorno:
 * - boton: el navegador ofrece la instalación con un toque (Chrome, Edge, Samsung Internet).
 * - ios-safari / ios-otro: iPhone y iPad no permiten instalar con un botón; se agrega desde Compartir.
 * - android-menu: Android sin el aviso del navegador (Firefox, o Chrome antes de ofrecerlo).
 * - mac-safari: Safari en Mac (Archivo → Agregar al Dock).
 * - escritorio: computadora con un navegador que no instala apps; se sugiere abrirla en el teléfono.
 * - abrir-en-navegador: navegador dentro de otra app; hay que abrir la página en Safari o Chrome.
 */
export type MetodoInstalacion = "boton" | "ios-safari" | "ios-otro" | "android-menu" | "mac-safari" | "escritorio" | "abrir-en-navegador";

const APPS: [RegExp, string][] = [
  [/Instagram/i, "Instagram"],
  [/FBAN|FBAV|FB_IAB|FBIOS/i, "Facebook"],
  [/musical_ly|TikTok|BytedanceWebview/i, "TikTok"],
  [/\bLine\//i, "LINE"],
  [/Twitter/i, "X (Twitter)"],
  [/Snapchat/i, "Snapchat"],
  [/LinkedInApp/i, "LinkedIn"],
  [/\bGSA\//i, "la app de Google"],
];

export function detectarEntorno(ua: string, puntosTactiles = 0): Entorno {
  // iPadOS se presenta como Mac; se distingue porque tiene pantalla táctil.
  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && puntosTactiles > 1);
  const android = !ios && /Android/i.test(ua);
  const plataforma: Plataforma = ios ? "ios" : android ? "android" : "escritorio";

  let navegador: Navegador;
  if (ios) {
    navegador = /CriOS/i.test(ua)
      ? "chrome"
      : /FxiOS/i.test(ua)
        ? "firefox"
        : /EdgiOS/i.test(ua)
          ? "edge"
          : /OPiOS|OPT\//i.test(ua)
            ? "opera"
            : /Safari/i.test(ua) && /Version\//i.test(ua)
              ? "safari"
              : "otro";
  } else {
    navegador = /SamsungBrowser/i.test(ua)
      ? "samsung"
      : /Edg(e|A)?\//i.test(ua)
        ? "edge"
        : /OPR\/|Opera/i.test(ua)
          ? "opera"
          : /Firefox|FxA/i.test(ua)
            ? "firefox"
            : /Chrome|Chromium|CriOS/i.test(ua)
              ? "chrome"
              : /Safari/i.test(ua) && /Version\//i.test(ua)
                ? "safari"
                : "otro";
  }

  let dentroDeApp = APPS.find(([patron]) => patron.test(ua))?.[1] ?? null;
  // WebView genérico de Android («; wv)»): por ejemplo, el navegador interno de WhatsApp o del correo.
  if (!dentroDeApp && android && /; wv\)/.test(ua)) dentroDeApp = "otra app";
  // En iPhone, una vista web sin «Safari» en el agente también es el navegador de una app.
  if (!dentroDeApp && ios && navegador === "otro") dentroDeApp = "otra app";
  return { plataforma, navegador, dentroDeApp };
}

export function metodoInstalacion(entorno: Entorno, hayAvisoDelNavegador: boolean): MetodoInstalacion {
  if (entorno.dentroDeApp) return "abrir-en-navegador";
  if (hayAvisoDelNavegador) return "boton";
  if (entorno.plataforma === "ios") return entorno.navegador === "safari" ? "ios-safari" : "ios-otro";
  if (entorno.plataforma === "android") return "android-menu";
  if (entorno.navegador === "safari") return "mac-safari";
  return "escritorio";
}

/** Nombre del navegador para mostrarlo en las instrucciones. */
export const NOMBRE_NAVEGADOR: Record<Navegador, string> = {
  safari: "Safari",
  chrome: "Chrome",
  edge: "Edge",
  samsung: "Samsung Internet",
  firefox: "Firefox",
  opera: "Opera",
  otro: "tu navegador",
};

/** Clave en localStorage: la guía se muestra sola una única vez por dispositivo. */
export const CLAVE_GUIA_VISTA = "bosque-cucei:guia-instalar";
