"use strict";

require("dotenv").config({ quiet: true });

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const { promisify } = require("node:util");

const app = express();
const requestedPort = Number(process.env.PORT);
const port = Number.isInteger(requestedPort) && requestedPort > 0 && requestedPort <= 65535
  ? requestedPort
  : 3000;
if (process.env.PORT && port === 3000 && requestedPort !== 3000) {
  console.warn("Invalid PORT value; using port 3000.");
}
const databasePath = path.resolve(process.env.DATABASE_PATH || path.join(__dirname, "data", "anaf.sqlite"));
const sessionDuration = 7 * 24 * 60 * 60 * 1000;
const cookieName = "anaf_session";
const scrypt = promisify(crypto.scrypt);
const collections = [
  "products", "Purchase", "Sale", "Expense", "Income", "Supplier", "Client", "Stock Transfer",
  "Damage", "Commitment", "Loan", "Banking", "Fixed Assets", "Investment", "Cash Transfer",
  "Employee", "Salary", "Branches", "Users", "Roles"
];

fs.mkdirSync(path.dirname(databasePath), { recursive: true });
let database;

app.disable("x-powered-by");
app.use("/api", (request, response, next) => {
  const origin = request.get("origin");
  if (!origin) return next();
  if (!/^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(origin)) {
    return sendError(response, 403, "Cross-origin requests are only allowed from this computer.");
  }
  response.set("Access-Control-Allow-Origin", origin);
  response.set("Access-Control-Allow-Credentials", "true");
  response.set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");
  response.vary("Origin");
  if (request.method === "OPTIONS") return response.status(204).end();
  next();
});
app.use(express.json({ limit: "2mb" }));

function sendError(response, status, message) {
  response.status(status).json({ error: message });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: "Administrator" };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function setSessionCookie(response, token) {
  response.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: sessionDuration,
    path: "/"
  });
}

