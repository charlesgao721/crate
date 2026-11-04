# Crate

## Run the app

- Run `npm run dev` for local development.
- Run `npm start` to serve the app.
- The server listens on `PORT` (5000 by default).

## Required environment

- `DATABASE_URL` must point to the Replit PostgreSQL database.
- `SESSION_SECRET` must be set in Replit Secrets; do not commit it.

## Database

The development PostgreSQL database has the schema in `db/schema.sql`. It contains the `users` table for feature 1 and the PostgreSQL-backed `session` table used for login sessions.

## Authentication routes

- `/signup` creates an account.
- `/login` starts a session.
- `/collection` is protected and shows the signed-in user's empty collection.
- `POST /logout` ends the session.
