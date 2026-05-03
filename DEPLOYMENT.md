# Deployment en migratie (gratis)

## Aanbevolen stack

- Hosting: Netlify (gratis) of Vercel (gratis)
- Database: Neon Postgres (gratis) of Supabase Postgres (gratis)

## 1) Voorbereiding lokaal

1. Maak een export van je lokale SQLite data:

   npm run data:export -- ./prisma-export.json

2. Zet lokaal je `.env` op Postgres waarden zoals in [.env.example](.env.example).
3. Commit en push je project naar GitHub.

## 2) Productie-DB aanmaken

1. Maak een gratis Postgres database aan (Neon/Supabase).
2. Neem 2 connecties over:
   - `DATABASE_URL` (pooled / runtime)
   - `DIRECT_URL` (non-pooled / migrations)

## 3) Prisma migratie gebruiken

Deze repo bevat een initiële Postgres migratie onder `prisma/migrations`.

## 4) Netlify configureren

1. Importeer de GitHub repo in Netlify.
2. Voeg omgevingsvariabelen toe:
   - `DATABASE_URL`
   - `DIRECT_URL`
3. Netlify gebruikt [netlify.toml](netlify.toml) met deze build flow:

   npm run db:generate; npm run db:migrate:deploy; npm run db:seed; npm run build

4. Deploy.

## 5) Data importeren in Postgres

Na eerste deploy kun je je export importeren:

1. Zet lokaal je `.env` op dezelfde Postgres URL's als productie.
2. Run:

   npm run data:import -- ./prisma-export.json

3. Herdeploy of open de app: je data staat nu in Postgres.

## Opmerking

- `data:export` en `data:import` nemen ook `AppUser`-accounts en `PoolViewAccess` mee, zodat login en zichtrechten behouden blijven.
- `db:seed` is idempotent en vult standaard de demo-users `admin` en `manager` aan.
- Voor persistente productie-data op serverless is Postgres de juiste keuze.
