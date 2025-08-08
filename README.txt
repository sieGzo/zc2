# Redirect Killer Pack — instrukcja

1) Skopiuj pliki z paczki do projektu (nadpisz istniejące):
   - middleware.ts (root projektu)
   - pages/login.tsx
   - hooks/useauth.ts
   - pages/api/auth/[...nextauth].ts
   - pages/profil.tsx
   - pages/auth/debug.tsx

2) Uruchom ponownie `npm run dev` (lub zdeployuj).

3) W przeglądarce:
   - Wyczyść cookies + localStorage dla domeny.
   - Odwiedź `/auth/debug` i sprawdź, czy `status: "authenticated"` po logowaniu.

4) Dodatkowo (ręcznie w kodzie):
   - Zamień ew. linki do `/api/auth/signin` na `/login` i dodaj `prefetch={false}`.
     Szybkie sprawdzenie:
       grep -R "/api/auth/signin" -n .
   - Upewnij się, że obraz logo używa ścieżki `/logo.png` (z folderu `public`), nie `Logo.PNG` itp.
