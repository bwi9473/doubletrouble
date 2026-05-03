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
- Prisma + SQLite
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

2. Database genereren:

	 npm run db:push

3. Dev-server starten:

	 npm run dev

4. Open http://localhost:3000

## Testen en checks

- Lint: npm run lint
- Tests: npm run test
- Build: npm run build

## Handige data scripts

- Export (SQLite -> JSON): npm run data:export -- ./prisma-export.json
- Import (JSON -> huidige DB): npm run data:import -- ./prisma-export.json
- Prisma Studio: npm run db:studio

## Gratis online deploy

Deze app is geschikt voor Vercel.

Belangrijk: SQLite is lokaal bestand-gebaseerd en niet ideaal voor persistente cloud-data op serverless.
Voor productie kun je Prisma eenvoudig naar een externe database verplaatsen (bijv. Postgres) en dezelfde API-structuur behouden.

Volledige stap-voor-stap handleiding:

- [DEPLOYMENT.md](DEPLOYMENT.md)
