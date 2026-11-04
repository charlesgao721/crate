CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT artists_id_user_id_key UNIQUE (id, user_id)
);

CREATE INDEX IF NOT EXISTS artists_user_id_idx ON artists (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS artists_user_name_lower_idx
  ON artists (user_id, LOWER(name));

CREATE TABLE IF NOT EXISTS records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  release_year INTEGER CHECK (release_year IS NULL OR release_year >= 1900),
  format TEXT NOT NULL,
  genre TEXT,
  condition TEXT,
  price_paid NUMERIC(10, 2),
  purchase_date DATE,
  rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT records_artist_owner_fkey
    FOREIGN KEY (artist_id, user_id)
    REFERENCES artists (id, user_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS records_user_id_idx ON records (user_id);
CREATE INDEX IF NOT EXISTS records_artist_user_idx ON records (artist_id, user_id);

CREATE TABLE IF NOT EXISTS "session" (
  "sid" VARCHAR NOT NULL COLLATE "default",
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
