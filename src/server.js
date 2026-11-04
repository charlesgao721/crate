const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");
const session = require("express-session");
const connectPgSimple = require("connect-pg-simple");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const {
  authPage,
  collectionPage,
  artistsPage,
  artistDetailPage,
  recordFormPage,
  recordDetailPage,
  recordDeletePage,
} = require("./views");

const requiredEnvironment = ["DATABASE_URL", "SESSION_SECRET"];
for (const name of requiredEnvironment) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const PgSession = connectPgSimple(session);
const sessionCookieName = "crate.sid";
const dummyPasswordHash = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 12);

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(
  session({
    name: sessionCookieName,
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: false,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);
app.use(express.static(path.join(__dirname, "../public"), { fallthrough: true }));

function csrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  return req.session.csrfToken;
}

function validCsrf(req) {
  const submitted = req.body?._csrf;
  const expected = req.session.csrfToken;
  if (typeof submitted !== "string" || typeof expected !== "string") return false;
  const submittedBuffer = Buffer.from(submitted);
  const expectedBuffer = Buffer.from(expected);
  return submittedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(submittedBuffer, expectedBuffer);
}

function requireCsrf(req, res, next) {
  if (!validCsrf(req)) {
    return res.status(403).send("This form has expired. Please go back and try again.");
  }
  next();
}

function requireAuth(req, res, next) {
  if (!Number.isInteger(req.session.userId)) {
    return res.redirect(303, "/login");
  }
  next();
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function validEmail(value) {
  return value.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function renderAuth(res, { mode, csrf, error, email, displayName, status = 200 }) {
  return res.status(status).type("html").send(
    authPage({ mode, csrfToken: csrf, error, email, displayName }),
  );
}

function formText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function recordValues(body = {}) {
  return {
    title: formText(body.title),
    artistName: formText(body.artistName),
    releaseYear: body.releaseYear ? Number(body.releaseYear) : null,
    format: formText(body.format),
    genre: formText(body.genre) || null,
    condition: formText(body.condition) || null,
    pricePaid: body.pricePaid ? body.pricePaid : null,
    purchaseDate: body.purchaseDate || null,
    rating: body.rating ? Number(body.rating) : null,
    notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
  };
}

async function findOrCreateArtist(client, userId, artistName) {
  const result = await client.query(
    `INSERT INTO artists (user_id, name)
     VALUES ($1, $2)
     ON CONFLICT (user_id, (LOWER(name)))
     DO UPDATE SET name = artists.name
     RETURNING id`,
    [userId, artistName],
  );
  return result.rows[0].id;
}

function notFound(res) {
  return res.status(404).type("text").send("not found");
}

function regenerateSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);
      req.session.userId = user.id;
      req.session.displayName = user.display_name;
      req.session.csrfToken = crypto.randomBytes(32).toString("hex");
      req.session.save((saveError) => {
        if (saveError) return reject(saveError);
        resolve();
      });
    });
  });
}

app.get("/", (req, res) => {
  res.redirect(303, req.session.userId ? "/collection" : "/login");
});

app.get("/signup", (req, res) => {
  if (req.session.userId) return res.redirect(303, "/collection");
  renderAuth(res, { mode: "signup", csrf: csrfToken(req) });
});

app.post("/signup", requireCsrf, async (req, res, next) => {
  const displayName = typeof req.body.displayName === "string"
    ? req.body.displayName.trim()
    : "";
  const email = normalizeEmail(req.body.email);
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (displayName.length < 1 || displayName.length > 60) {
    return renderAuth(res, {
      mode: "signup",
      csrf: csrfToken(req),
      error: "Please enter a name between 1 and 60 characters.",
      email,
      displayName,
      status: 400,
    });
  }
  if (!validEmail(email)) {
    return renderAuth(res, {
      mode: "signup",
      csrf: csrfToken(req),
      error: "Enter a valid email address.",
      email,
      displayName,
      status: 400,
    });
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return renderAuth(res, {
      mode: "signup",
      csrf: csrfToken(req),
      error: "Use a password of at least 8 characters and no more than 72 bytes.",
      email,
      displayName,
      status: 400,
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, display_name",
      [email, passwordHash, displayName],
    );
    await regenerateSession(req, result.rows[0]);
    res.redirect(303, "/collection");
  } catch (error) {
    if (error.code === "23505") {
      return renderAuth(res, {
        mode: "signup",
        csrf: csrfToken(req),
        error: "An account with that email already exists. Log in instead.",
        email,
        displayName,
        status: 409,
      });
    }
    next(error);
  }
});

app.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect(303, "/collection");
  renderAuth(res, { mode: "login", csrf: csrfToken(req) });
});

app.post("/login", requireCsrf, async (req, res, next) => {
  const email = normalizeEmail(req.body.email);
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (Buffer.byteLength(password, "utf8") > 72) {
    return renderAuth(res, {
      mode: "login",
      csrf: csrfToken(req),
      error: "That email and password don't match.",
      email,
      status: 401,
    });
  }
  try {
    const result = await pool.query(
      "SELECT id, email, password_hash, display_name FROM users WHERE email = $1",
      [email],
    );
    const user = result.rows[0];
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password || "invalid-password", dummyPasswordHash);
    if (!user || !passwordMatches) {
      return renderAuth(res, {
        mode: "login",
        csrf: csrfToken(req),
        error: "That email and password don't match.",
        email,
        status: 401,
      });
    }
    await regenerateSession(req, user);
    res.redirect(303, "/collection");
  } catch (error) {
    next(error);
  }
});

