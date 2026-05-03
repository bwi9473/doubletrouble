# Deployment en migratie (gratis)

## Aanbevolen stack

- Hosting: Vercel (gratis)
- Database: Neon Postgres (gratis) of Supabase Postgres (gratis)

## 1) Voorbereiding lokaal

1. Maak een export van je lokale SQLite data:

   npm run data:export -- ./prisma-export.json

2. Commit en push je project naar GitHub.

## 2) Productie-DB aanmaken

1. Maak een gratis Postgres database aan (Neon/Supabase).
2. Neem 2 connecties over:
   - `DATABASE_URL` (pooled / runtime)
   - `DIRECT_URL` (non-pooled / migrations)

## 3) Prisma omschakelen naar Postgres

Pas in [prisma/schema.prisma](prisma/schema.prisma) de datasource aan:

- `provider = "sqlite"` -> `provider = "postgresql"`

De velden `url` en `directUrl` staan al correct op env vars.

## 4) Eerste migratie voor productie

Voer lokaal uit nadat de provider is aangepast:

1. Maak lokaal een `.env.production` met Postgres waarden.
2. Run:

   prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0001_init/migration.sql

3. Commit de map `prisma/migrations`.

## 5) Vercel configureren

1. Importeer de GitHub repo in Vercel.
2. Voeg omgevingsvariabelen toe:
   - `DATABASE_URL`
   - `DIRECT_URL`
3. Build command:

   npm run db:generate; npm run db:migrate:deploy; npm run build

4. Deploy.

## 6) Data importeren in Postgres

Na eerste deploy kun je je export importeren:

1. Zet tijdelijk je lokale `.env` op Postgres URL's.
2. Run:

   npm run data:import -- ./prisma-export.json

3. Herdeploy of open de app: je data staat nu in Postgres.

## Opmerking

- SQLite blijft ideaal voor lokaal development.
- Voor persistente productie-data op serverless is Postgres de juiste keuze.
