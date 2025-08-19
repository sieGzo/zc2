import Head from "next/head";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import GeoAutocomplete from "@/components/GeoAutocomplete";

type Mode = "walk" | "bicycle";

export default function TrailsPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("bicycle");
  const [startLabel, setStartLabel] = useState("");
  const [endLabel, setEndLabel] = useState("");
  const [start, setStart] = useState<[number, number] | undefined>(); // [lat, lon]
  const [end, setEnd] = useState<[number, number] | undefined>();

  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minutesTotal = useMemo(() => {
    if (!route) return 0;
    return Math.round(
      (route?.features ?? []).reduce(
        (acc: number, f: any) => acc + (f?.properties?.time ?? 0),
        0
      ) / 60
    );
  }, [route]);

  const distanceKm = useMemo(() => {
    if (!route) return 0;
    const meters = (route?.features ?? []).reduce(
      (acc: number, f: any) => acc + (f?.properties?.distance ?? 0),
      0
    );
    return meters / 1000;
  }, [route]);

  function formatDuration(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  }

  async function plan() {
    setError(null);
    setRoute(null);

    async function geocodeIfNeeded(label: string, coords?: [number, number]) {
      if (coords || !label) return coords;
      const key = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
      if (!key) throw new Error("Brak NEXT_PUBLIC_GEOAPIFY_KEY");
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
          label
        )}&limit=1&apiKey=${key}`
      );
      const data = await res.json();
      const f = data?.features?.[0];
      return f
        ? ([f.geometry.coordinates[1], f.geometry.coordinates[0]] as [number, number])
        : undefined;
    }

    const s = await geocodeIfNeeded(startLabel, start);
    const e = await geocodeIfNeeded(endLabel, end);

    if (!s || !e) {
      setError(
        "Ustaw oba punkty trasy (wybierz z listy lub wpisz i naciśnij Enter)."
      );
      return;
    }

    setStart(s);
    setEnd(e);

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

  // linki do nawigacji
  function googleLink() {
    const travelmode = mode === "walk" ? "walking" : "bicycling";
    const origin = startLabel || (start ? `${start[0]},${start[1]}` : "");
    const destination = endLabel || (end ? `${end[0]},${end[1]}` : "");
    const q = new URLSearchParams({
      api: "1",
      origin,
      destination,
      travelmode,
    });
    return `https://www.google.com/maps/dir/?${q.toString()}`;
  }

  function appleLink() {
    const dirflg = mode === "walk" ? "w" : "r";
    const s = startLabel || (start ? `${start[0]},${start[1]}` : "");
    const e = endLabel || (end ? `${end[0]},${end[1]}` : "");
    const q = new URLSearchParams({ saddr: s, daddr: e, dirflg });
    return `http://maps.apple.com/?${q.toString()}`;
  }

  function osmLink() {
    if (!start || !end) return "#";
    const engine = mode === "walk" ? "foot" : "bicycle";
    const route = `${start[0]},${start[1]};${end[0]},${end[1]}`;
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_${engine}&route=${route}`;
  }

  async function saveCurrentRoute() {
    if (!route || !start || !end) return;
    const name = `${startLabel || "Start"} → ${endLabel || "Meta"} (${
      mode === "walk" ? "piesza" : "rowerowa"
    })`;

    try {
      const r = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mode,
          start,
          end,
          distance: distanceKm * 1000, // metry
          time: minutesTotal * 60, // sekundy
          geojson: route,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Nie udało się zapisać trasy");
      router.push("/szlaki/moje");
    } catch (err: any) {
      alert(err.message);
    }
  }

  const canOpenExternal =
    (startLabel && endLabel) || (start && end); // tekst albo współrzędne

  return (
    <main className="max-w-5xl mx-auto p-6">
      <Head>
        <title>Planer trasy — Zwiedzaj Chytrze</title>
      </Head>

      <h1 className="text-3xl font-bold mb-4">Planer trasy</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <GeoAutocomplete
          label="Punkt startowy"
          value={startLabel}
          onChange={setStartLabel}
          onSelect={(lat, lon, name) => {
            setStart([lat, lon]);
            if (name) setStartLabel(name);
          }}
        />
        <GeoAutocomplete
          label="Punkt docelowy"
          value={endLabel}
          onChange={setEndLabel}
          onSelect={(lat, lon, name) => {
            setEnd([lat, lon]);
            if (name) setEndLabel(name);
          }}
        />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode"
            checked={mode === "walk"}
            onChange={() => setMode("walk")}
          />{" "}
          piesza
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode"
            checked={mode === "bicycle"}
            onChange={() => setMode("bicycle")}
          />{" "}
          rowerowa
        </label>
        <button onClick={plan} className="ml-auto btn btn-primary">
          Zaplanuj
        </button>
      </div>

      {loading && <p className="mt-3">Liczenie trasy…</p>}
      {error && <p className="mt-3 text-red-600">{error}</p>}

      {route && (
        <div className="card mt-4 card-hover">
          <div className="card-body gap-6">
            <div className="flex items-center gap-6">
              <div>
                <p>
                  <strong>Dystans:</strong> {distanceKm.toFixed(1)} km
                </p>
                <p>
                  <strong>Czas:</strong> {formatDuration(minutesTotal)}
                </p>
              </div>
              <button onClick={saveCurrentRoute} className="ml-auto btn btn-primary">
                Zapisz trasę
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <a
                href={googleLink()}
                target="_blank"
                rel="noreferrer"
                className={`btn ${canOpenExternal ? "btn-secondary" : "btn-disabled"}`}
                aria-disabled={!canOpenExternal}
              >
                Otwórz w Google Maps
              </a>
              <a
                href={appleLink()}
                target="_blank"
                rel="noreferrer"
                className={`btn ${canOpenExternal ? "btn-ghost" : "btn-disabled"}`}
                aria-disabled={!canOpenExternal}
              >
                Otwórz w Apple Maps
              </a>
              <a
                href={osmLink()}
                target="_blank"
                rel="noreferrer"
                className={`btn ${start && end ? "btn-ghost" : "btn-disabled"}`}
                aria-disabled={!start || !end}
                title={!start || !end ? "Wybierz lokalizacje z listy, by użyć OSM" : ""}
              >
                Otwórz w OSM
              </a>
              {/* (opcjonalnie) Pobierz GPX */}
              {/* <a href={`/api/geo/route.gpx?mode=${mode}&p=${start?.join(",")}&p=${end?.join(",")}`} className="btn btn-ghost">Pobierz GPX</a> */}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
