# Padel Vriendenliga

Mobile-first webapp om een padelcompetitie voor vrienden te beheren.

## Wat zit erin

- Spelersbeheer met naam, klassement, optionele foto (URL of upload als base64)
- Poulebeheer met configureerbare grootte en statussen (actief, afgerond, gearchiveerd)
- Automatische dubbelwedstrijd-generatie zonder overlap per wedstrijd
- Score-invoer met puntentelling:
	- Winst: 2 punten per speler
	- Gelijkspel: 1 punt per speler
	- Verlies: 0 punten
- Klassement per poule, gesorteerd op:
	1. Punten
	2. Spelletjessaldo
	3. Gewonnen spelletjes
- Rolgebaseerde demo-toegang:
	- viewer: alleen bekijken
	- match-manager: scores invullen
	- admin: volledig beheer

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS (mobile first)
- Prisma + PostgreSQL
- Zustand (client state voor rolkeuze)
- Vitest (unit/API tests)

## Pagina's

- Dashboard: /
- Spelers: /spelers
- Poules: /poules
- Wedstrijden: /wedstrijden
- Klassement: /klassement
- Gebruikers (admin): /gebruikers

## API-routes

- GET/POST /api/persons
- PATCH/DELETE /api/persons/[id]
- GET/POST /api/pools
- GET/PATCH /api/pools/[id]
- POST /api/pools/[id]/generate
- POST /api/pools/[id]/reset
- POST /api/pools/[id]/archive
- GET /api/pools/[id]/rankings
- POST /api/matches/[id]/score
- GET /api/dashboard
- GET/POST /api/users
- PATCH/DELETE /api/users/[id]

## Lokaal starten

1. Installeer dependencies:

	 npm install

2. Vul je database-URL's in op basis van [.env.example](.env.example).

	 DATABASE_URL en DIRECT_URL moeten naar dezelfde Postgres database wijzen.

3. Database migreren en demo-users aanmaken:

	 npm run db:migrate:deploy
	 npm run db:seed

4. Dev-server starten:

	 npm run dev

5. Open http://localhost:3000

## Testen en checks

- Lint: npm run lint
- Tests: npm run test
- Build: npm run build

## Handige data scripts

- Export (SQLite -> JSON): npm run data:export -- ./prisma-export.json
- Import (JSON -> huidige DB): npm run data:import -- ./prisma-export.json
- Prisma Studio: npm run db:studio

## Gratis online deploy

Deze app is geschikt voor Netlify of Vercel, mits je een externe Postgres database gebruikt.

Belangrijk: serverless hosting gebruikt geen lokale persistente SQLite file. Gebruik daarom Postgres voor zowel runtime als migrations.

Volledige stap-voor-stap handleiding:

- [DEPLOYMENT.md](DEPLOYMENT.md)
