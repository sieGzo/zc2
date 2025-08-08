Geoapify integration (Places + Place Details + Routing)

1) Skopiuj paczkę do projektu (zachowaj ścieżki).
2) W `.env.local` ustaw:
   GEOAPIFY_API_KEY=TWÓJ_KLUCZ
   NEXT_PUBLIC_GEOAPIFY_KEY=TWÓJ_KLUCZ
3) Restart `npm run dev`.
4) Testuj:
   - /places — wyszukaj miejsca (kategorie domyślne: tourism.sights,natural)
   - /places/[id] — szczegóły miejsca (z Place Details)
   - /trails — prosty planer trasy (pieszo/rower)

Uwaga: komponent mapy można dorobić (Leaflet/MapTiler/Geoapify tiles). Tu jest celowo „lekko”,
żebyś mógł szybko podmieniać i rozwijać.