app.use(requireAuth);

app.get("/collection", async (req, res, next) => {
  try {
    const [userResult, recordsResult] = await Promise.all([
      pool.query(
        "SELECT display_name FROM users WHERE id = $1",
        [req.session.userId],
      ),
      pool.query(
        `SELECT r.id, r.title, r.release_year, r.rating,
                a.id AS artist_id, a.name AS artist_name
         FROM records r
         JOIN artists a ON a.id = r.artist_id AND a.user_id = r.user_id
         WHERE r.user_id = $1
         ORDER BY r.created_at DESC, r.id DESC`,
        [req.session.userId],
      ),
    ]);
    if (!userResult.rowCount) {
      return req.session.destroy(() => res.redirect(303, "/login"));
    }
    res.type("html").send(collectionPage({
      displayName: userResult.rows[0].display_name,
      csrfToken: csrfToken(req),
      records: recordsResult.rows,
    }));
  } catch (error) {
    next(error);
  }
});

app.get("/records/new", async (req, res, next) => {
  try {
    const userResult = await pool.query(
      "SELECT display_name FROM users WHERE id = $1",
      [req.session.userId],
    );
    if (!userResult.rowCount) {
      return req.session.destroy(() => res.redirect(303, "/login"));
    }
    res.type("html").send(recordFormPage({
      mode: "create",
      displayName: userResult.rows[0].display_name,
      csrfToken: csrfToken(req),
    }));
  } catch (error) {
    next(error);
  }
});

