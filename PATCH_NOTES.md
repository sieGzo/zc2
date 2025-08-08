# Patch notes (zc2)

## Co zmieniono
- Naprawiono auto-scroll na stronie głównej (DestinationCarousel nie przewija na starcie).
- Uporządkowano logowanie: next-auth v4 + `@next-auth/prisma-adapter`.
- Usunięto konfliktujące zależności (`@auth/prisma-adapter`, `bcrypt`), pozostawiono `bcryptjs`.
- Dodano `.env.example` z wymaganymi zmiennymi.
- Wygenerowano podstawowe podstrony (Artykuły, Miejsca, Trasy, Oferty, Kontakt, O projekcie, panele User/Admin).
- Dodano prostą stronę **/login** z przyciskami Google i Facebook.

## Po aktualizacji
1. `npm i` lub `pnpm i`
2. Skopiuj `.env.example` do `.env.local` i uzupełnij wartości.
3. Ustaw poprawne redirect/callback URL w konsolach Google i Facebook:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/facebook`
4. `npx prisma generate && npx prisma migrate dev` (upewnij się, że `DATABASE_URL` wskazuje na bazę).
5. `npm run dev`

## Uwaga
Jeśli chcesz przejść na Auth.js v5 (route handlers), mogę przygotować kolejny patch.
