const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const path = require("node:path");
const { once } = require("node:events");
const { createServer } = require("node:net");
const test = require("node:test");
const { Pool } = require("pg");

class CookieClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookie = "";
    this.sessionIds = new Set();
  }

  async request(route, options = {}) {
    const headers = new Headers(options.headers || {});
    if (this.cookie) headers.set("cookie", this.cookie);

    const response = await fetch(`${this.baseUrl}${route}`, {
      ...options,
      headers,
      redirect: "manual",
    });

    const cookies = response.headers.getSetCookie
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter(Boolean);
    for (const cookie of cookies) {
      const pair = cookie.split(";", 1)[0];
      const separator = pair.indexOf("=");
      if (separator < 0 || pair.slice(0, separator) !== "crate.sid") continue;
      this.cookie = pair;

      const encodedValue = pair.slice(separator + 1);
      if (!encodedValue) continue;
      const decodedValue = decodeURIComponent(encodedValue);
      const sessionId = decodedValue.startsWith("s:")
        ? decodedValue.slice(2).split(".", 1)[0]
        : decodedValue.split(".", 1)[0];
      if (sessionId) this.sessionIds.add(sessionId);
    }
    return response;
  }

  post(route, values) {
    return this.request(route, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(values),
    });
  }
}

function csrfFrom(html) {
  const match = html.match(/name="_csrf" value="([^"]+)"/);
  assert.ok(match, "page contains a CSRF token");
  return match[1];
}

async function getFreePort() {
  const socket = createServer();
  await new Promise((resolve, reject) => {
    socket.once("error", reject);
    socket.listen(0, "127.0.0.1", resolve);
  });
  const { port } = socket.address();
  await new Promise((resolve, reject) => socket.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function startTestServer(port) {
  const child = spawn(process.execPath, [path.join(__dirname, "../src/server.js")], {
    env: { ...process.env, NODE_ENV: "test", PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });
  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Test server exited before starting.\n${output}`);
    }
    try {
      const response = await fetch(`${baseUrl}/login`);
      if (response.status === 200) return { child, baseUrl, output: () => output };
      output += `Unexpected startup response: ${response.status}\n`;
    } catch {
      // The server is still binding its port.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  child.kill("SIGTERM");
  throw new Error(`Timed out waiting for the test server.\n${output}`);
}

async function stopTestServer(child) {
  if (child.exitCode !== null) return;
  const exited = once(child, "exit");
  child.kill("SIGTERM");
  await Promise.race([
    exited,
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

async function signUp(client, { displayName, email, password }) {
  const page = await client.request("/signup");
  assert.equal(page.status, 200);
  const response = await client.post("/signup", {
    _csrf: csrfFrom(await page.text()),
    displayName,
    email,
    password,
  });
  assert.equal(response.status, 303, "sign-up succeeds");
}

test("a user's collection and record details exclude another user's records", {
  timeout: 30_000,
}, async () => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL must point to the development database");
  assert.notEqual(process.env.NODE_ENV, "production", "refusing to seed data in production");

  const suffix = crypto.randomUUID();
  const userA = {
    displayName: `Isolation Test A ${suffix.slice(0, 8)}`,
    email: `crate-isolation-a-${suffix}@example.test`,
    password: `test-password-${suffix}`,
  };
  const userB = {
    displayName: `Isolation Test B ${suffix.slice(0, 8)}`,
    email: `crate-isolation-b-${suffix}@example.test`,
    password: userA.password,
  };
  const ownerClient = new CookieClient("");
  const otherClient = new CookieClient("");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let child;

  try {
    const port = await getFreePort();
    const server = await startTestServer(port);
    child = server.child;
    ownerClient.baseUrl = server.baseUrl;
    otherClient.baseUrl = server.baseUrl;

    await signUp(ownerClient, userA);
    const newRecordPage = await ownerClient.request("/records/new");
    assert.equal(newRecordPage.status, 200);
    const createRecord = await ownerClient.post("/records", {
      _csrf: csrfFrom(await newRecordPage.text()),
      title: "Kind of Blue",
      artistName: "Miles Davis",
      releaseYear: "1959",
      format: "LP",
      genre: "Jazz",
      condition: "VG+",
      pricePaid: "30.00",
      purchaseDate: "",
      rating: "5",
      notes: "",
    });
    assert.equal(createRecord.status, 303, "User A adds Kind of Blue");
    const location = createRecord.headers.get("location");
    assert.match(location, /^\/records\/\d+$/);

    await signUp(otherClient, userB);
    const loggedInPage = await otherClient.request("/collection");
    const logout = await otherClient.post("/logout", {
      _csrf: csrfFrom(await loggedInPage.text()),
    });
    assert.equal(logout.status, 303, "User B logs out before testing login");

    const loginPage = await otherClient.request("/login");
    const login = await otherClient.post("/login", {
      _csrf: csrfFrom(await loginPage.text()),
      email: userB.email,
      password: userB.password,
    });
    assert.equal(login.status, 303, "User B logs in");

    const collection = await otherClient.request("/collection");
    assert.equal(collection.status, 200);
    const collectionHtml = await collection.text();
    assert.ok(
      !collectionHtml.includes("Kind of Blue"),
      "User B's collection must not include User A's record",
    );

    const detail = await otherClient.request(location);
    assert.equal(detail.status, 404);
    assert.equal(await detail.text(), "not found");
  } finally {
    try {
      const sessionIds = [...ownerClient.sessionIds, ...otherClient.sessionIds];
      if (sessionIds.length) {
        await pool.query(
          "DELETE FROM session WHERE sid = ANY($1::varchar[])",
          [sessionIds],
        );
      }
      await pool.query(
        "DELETE FROM users WHERE email = ANY($1::text[])",
        [[userA.email, userB.email]],
      );
    } finally {
      if (child) await stopTestServer(child);
      await pool.end();
    }
  }
});
