const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");
const session = require("express-session");
const connectPgSimple = require("connect-pg-simple");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const { authPage, collectionPage } = require("./views");

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
    const result = await pool.query(
      "SELECT display_name FROM users WHERE id = $1",
      [req.session.userId],
    );
    if (!result.rowCount) {
      return req.session.destroy(() => res.redirect(303, "/login"));
    }
    res.type("html").send(collectionPage({
      displayName: result.rows[0].display_name,
      csrfToken: csrfToken(req),
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