function requireAuth(request, response, next) {
  const token = request.cookies?.[cookieName];
  if (!token) return sendError(response, 401, "Please log in to continue.");
  const session = database.prepare(`
    SELECT users.id, users.name, users.email
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(hashToken(token), Date.now());
  if (!session) {
    response.clearCookie(cookieName, { httpOnly: true, sameSite: "strict", path: "/" });
    return sendError(response, 401, "Your session has expired. Please log in again.");
  }
  request.user = session;
  next();
}

app.use((request, _response, next) => {
  const cookieHeader = request.headers.cookie || "";
  const cookies = {};
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    try {
      cookies[key] = decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      cookies[key] = "";
    }
  }
  request.cookies = cookies;
  next();
});

async function passwordHash(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derived = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

async function passwordMatches(password, stored) {
  const [algorithm, salt, expectedHex] = String(stored).split(":");
  if (algorithm !== "scrypt" || !salt || !/^[a-f0-9]{128}$/i.test(expectedHex || "")) return false;
  const actual = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(actual, Buffer.from(expectedHex, "hex"));
}

app.post("/api/auth/register", async (request, response) => {
  const name = typeof request.body?.name === "string" ? request.body.name.trim() : "";
  const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const password = typeof request.body?.password === "string" ? request.body.password : "";
  if (name.length < 2 || name.length > 100) return sendError(response, 400, "Enter a name between 2 and 100 characters.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return sendError(response, 400, "Enter a valid email address.");
  if (password.length < 10 || password.length > 200) return sendError(response, 400, "Password must be between 10 and 200 characters.");
  try {
    const id = crypto.randomUUID();
    const encodedPassword = await passwordHash(password);
    const token = crypto.randomBytes(32).toString("base64url");
    const user = database.transaction(() => {
      database.prepare("INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")
        .run(id, name, email, encodedPassword, Date.now());
      database.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
        .run(hashToken(token), id, Date.now() + sessionDuration);
      return database.prepare("SELECT id, name, email FROM users WHERE id = ?").get(id);
    })();
    setSessionCookie(response, token);
    response.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE" || /UNIQUE constraint failed: users\.email/i.test(error.message || "")) {
      return sendError(response, 409, "An account with that email already exists.");
    }
    console.error("Account registration failed:", error);
    sendError(response, 500, "Could not create your account.");
  }
});

app.post("/api/auth/login", async (request, response) => {
  try {
    const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
    const password = typeof request.body?.password === "string" ? request.body.password : "";
    const user = database.prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?").get(email);
    if (!user || !(await passwordMatches(password, user.password_hash))) {
      return sendError(response, 401, "Email or password is incorrect.");
    }
    const token = crypto.randomBytes(32).toString("base64url");
    database.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
      .run(hashToken(token), user.id, Date.now() + sessionDuration);
    setSessionCookie(response, token);
    response.json({ user: publicUser(user) });
  } catch (error) {
    console.error("Account login failed:", error);
    sendError(response, 500, "Could not log in to your account.");
  }
});

app.post("/api/auth/logout", (request, response) => {
  const token = request.cookies[cookieName];
  if (token) database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  response.clearCookie(cookieName, { httpOnly: true, sameSite: "strict", path: "/" });
  response.status(204).end();
});

app.get("/api/auth/me", requireAuth, (request, response) => {
  response.json({ user: publicUser(request.user) });
});

function emptyState() {
  return {
    ...Object.fromEntries(collections.map((collection) => [collection, []])),
    settings: {
      businessName: "Anaf Poultry Feed (One)",
      currency: "BDT (৳)",
      openingBalance: 0,
      openingBalanceByBranch: {},
      phone: "",
      address: ""
    }
  };
}

app.get("/api/state", requireAuth, (request, response) => {
  const rows = database.prepare("SELECT collection, data FROM records WHERE user_id = ?").all(request.user.id);
  const savedSettings = database.prepare("SELECT data FROM settings WHERE user_id = ?").get(request.user.id);
  const state = emptyState();
  for (const row of rows) state[row.collection].push(JSON.parse(row.data));
  if (savedSettings) state.settings = JSON.parse(savedSettings.data);
  response.json({ state, initialized: Boolean(savedSettings) });
});

app.put("/api/state", requireAuth, (request, response) => {
  const value = request.body?.state;
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      !value.settings || typeof value.settings !== "object" || Array.isArray(value.settings)) {
    return sendError(response, 400, "The submitted business data is invalid.");
  }
  for (const collection of collections) {
    if (!Array.isArray(value[collection])) return sendError(response, 400, `The ${collection} collection must be an array.`);
    for (const record of value[collection]) {
      if (!record || typeof record !== "object" || Array.isArray(record) ||
          typeof record.id !== "string" || record.id.length < 1 || record.id.length > 200) {
        return sendError(response, 400, `Every ${collection} record must have a valid id.`);
      }
    }
  }
  try {
    const saveState = database.transaction(() => {
      database.prepare("DELETE FROM records WHERE user_id = ?").run(request.user.id);
      const insertRecord = database.prepare("INSERT INTO records (user_id, collection, record_id, data) VALUES (?, ?, ?, ?)");
      for (const collection of collections) {
        for (const record of value[collection]) {
          insertRecord.run(request.user.id, collection, record.id, JSON.stringify(record));
        }
      }
      database.prepare(`
        INSERT INTO settings (user_id, data) VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET data = excluded.data
      `).run(request.user.id, JSON.stringify(value.settings));
    });
    saveState();
    response.json({ saved: true });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" || /UNIQUE constraint failed: records\./i.test(error.message || "")) {
      return sendError(response, 400, "Record ids must be unique within each collection.");
    }
    console.error("Business data save failed:", error);
    sendError(response, 500, "Could not save business data.");
  }
});

app.get("/", (_request, response) => {
  response.sendFile(path.join(__dirname, "index.html"));
});

app.get(["/script.js", "/style.css"], express.static(__dirname, { index: false }));

app.get("*", (request, response) => {
  if (request.path.startsWith("/api/")) return sendError(response, 404, "API endpoint not found.");
  response.sendFile(path.join(__dirname, "index.html"));
});

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && "body" in error) return sendError(response, 400, "Request body must be valid JSON.");
  if (error.type === "entity.too.large") return sendError(response, 413, "Request body is too large.");
  console.error("Request failed:", error);
  sendError(response, 500, "An unexpected server error occurred.");
});

function createDatabase(sqlDatabase) {
  let transactionDepth = 0;
  const persist = () => {
    const temporaryPath = `${databasePath}.tmp`;
    fs.writeFileSync(temporaryPath, Buffer.from(sqlDatabase.export()));
    fs.renameSync(temporaryPath, databasePath);
  };
  return {
    exec(sql) {
      sqlDatabase.exec(sql);
      if (transactionDepth === 0) persist();
    },
    prepare(sql) {
      return {
        run(...parameters) {
          sqlDatabase.run(sql, parameters);
          const result = { changes: sqlDatabase.getRowsModified() };
          if (transactionDepth === 0) persist();
          return result;
        },
        get(...parameters) {
          const statement = sqlDatabase.prepare(sql);
          try {
            statement.bind(parameters);
            return statement.step() ? statement.getAsObject() : undefined;
          } finally {
            statement.free();
          }
        },
        all(...parameters) {
          const statement = sqlDatabase.prepare(sql);
          const rows = [];
          try {
            statement.bind(parameters);
            while (statement.step()) rows.push(statement.getAsObject());
            return rows;
          } finally {
            statement.free();
          }
        }
      };
    },
    transaction(callback) {
      return (...parameters) => {
        sqlDatabase.run("BEGIN");
        transactionDepth += 1;
        let result;
        try {
          result = callback(...parameters);
          sqlDatabase.run("COMMIT");
        } catch (error) {
          sqlDatabase.run("ROLLBACK");
          throw error;
        } finally {
          transactionDepth -= 1;
        }
        persist();
        return result;
      };
    },
    persist
  };
}

async function startServer() {
  const initializeSqlJs = require("sql.js");
  const SQL = await initializeSqlJs({
    locateFile: (file) => path.join(path.dirname(require.resolve("sql.js")), file)
  });
  const savedDatabase = fs.existsSync(databasePath) ? fs.readFileSync(databasePath) : undefined;
  database = createDatabase(new SQL.Database(savedDatabase));
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS records (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      collection TEXT NOT NULL,
      record_id TEXT NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (user_id, collection, record_id)
    );
    CREATE TABLE IF NOT EXISTS settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
  `);
  const server = await new Promise((resolve, reject) => {
    const listeningServer = app.listen(port, () => {
      listeningServer.removeListener("error", reject);
      console.log(`Anaf Poultry Feed is running at http://localhost:${port}`);
      console.log(`SQLite database: ${databasePath}`);
      resolve(listeningServer);
    });
    listeningServer.once("error", reject);
  });
  server.on("error", (error) => {
    console.error("HTTP server error:", error);
  });
  const cleanupSessions = database.prepare("DELETE FROM sessions WHERE expires_at <= ?");
  setInterval(() => cleanupSessions.run(Date.now()), 60 * 60 * 1000).unref();
}

startServer().catch((error) => {
  console.error("Could not start the application:", error);
  process.exitCode = 1;
});
