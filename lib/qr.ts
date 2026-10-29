import QRCode from "qrcode";

export function urlSitio() {
  return (process.env.URL_SITIO ?? "http://localhost:3000").replace(/\/$/, "");
}

/** QR en SVG que apunta a /a/<qr_id>; al escanearlo con la cámara del teléfono abre la ficha. */
export async function qrSvg(qrId: string, color = "#1e2b22") {
  return QRCode.toString(`${urlSitio()}/a/${encodeURIComponent(qrId)}`, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: color, light: "#ffffff00" },
  });
}
