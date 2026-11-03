import { describe, expect, it } from "vitest";
import { detectarEntorno, metodoInstalacion } from "@/lib/instalacion";

const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1",
  iphoneFirefox:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/132.0 Mobile/15E148 Safari/605.1.15",
  iphoneInstagram:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 356.0.0.30.84 (iPhone15,2; iOS 18_1; es_MX)",
  iphoneGoogle:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/340.0.689375591 Mobile/15E148 Safari/604.1",
  ipad: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.102 Mobile Safari/537.36",
  androidSamsung:
    "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36",
  androidFirefox: "Mozilla/5.0 (Android 14; Mobile; rv:132.0) Gecko/132.0 Firefox/132.0",
  androidEdge:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 EdgA/130.0.2849.80",
  androidFacebook:
    "Mozilla/5.0 (Linux; Android 14; SM-A546E Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.102 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/489.0.0.66.81;]",
  androidWebView:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.102 Mobile Safari/537.36",
  macSafari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  windowsChrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  windowsEdge:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.2849.80",
  windowsFirefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
};

describe("detectarEntorno", () => {
  it.each([
    ["iphoneSafari", 5, { plataforma: "ios", navegador: "safari", dentroDeApp: null }],
    ["iphoneChrome", 5, { plataforma: "ios", navegador: "chrome", dentroDeApp: null }],
    ["iphoneFirefox", 5, { plataforma: "ios", navegador: "firefox", dentroDeApp: null }],
    ["iphoneInstagram", 5, { plataforma: "ios", dentroDeApp: "Instagram" }],
    ["iphoneGoogle", 5, { plataforma: "ios", dentroDeApp: "la app de Google" }],
    ["ipad", 5, { plataforma: "ios", navegador: "safari", dentroDeApp: null }],
    ["androidChrome", 5, { plataforma: "android", navegador: "chrome", dentroDeApp: null }],
    ["androidSamsung", 5, { plataforma: "android", navegador: "samsung", dentroDeApp: null }],
    ["androidFirefox", 5, { plataforma: "android", navegador: "firefox", dentroDeApp: null }],
    ["androidEdge", 5, { plataforma: "android", navegador: "edge", dentroDeApp: null }],
    ["androidFacebook", 5, { plataforma: "android", dentroDeApp: "Facebook" }],
    ["androidWebView", 5, { plataforma: "android", dentroDeApp: "otra app" }],
    ["macSafari", 0, { plataforma: "escritorio", navegador: "safari", dentroDeApp: null }],
    ["windowsChrome", 0, { plataforma: "escritorio", navegador: "chrome", dentroDeApp: null }],
    ["windowsEdge", 0, { plataforma: "escritorio", navegador: "edge", dentroDeApp: null }],
    ["windowsFirefox", 0, { plataforma: "escritorio", navegador: "firefox", dentroDeApp: null }],
  ] as const)("%s", (clave, toques, esperado) => {
    expect(detectarEntorno(UA[clave], toques)).toMatchObject(esperado);
  });
});

describe("metodoInstalacion", () => {
  const metodo = (clave: keyof typeof UA, toques: number, aviso = false) => metodoInstalacion(detectarEntorno(UA[clave], toques), aviso);

  it("usa el botón de un toque cuando el navegador ofrece la instalación", () => {
    expect(metodo("androidChrome", 5, true)).toBe("boton");
    expect(metodo("androidSamsung", 5, true)).toBe("boton");
    expect(metodo("windowsEdge", 0, true)).toBe("boton");
  });

  it("en iPhone siempre son pasos desde Compartir", () => {
    expect(metodo("iphoneSafari", 5)).toBe("ios-safari");
    expect(metodo("ipad", 5)).toBe("ios-safari");
    expect(metodo("iphoneChrome", 5)).toBe("ios-otro");
    expect(metodo("iphoneFirefox", 5)).toBe("ios-otro");
  });

  it("sin aviso del navegador da los pasos del menú o de la computadora", () => {
    expect(metodo("androidChrome", 5)).toBe("android-menu");
    expect(metodo("androidFirefox", 5)).toBe("android-menu");
    expect(metodo("macSafari", 0)).toBe("mac-safari");
    expect(metodo("windowsFirefox", 0)).toBe("escritorio");
  });

  it("dentro de otra app pide abrir el navegador, aunque haya aviso", () => {
    expect(metodo("iphoneInstagram", 5)).toBe("abrir-en-navegador");
    expect(metodo("androidFacebook", 5, true)).toBe("abrir-en-navegador");
  });
});
