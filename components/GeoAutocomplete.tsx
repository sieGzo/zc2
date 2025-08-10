import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (lat: number, lon: number, name?: string) => void;
};

const API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;

export default function GeoAutocomplete({ label, value, onChange, onSelect }: Props) {
  const [results, setResults] = useState<any[]>([]);
  const ac = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!value || value.length < 3 || !API_KEY) {
      setResults([]);
      return;
    }
    ac.current?.abort();
    const ctrl = new AbortController();
    ac.current = ctrl;

    const t = setTimeout(async () => {
      try {
        // 1) AUTOCOMPLETE
          const res = await fetch(
            `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(value)}&limit=5&lang=pl&filter=countrycode:pl&apiKey=${API_KEY}`,
            { signal: ctrl.signal }
          );
        const data = await res.json();
        setResults(data.features || []);
      } catch {
        /* ignore */
      }
    }, 220); // delikatny debounce

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  async function forceGeocode(current: string) {
    if (!current || !API_KEY) return;
        const res = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(current)}&limit=1&lang=pl&filter=countrycode:pl&apiKey=${API_KEY}`
    );
    const data = await res.json();
    const f = data?.features?.[0];
    if (f) {
      onSelect(f.geometry.coordinates[1], f.geometry.coordinates[0], f.properties.formatted);
    }
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => forceGeocode(value)}         // wpisz i odejdź z pola → zgeokoduje
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (results[0]) {
              const r = results[0];
              onChange(r.properties.formatted);
              setResults([]);
              onSelect(r.geometry.coordinates[1], r.geometry.coordinates[0], r.properties.formatted);
            } else {
              forceGeocode(value);
            }
          }
        }}
        className="border rounded p-2 w-full"
        placeholder="Wpisz adres / nazwę miejsca i wciśnij Enter"
      />
      {results.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full mt-1 max-h-48 overflow-y-auto text-sm">
          {results.map((r, i) => (
            <li
              key={i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(r.properties.formatted);
                setResults([]);
                onSelect(r.geometry.coordinates[1], r.geometry.coordinates[0], r.properties.formatted);
              }}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              {r.properties.formatted}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
