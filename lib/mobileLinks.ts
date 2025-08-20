// lib/mobileLinks.ts
export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
export function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /Android/.test(navigator.userAgent);
}

/**
 * Zwraca URL, który maksymalnie “pcha” w natywną apkę Google Maps.
 * origin/destination: "lat,lon" lub nazwa miejsca
 * travelmode: "walking" | "bicycling"
 */
export function mobileGoogleLink(
  origin?: string,
  destination?: string,
  travelmode: "walking" | "bicycling" = "walking"
) {
  const saddr = origin || "";
  const daddr = destination || "";
  const q = new URLSearchParams({ saddr, daddr, directionsmode: travelmode });

  if (isIOS()) return `comgooglemaps://?${q.toString()}`;

  if (isAndroid()) {
    // intent → otworzy apkę, jeśli jest. Jeśli nie, fallback do przeglądarki.
    return `intent://maps.google.com/maps?${q.toString()}#Intent;scheme=https;package=com.google.android.apps.maps;end`;
  }

  // desktop / fallback
  const q2 = new URLSearchParams({ api: "1", origin: saddr, destination: daddr, travelmode });
  return `https://www.google.com/maps/dir/?${q2.toString()}`;
}

/** Apple Maps (iOS: maps://; inne platformy: http link do Apple) */
export function mobileAppleLink(origin?: string, destination?: string, walking = true) {
  const s = origin || "";
  const d = destination || "";
  const q = new URLSearchParams({ saddr: s, daddr: d, dirflg: walking ? "w" : "" });
  return isIOS() ? `maps://?${q.toString()}` : `http://maps.apple.com/?${q.toString()}`;
}
