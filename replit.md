# Crate

## Run the app

- Run `npm run dev` for local development.
- Run `npm start` to serve the app.
- The server listens on `PORT` (5000 by default).

## Required environment

- `DATABASE_URL` must point to the Replit PostgreSQL database.
- `SESSION_SECRET` must be set in Replit Secrets; do not commit it.

## Database

The development PostgreSQL database has the schema in `db/schema.sql`. It contains `users` and the PostgreSQL-backed `session` table for feature 1, `artists` and `records` for feature 2, one shared `stars` junction table for feature 5, and one shared `plays` table for feature 9. A composite foreign key ties records to their artist and user. The app checks record ownership before logging plays; stars and plays cascade when their record is deleted.

## Authentication routes

- `/signup` creates an account.
- `/login` starts a session.
- `/collection` shows the signed-in user's record cards, play counts, and collection sorting.
- `/starred` shows the signed-in user's starred records.
- `/records/new` adds a record; `/records/:id` shows its details; `/records/:id/edit` edits it.
- `POST /records/:id/star` toggles a star for the signed-in user's own record.
- `/records/:id` lists past spins; `POST /records/:id/plays` logs a spin on the signed-in user's own record.
- `/records/:id/delete` asks for confirmation before deletion.
- `/artists` lists the signed-in user's artists.
- `/artists/:id` shows that artist and their records; requests for another user's artist return 404.
- `POST /logout` ends the session.
