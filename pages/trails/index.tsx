import Head from "next/head";
import { useState } from "react";
import dynamic from "next/dynamic";
import GeoAutocomplete from "@/components/GeoAutocomplete";

const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false });

export default function TrailsPage() {
  const [mode, setMode] = useState<"walk" | "bicycle">("bicycle");
  const [startLabel, setStartLabel] = useState("");
  const [endLabel, setEndLabel] = useState("");

  // współrzędne [lat, lon]
  const [start, setStart] = useState<[number, number] | undefined>();
  const [end, setEnd] = useState<[number, number] | undefined>();

  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pointStep, setPointStep] = useState<"start" | "end">("start");

  async function plan() {
    setError(null);
    setRoute(null);

    // Jeżeli ktoś tylko wpisał tekst i nie wybrał z listy/nie kliknął mapy,
    // dogeokoduj wpisane etykiety na współrzędne.
    async function geocodeIfNeeded(label: string, coords?: [number, number]) {
      if (coords || !label) return coords;
      const key = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
      if (!key) throw new Error("Brak NEXT_PUBLIC_GEOAPIFY_KEY");
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(label)}&limit=1&apiKey=${key}`
      );
      const data = await res.json();
      const f = data?.features?.[0];
      return f ? ([f.geometry.coordinates[1], f.geometry.coordinates[0]] as [number, number]) : undefined;
    }

    const s = await geocodeIfNeeded(startLabel, start);
    const e = await geocodeIfNeeded(endLabel, end);

    if (!s || !e) {
      setError("Ustaw oba punkty trasy (wybierz z listy, kliknij na mapie lub wpisz i naciśnij Enter).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/geo/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          fromLat: s[0],
          fromLon: s[1],
          toLat: e[0],
          toLon: e[1],
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(typeof data === "string" ? data : JSON.stringify(data));
      else setRoute(data);
    } catch (e: any) {
      setError(e?.message || "Błąd planowania trasy");
    } finally {
      setLoading(false);
    }
  }

// --- HELPERY: spłaszcz wszystkie odcinki i zsumuj dystans/czas ---
function extractGeoapifyCoords(geojson: any): [number, number][] {
  const out: [number, number][] = [];
  const feats = geojson?.features ?? [];
  for (const f of feats) {
    const g = f?.geometry;
    if (!g) continue;
    if (g.type === "LineString") {
      for (const [lon, lat] of g.coordinates) out.push([lat, lon]);
    } else if (g.type === "MultiLineString") {
      for (const seg of g.coordinates) {
        for (const [lon, lat] of seg) out.push([lat, lon]);
      }
    }
  }
  return out;
}

function sumProps(geojson: any, key: "distance" | "time") {
  return (geojson?.features ?? []).reduce(
    (acc: number, f: any) => acc + (f?.properties?.[key] ?? 0),
    0
  );
}

// Geoapify → Leaflet: [lon,lat] → [lat,lon] + pełna trasa
const coords: [number, number][] = extractGeoapifyCoords(route);

// Podsumowanie po wszystkich segmentach
const dist = sumProps(route, "distance"); // metry
const time = sumProps(route, "time");     // sekundy

  function saveCurrentRoute() {
    if (!route || !start || !end) return;

    const name = `${startLabel || "Start"} → ${endLabel || "Meta"} (${mode === "walk" ? "piesza" : "rowerowa"})`;

    fetch("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        mode,
        start,                // [lat, lon]
        end,                  // [lat, lon]
        distance: dist,       // metry
        time,                 // sekundy
        geojson: route        // cała odpowiedź z routingu
      })
    })
    .then(async r => {
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data?.error || "Nie udało się zapisać trasy")
      alert("Trasa zapisana. Wejdź w: /trails/moje");
    })
    .catch(err => alert(err.message));
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <Head><title>Planer trasy — Zwiedzaj Chytrze</title></Head>
      <h1 className="text-3xl font-bold mb-4">Planer trasy</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <GeoAutocomplete
          label="Punkt startowy"
          value={startLabel}
          onChange={setStartLabel}
          onSelect={(lat, lon, name) => {
            setStart([lat, lon]);
            if (name) setStartLabel(name);
            setPointStep("end");
          }}
        />
        <GeoAutocomplete
          label="Punkt docelowy"
          value={endLabel}
          onChange={setEndLabel}
          onSelect={(lat, lon, name) => {
            setEnd([lat, lon]);
            if (name) setEndLabel(name);
            setPointStep("start");
          }}
        />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <label className="flex items-center gap-2">
          <input type="radio" name="mode" checked={mode === "walk"} onChange={() => setMode("walk")} /> piesza
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="mode" checked={mode === "bicycle"} onChange={() => setMode("bicycle")} /> rowerowa
        </label>
        <button onClick={plan} className="ml-auto px-4 py-2 rounded bg-[#f1861e] text-white hover:bg-orange-600">
          Zaplanuj
        </button>
      </div>

      <p className="mb-2 text-sm">
        Kliknij na mapie, aby ustawić {pointStep === "start" ? "punkt startowy" : "punkt docelowy"} —
        wpisanie samej nazwy też działa (Enter lub klik z listy).
      </p>

      <RouteMap
        start={start}
        end={end}
        coords={coords}
        onPointSelect={(lat, lon) => {
          if (pointStep === "start") { setStart([lat, lon]); setPointStep("end"); }
          else { setEnd([lat, lon]); setPointStep("start"); }
        }}
      />

      {loading && <p className="mt-3">Liczenie trasy…</p>}
      {error && <p className="mt-3 text-red-600">{error}</p>}
      {route && (
      <div className="mt-4 p-3 bg-gray-100 rounded flex items-center gap-6">
        <div>
          <p><strong>Dystans:</strong> {(dist / 1000).toFixed(1)} km</p>
          <p><strong>Czas:</strong> {Math.round(time / 60)} min</p>
        </div>
        <button
          onClick={saveCurrentRoute}
          className="ml-auto px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Zapisz trasę
        </button>
      </div>
    )}
    </main>
  );
}
