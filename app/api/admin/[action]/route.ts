import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function checkAuth(req: NextRequest, env: any) {
  const ADMIN_KEY = env.ADMIN_KEY;
  const providedKey = req.headers.get("x-admin-key");
  return Boolean(ADMIN_KEY) && providedKey === ADMIN_KEY;
}

function generateCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ action: string }> }
) {
  const { action } = await context.params;

  try {
    const { env } = getCloudflareContext();
    const DB = env.DB;

    if (!checkAuth(req, env)) {
      return json({ error: "Unauthorized." }, 401);
    }

    if (!DB) {
      return json({ error: "Database binding DB was not found." }, 500);
    }

    if (action === "waitlist") {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS access_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          code TEXT NOT NULL UNIQUE,
          used INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      const result = await DB.prepare(`
        SELECT
          w.id,
          w.email,
          w.status,
          w.created_at,
          ac.code AS access_code
        FROM waitlist_requests w
        LEFT JOIN access_codes ac ON ac.email = w.email
        ORDER BY w.id DESC
      `).all();

      return json({ success: true, data: result.results });
    }

    return json({ error: "Unknown admin action." }, 404);
  } catch (error) {
    console.error("ADMIN ERROR:", error);
    return json({ error: "Internal server error." }, 500);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ action: string }> }
) {
  const { action } = await context.params;

  try {
    const { env } = getCloudflareContext();
    const DB = env.DB;

    if (!checkAuth(req, env)) {
      return json({ error: "Unauthorized." }, 401);
    }

    if (!DB) {
      return json({ error: "Database binding DB was not found." }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const id = Number(body.id);

    if (!id) {
      return json({ error: "Waitlist id is required." }, 400);
    }

    if (action === "approve") {
      const row = await DB.prepare(
        `SELECT id, email FROM waitlist_requests WHERE id = ?`
      )
        .bind(id)
        .first<{ id: number; email: string }>();

      if (!row) {
        return json({ error: "Waitlist entry not found." }, 404);
      }

      await DB.prepare(
        `UPDATE waitlist_requests SET status = 'approved' WHERE id = ?`
      )
        .bind(id)
        .run();

      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS access_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          code TEXT NOT NULL UNIQUE,
          used INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      const existing = await DB.prepare(
        `SELECT code FROM access_codes WHERE email = ? LIMIT 1`
      )
        .bind(row.email)
        .first<{ code: string }>();

      if (existing) {
        return json({ success: true, status: "approved", code: existing.code });
      }

      let code = generateCode();
      let inserted = false;
      for (let i = 0; i < 5 && !inserted; i++) {
        const result = await DB.prepare(
          `INSERT OR IGNORE INTO access_codes (email, code) VALUES (?, ?)`
        )
          .bind(row.email, code)
          .run();

        inserted = (result.meta?.changes ?? 0) > 0;
        if (!inserted) code = generateCode();
      }

      return json({ success: true, status: "approved", code });
    }

    if (action === "reject") {
      await DB.prepare(
        `UPDATE waitlist_requests SET status = 'rejected' WHERE id = ?`
      )
        .bind(id)
        .run();

      return json({ success: true, status: "rejected" });
    }

    return json({ error: "Unknown admin action." }, 404);
  } catch (error) {
    console.error("ADMIN ERROR:", error);
    return json({ error: "Internal server error." }, 500);
  }
          }
