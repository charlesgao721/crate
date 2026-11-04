# Crate

## Run the app

- Run `npm run dev` for local development.
- Run `npm start` to serve the app.
- The server listens on `PORT` (5000 by default).

## Required environment

- `DATABASE_URL` must point to the Replit PostgreSQL database.
- `SESSION_SECRET` must be set in Replit Secrets; do not commit it.

## Database

The development PostgreSQL database has the schema in `db/schema.sql`. It contains `users` and the PostgreSQL-backed `session` table for feature 1, plus the `artists` and `records` tables for feature 2. Records are tied to their artist and user; the composite foreign key prevents a record from being assigned to another user's artist.

## Authentication routes

- `/signup` creates an account.
- `/login` starts a session.
- `/collection` shows the signed-in user's record cards.
- `/records/new` adds a record; `/records/:id` shows its details; `/records/:id/edit` edits it.
- `/records/:id/delete` asks for confirmation before deletion.
- `/artists` lists the signed-in user's artists.
- `/artists/:id` shows that artist and their records; requests for another user's artist return 404.
- `POST /logout` ends the session.
