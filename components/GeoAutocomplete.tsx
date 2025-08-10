// components/GeoAutocomplete.tsx
import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (lat: number, lon: number, name?: string) => void;
};

const API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
const GEO_LANG = process.env.NEXT_PUBLIC_GEOAPIFY_LANG || "pl";   // język wyników
const GEO_COUNTRY = process.env.NEXT_PUBLIC_GEOAPIFY_COUNTRY || "pl"; // bias na PL

type Feature = {
  properties: { formatted?: string; place_id?: string };
  geometry: { coordinates: [number, number] }; // [lon, lat]
};

export default function GeoAutocomplete({ label, value, onChange, onSelect }: Props) {
  const [results, setResults] = useState<Feature[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // podświetlenie klawiaturą
  const ac = useRef<AbortController | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // debounce + AbortController (zachowane)
  useEffect(() => {
    if (!value || value.length < 3 || !API_KEY) {
      setResults([]);
      setOpen(false);
      return;
    }
    ac.current?.abort();
    const ctrl = new AbortController();
    ac.current = ctrl;

    const t = setTimeout(async () => {
      try {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          value
        )}&limit=6&lang=${GEO_LANG}&filter=countrycode:${GEO_COUNTRY}&apiKey=${API_KEY}`;
        const res = await fetch(url, { signal: ctrl.signal });
        const data = await res.json();
        const feats: Feature[] = data?.features || [];
        setResults(feats);
        setOpen(feats.length > 0);
        setActive(-1);
      } catch {
        // ignore (abort/timeout)
        setOpen(false);
      }
    }, 220);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  // zamykanie po kliknięciu poza
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function forceGeocode(current: string) {
    if (!current || !API_KEY) return;
    try {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        current
      )}&limit=1&lang=${GEO_LANG}&filter=countrycode:${GEO_COUNTRY}&apiKey=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      const f: Feature | undefined = data?.features?.[0];
      if (f) {
        const name = f.properties.formatted;
        onSelect(f.geometry.coordinates[1], f.geometry.coordinates[0], name);
      }
    } catch {
      /* ignore */
    }
  }

  function choose(feature: Feature) {
    const name = feature.properties.formatted;
    onChange(name || "");
    setResults([]);
    setOpen(false);
    onSelect(feature.geometry.coordinates[1], feature.geometry.coordinates[0], name);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && e.key === "ArrowDown") {
      if (results.length > 0) setOpen(true);
      return;
    }
    if (!open) {
      if (e.key === "Enter") {
        e.preventDefault();
        forceGeocode(value);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((p) => (p + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((p) => (p - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && results[active]) choose(results[active]);
      else if (results[0]) choose(results[0]);
      else forceGeocode(value);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <label className="block text-sm font-medium mb-1">{label}</label>

      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onBlur={() => forceGeocode(value)}   // zachowane: wpisz i odejdź z pola → geokoduje
        onKeyDown={onKeyDown}               // klawiatura: ↑ ↓ Enter Esc
        className="border rounded p-2 w-full form-contrast"
        placeholder="Wpisz adres / nazwę miejsca i wciśnij Enter"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="geo-autocomplete-list"
        role="combobox"
      />

      {open && results.length > 0 && (
        <ul
          id="geo-autocomplete-list"
          role="listbox"
          className="autocomplete-panel absolute left-0 right-0 top-full z-50 text-sm"
        >
          {results.map((r, i) => {
            const name = r.properties.formatted || "Lokalizacja";
            const isActive = i === active;
            return (
              <li
                role="option"
                aria-selected={isActive}
                key={r.properties.place_id ?? i}
                onMouseDown={(e) => e.preventDefault()} // żeby klik nie zabierał focusa przed onClick
                onClick={() => choose(r)}
                onMouseEnter={() => setActive(i)}
                className={`p-2 cursor-pointer ${
                  isActive ? "bg-gray-100 dark:bg-gray-700" : ""
                }`}
                title={name}
              >
                {name}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
