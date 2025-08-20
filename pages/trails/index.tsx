// pages/trails/index.tsx
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
      setError("Ustaw oba punkty trasy (wybierz z listy lub wpisz i naciśnij Enter).");
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

  // Apple Maps pokazujemy tylko w trybie pieszym (rower w Apple nie działa)
  function appleLink() {
    const s = startLabel || (start ? `${start[0]},${start[1]}` : "");
    const e = endLabel || (end ? `${end[0]},${end[1]}` : "");
    const q = new URLSearchParams({ saddr: s, daddr: e, dirflg: "w" });
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

    const payload = {
      name,
      mode,
      start,
      end,
      distance: distanceKm * 1000,
      time: minutesTotal * 60,
      geojson: route,
    };

    try {
      const r = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (r.status === 401) {
        const key = "zc_saved_routes";
        const list: any[] = JSON.parse(localStorage.getItem(key) || "[]");
        const id = Date.now();
        list.unshift({ id, ...payload });
        localStorage.setItem(key, JSON.stringify(list));
        window.location.href = "/trails/moje/moje";
        return;
      }

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Nie udało się zapisać trasy");
      }

      const newId = data?.id as string | undefined;
      if (newId) {
        window.location.href = `/trails/${newId}`;
      } else {
        window.location.href = "/profil";
      }
    } catch (err: any) {
      alert(err?.message || "Błąd zapisu trasy");
    }
  }

  const canOpenExternal = (startLabel && endLabel) || (start && end);
  const hasCoords = !!start && !!end;

  return (
    <main className="max-w-5xl mx-auto p-6">
      <Head>
        <title>Planer trasy — Zwiedzaj Chytrze</title>
      </Head>

      <header className="mb-5">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight break-words">
          Planer trasy
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Wybierz punkty, zaplanuj trasę i otwórz w ulubionej nawigacji albo pobierz GPX.
        </p>
      </header>

      {/* Punkty start/meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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

      {/* Tryb + przycisk planowania */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            className={`btn btn-sm sm:btn-md ${mode === "walk" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setMode("walk")}
          >
            Piesza
          </button>
          <button
            className={`btn btn-sm sm:btn-md ${mode === "bicycle" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setMode("bicycle")}
          >
            Rowerowa
          </button>
        </div>

        <button onClick={plan} className="ml-auto btn btn-primary">
          Zaplanuj
        </button>
      </div>

      <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
        Podpowiedź: możesz wpisać nazwę i wcisnąć{" "}
        <kbd className="px-1 py-0.5 border rounded">Enter</kbd>, albo wybrać z listy.
      </p>

      {loading && <p className="mt-3">Liczenie trasy…</p>}
      {error && <p className="mt-3 text-red-600">{error}</p>}

      {route && (
        <div className="card mt-4 card-hover">
          <div className="card-body space-y-4">
            {/* Podsumowanie */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="pill">
                <strong className="mr-1">Dystans:</strong> {distanceKm.toFixed(1)} km
              </span>
              <span className="pill">
                <strong className="mr-1">Czas:</strong> {formatDuration(minutesTotal)}
              </span>
              <span className="pill">{mode === "walk" ? "Piesza" : "Rowerowa"}</span>
              <button onClick={saveCurrentRoute} className="ml-auto btn btn-primary">
                Zapisz trasę
              </button>
            </div>

            {/* Akcje nawigacyjne */}
            <div className="flex flex-wrap items-center gap-3">
              {canOpenExternal ? (
                <a href={googleLink()} target="_blank" rel="noreferrer" className="btn btn-outline">
                  Otwórz w Google Maps
                </a>
              ) : (
                <button className="btn btn-outline" disabled>
                  Otwórz w Google Maps
                </button>
              )}

              {mode === "walk" && (
                canOpenExternal ? (
                  <a href={appleLink()} target="_blank" rel="noreferrer" className="btn btn-ghost">
                    Otwórz w Apple Maps
                  </a>
                ) : (
                  <button className="btn btn-ghost" disabled>
                    Otwórz w Apple Maps
                  </button>
                )
              )}

              {hasCoords ? (
                <>
                  <a href={osmLink()} target="_blank" rel="noreferrer" className="btn btn-ghost">
                    Otwórz w OSM
                  </a>
                  <a
                    href={`/api/geo/route.gpx?mode=${mode}&p=${start?.join(",")}&p=${end?.join(",")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost"
                  >
                    Pobierz GPX
                  </a>
                </>
              ) : (
                <>
                  <button className="btn btn-ghost" disabled title="OSM wymaga współrzędnych start/meta">
                    Otwórz w OSM
                  </button>
                  <button className="btn btn-ghost" disabled title="GPX wymaga współrzędnych start/meta">
                    Pobierz GPX
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
