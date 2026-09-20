import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const SESSION_COOKIE = "hexagonal_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
// Cloudflare Workers caps PBKDF2 at 100,000 iterations.
const PBKDF2_ITERATIONS = 100_000;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toB64(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(b64: string) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function pbkdf2(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS },
    key,
    256
  );
  return new Uint8Array(bits);
}

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);
  return { salt: toB64(salt), hash: toB64(hash) };
}

function safeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function verifyPassword(password: string, saltB64: string, hashB64: string) {
  const hash = await pbkdf2(password, fromB64(saltB64));
  return safeEqual(hash, fromB64(hashB64));
}

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

let schemaReady = false;

async function ensureSchema(DB: any) {
  if (schemaReady) return;
  await DB.batch([
    DB.prepare(`
      CREATE TABLE IF NOT EXISTS waitlist_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    DB.prepare(`
      CREATE TABLE IF NOT EXISTS access_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        used INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    DB.prepare(`
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      )
    `),
  ]);
  schemaReady = true;
}

async function startSession(DB: any, email: string, response: NextResponse) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const tokenHash = await sha256Hex(token);
  const now = Math.floor(Date.now() / 1000);

  await DB.prepare(`INSERT INTO sessions (token_hash, email, expires_at) VALUES (?, ?, ?)`)
    .bind(tokenHash, email, now + SESSION_TTL_SECONDS)
    .run();

  await DB.prepare(`DELETE FROM sessions WHERE expires_at < ?`).bind(now).run();

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{ action: string }>;
  }
) {
  const { action } = await context.params;

  try {
    const { env } = getCloudflareContext();
    const DB = env.DB;

    if (!DB) {
      return json({ error: "Database binding DB was not found." }, 500);
    }

    await ensureSchema(DB);

    const body = await req.json().catch(() => ({}));

    // WAITLIST
    if (action === "waitlist") {
      const email = normalizeEmail(String(body.email || ""));

      if (!isValidEmail(email)) {
        return json({ error: "Please enter a valid email address." }, 400);
      }

      await DB.prepare(
        `INSERT OR IGNORE INTO waitlist_requests (email, status) VALUES (?, 'pending')`
      )
        .bind(email)
        .run();

      return json({ success: true, message: "Waitlist request submitted." });
    }

    // REGISTER (one-time access code + create password)
    if (action === "register") {
      const email = normalizeEmail(String(body.email || ""));
      const code = String(body.code || "").trim().toUpperCase();
      const password = String(body.password || "");

      if (!email || !code || !password) {
        return json({ error: "Email, access code and password are required." }, 400);
      }
      if (!isValidEmail(email)) {
        return json({ error: "Please enter a valid email address." }, 400);
      }
      if (password.length < MIN_PASSWORD) {
        return json({ error: `Password must be at least ${MIN_PASSWORD} characters.` }, 400);
      }
      if (password.length > MAX_PASSWORD) {
        return json({ error: `Password must be at most ${MAX_PASSWORD} characters.` }, 400);
      }

      const existingUser = await DB.prepare(`SELECT email FROM users WHERE email = ? LIMIT 1`)
        .bind(email)
        .first();

      if (existingUser) {
        return json({ error: "This email is already registered. Please log in instead." }, 409);
      }

      const row = (await DB.prepare(
        `SELECT id, used FROM access_codes WHERE email = ? AND code = ? LIMIT 1`
      )
        .bind(email, code)
        .first()) as { id: number; used: number } | null;

      // A code that is `used` but has no user row comes from the old flow
      // (code burned on first login, no password set). Let them finish registering.
      if (!row) {
        return json({ error: "Invalid email or access code." }, 401);
      }

      const { salt, hash } = await hashPassword(password);

      try {
        await DB.batch([
          DB.prepare(
            `INSERT INTO users (email, password_hash, password_salt) VALUES (?, ?, ?)`
          ).bind(email, hash, salt),
          DB.prepare(`UPDATE access_codes SET used = 1 WHERE id = ?`).bind(row.id),
        ]);
      } catch {
        return json({ error: "This email is already registered. Please log in instead." }, 409);
      }

      const response = NextResponse.json({ success: true, authenticated: true, email });
      await startSession(DB, email, response);
      return response;
    }

    // LOGIN (email + password only)
    if (action === "login") {
      const email = normalizeEmail(String(body.email || ""));
      const password = String(body.password || "");

      if (!email || !password) {
        return json({ error: "Email and password are required." }, 400);
      }
      if (password.length > MAX_PASSWORD) {
        return json({ error: "Invalid email or password." }, 401);
      }

      const user = (await DB.prepare(
        `SELECT email, password_hash, password_salt FROM users WHERE email = ? LIMIT 1`
      )
        .bind(email)
        .first()) as { email: string; password_hash: string; password_salt: string } | null;

      if (!user) {
        await hashPassword(password);
        return json({ error: "Invalid email or password." }, 401);
      }

      const ok = await verifyPassword(password, user.password_salt, user.password_hash);
      if (!ok) {
        return json({ error: "Invalid email or password." }, 401);
      }

      const response = NextResponse.json({
        success: true,
        authenticated: true,
        email: user.email,
      });
      await startSession(DB, user.email, response);
      return response;
    }

    // LOGOUT
    if (action === "logout") {
      const token = req.cookies.get(SESSION_COOKIE)?.value;
      if (token) {
        await DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`)
          .bind(await sha256Hex(token))
          .run();
      }

      const response = NextResponse.json({ success: true });
      clearSessionCookie(response);
      return response;
    }

    return json({ error: "Unknown auth action." }, 404);
  } catch (error) {
    console.error("AUTH ERROR:", error);
    return json({ error: "Internal server error." }, 500);
  }
}

// SESSION
export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{ action: string }>;
  }
) {
  const { action } = await context.params;

  if (action === "session") {
    try {
      const token = req.cookies.get(SESSION_COOKIE)?.value;
      if (!token) return json({ authenticated: false });

      const { env } = getCloudflareContext();
      const DB = env.DB;
      if (!DB) return json({ authenticated: false });

      await ensureSchema(DB);

      const row = (await DB.prepare(
        `SELECT email, expires_at FROM sessions WHERE token_hash = ? LIMIT 1`
      )
        .bind(await sha256Hex(token))
        .first()) as { email: string; expires_at: number } | null;

      if (!row || row.expires_at < Math.floor(Date.now() / 1000)) {
        const response = NextResponse.json({ authenticated: false });
        clearSessionCookie(response);
        return response;
      }

      return json({ authenticated: true, email: row.email });
    } catch (error) {
      console.error("SESSION ERROR:", error);
      return json({ authenticated: false });
    }
  }

  return json({ error: "Unknown auth action." }, 404);
    }
