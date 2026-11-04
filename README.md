# Crate

Crate is a personal vinyl record collection tracker. Create an account, catalog records and artists, search and sort your collection, star favorites, log listening sessions, and view collection stats.

**Live URL:** https://crate-charlesgao21.replit.app

## Tools

- Replit Agent
- PostgreSQL
- Replit Deployments (Autoscale)

## Run locally

Use Node.js and PostgreSQL. Create a local database, then set its connection string and a session secret in your shell:

```sh
export DATABASE_URL='postgres://user:password@localhost:5432/crate'
export SESSION_SECRET='replace-with-a-random-secret'
npm install
psql "$DATABASE_URL" -f db/schema.sql
npm run dev
```

The app listens on port 5000 by default. For production, Replit Publish applies the development database schema to the production database before the new deployment goes live.

## Tests

```sh
npm test
```