app.post("/records", requireCsrf, async (req, res, next) => {
  const values = recordValues(req.body);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const artistId = await findOrCreateArtist(
      client,
      req.session.userId,
      values.artistName,
    );
    const result = await client.query(
      `INSERT INTO records
        (user_id, artist_id, title, release_year, format, genre, condition,
         price_paid, purchase_date, rating, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        req.session.userId,
        artistId,
        values.title,
        values.releaseYear,
        values.format,
        values.genre,
        values.condition,
        values.pricePaid,
        values.purchaseDate,
        values.rating,
        values.notes,
      ],
    );
    await client.query("COMMIT");
    res.redirect(303, `/records/${result.rows[0].id}`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally {
    client.release();
  }
});

app.get("/records/:id/edit", async (req, res, next) => {
  const recordId = Number(req.params.id);
  if (!Number.isSafeInteger(recordId) || recordId < 1) return notFound(res);
  try {
    const [userResult, recordResult] = await Promise.all([
      pool.query(
        "SELECT display_name FROM users WHERE id = $1",
        [req.session.userId],
      ),
      pool.query(
        `SELECT r.id, r.title, r.artist_id, r.release_year, r.format,
                r.genre, r.condition, r.price_paid, r.purchase_date,
                r.rating, r.notes, a.name AS artist_name
         FROM records r
         JOIN artists a ON a.id = r.artist_id AND a.user_id = r.user_id
         WHERE r.id = $1 AND r.user_id = $2`,
        [recordId, req.session.userId],
      ),
    ]);
    if (!userResult.rowCount) {
      return req.session.destroy(() => res.redirect(303, "/login"));
    }
    if (!recordResult.rowCount) return notFound(res);
    res.type("html").send(recordFormPage({
      mode: "edit",
      displayName: userResult.rows[0].display_name,
      csrfToken: csrfToken(req),
      record: recordResult.rows[0],
    }));
  } catch (error) {
    next(error);
  }
});

app.post("/records/:id/edit", requireCsrf, async (req, res, next) => {
  const recordId = Number(req.params.id);
  if (!Number.isSafeInteger(recordId) || recordId < 1) return notFound(res);
  const values = recordValues(req.body);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ownedRecord = await client.query(
      "SELECT id FROM records WHERE id = $1 AND user_id = $2 FOR UPDATE",
      [recordId, req.session.userId],
    );
    if (!ownedRecord.rowCount) {
      await client.query("ROLLBACK");
      return notFound(res);
    }
    const artistId = await findOrCreateArtist(
      client,
      req.session.userId,
      values.artistName,
    );
    await client.query(
      `UPDATE records
       SET artist_id = $1, title = $2, release_year = $3, format = $4,
           genre = $5, condition = $6, price_paid = $7, purchase_date = $8,
           rating = $9, notes = $10
       WHERE id = $11 AND user_id = $12`,
      [
        artistId,
        values.title,
        values.releaseYear,
        values.format,
        values.genre,
        values.condition,
        values.pricePaid,
        values.purchaseDate,
        values.rating,
        values.notes,
        recordId,
        req.session.userId,
      ],
    );
    await client.query("COMMIT");
    res.redirect(303, `/records/${recordId}`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally {
    client.release();
  }
});

app.get("/records/:id/delete", async (req, res, next) => {
  const recordId = Number(req.params.id);
  if (!Number.isSafeInteger(recordId) || recordId < 1) return notFound(res);
  try {
    const [userResult, recordResult] = await Promise.all([
      pool.query(
        "SELECT display_name FROM users WHERE id = $1",
        [req.session.userId],
      ),
      pool.query(
        "SELECT id, title FROM records WHERE id = $1 AND user_id = $2",
        [recordId, req.session.userId],
      ),
    ]);
    if (!userResult.rowCount) {
      return req.session.destroy(() => res.redirect(303, "/login"));
    }
    if (!recordResult.rowCount) return notFound(res);
    res.type("html").send(recordDeletePage({
      displayName: userResult.rows[0].display_name,
      csrfToken: csrfToken(req),
      record: recordResult.rows[0],
    }));
  } catch (error) {
    next(error);
  }
});

app.post("/records/:id/delete", requireCsrf, async (req, res, next) => {
  const recordId = Number(req.params.id);
  if (!Number.isSafeInteger(recordId) || recordId < 1) return notFound(res);
  try {
    const result = await pool.query(
      "DELETE FROM records WHERE id = $1 AND user_id = $2 RETURNING id",
      [recordId, req.session.userId],
    );
    if (!result.rowCount) return notFound(res);
    res.redirect(303, "/collection");
  } catch (error) {
    next(error);
  }
});

app.get("/records/:id", async (req, res, next) => {
  const recordId = Number(req.params.id);
  if (!Number.isSafeInteger(recordId) || recordId < 1) return notFound(res);
  try {
    const [userResult, recordResult] = await Promise.all([
      pool.query(
        "SELECT display_name FROM users WHERE id = $1",
        [req.session.userId],
      ),
      pool.query(
        `SELECT r.id, r.title, r.release_year, r.format, r.genre,
                r.condition, r.price_paid, r.purchase_date, r.rating,
                r.notes, r.created_at, a.id AS artist_id,
                a.name AS artist_name
         FROM records r
         JOIN artists a ON a.id = r.artist_id AND a.user_id = r.user_id
         WHERE r.id = $1 AND r.user_id = $2`,
        [recordId, req.session.userId],
      ),
    ]);
    if (!userResult.rowCount) {
      return req.session.destroy(() => res.redirect(303, "/login"));
    }
    if (!recordResult.rowCount) return notFound(res);
    res.type("html").send(recordDetailPage({
      displayName: userResult.rows[0].display_name,
      csrfToken: csrfToken(req),
      record: recordResult.rows[0],
    }));
  } catch (error) {
    next(error);
  }
});

app.get("/artists", async (req, res, next) => {
  try {
    const [userResult, artistsResult] = await Promise.all([
      pool.query(
        "SELECT display_name FROM users WHERE id = $1",
        [req.session.userId],
      ),
      pool.query(
        "SELECT id, name, country FROM artists WHERE user_id = $1 ORDER BY name ASC, id ASC",
        [req.session.userId],
      ),
    ]);
    if (!userResult.rowCount) {
      return req.session.destroy(() => res.redirect(303, "/login"));
    }
    res.type("html").send(artistsPage({
      displayName: userResult.rows[0].display_name,
      csrfToken: csrfToken(req),
      artists: artistsResult.rows,
    }));
  } catch (error) {
    next(error);
  }
});

app.get("/artists/:id", async (req, res, next) => {
  const artistId = Number(req.params.id);
  if (!Number.isSafeInteger(artistId) || artistId < 1) {
    return res.status(404).type("text").send("not found");
  }

  try {
    const [userResult, artistResult] = await Promise.all([
      pool.query(
        "SELECT display_name FROM users WHERE id = $1",
        [req.session.userId],
      ),
      pool.query(
        "SELECT id, name, country FROM artists WHERE id = $1 AND user_id = $2",
        [artistId, req.session.userId],
      ),
    ]);
    if (!userResult.rowCount) {
      return req.session.destroy(() => res.redirect(303, "/login"));
    }
    if (!artistResult.rowCount) {
      return res.status(404).type("text").send("not found");
    }

    const recordsResult = await pool.query(
      `SELECT id, title, release_year, format, genre, condition
       FROM records
       WHERE user_id = $1 AND artist_id = $2
       ORDER BY created_at DESC, id DESC`,
      [req.session.userId, artistId],
    );
    res.type("html").send(artistDetailPage({
      displayName: userResult.rows[0].display_name,
      csrfToken: csrfToken(req),
      artist: artistResult.rows[0],
      records: recordsResult.rows,
    }));
  } catch (error) {
    next(error);
  }
});

app.post("/logout", requireCsrf, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie(sessionCookieName, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.redirect(303, "/login");
  });
});

app.use((req, res) => {
  res.status(404).type("text").send("Page not found.");
});

app.use((error, req, res, next) => {
  console.error("Request failed:", error);
  if (res.headersSent) return next(error);
  res.status(500).type("text").send("Something went wrong. Please try again.");
});

const port = Number(process.env.PORT || 5000);
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Crate is listening on port ${port}`);
});

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
