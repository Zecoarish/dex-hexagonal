import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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
      return json(
        {
          error: "Database binding DB was not found.",
        },
        500
      );
    }

    const body = await req.json().catch(() => ({}));

    // =========================
    // WAITLIST
    // =========================

    if (action === "waitlist") {
      const email = normalizeEmail(
        String(body.email || "")
      );

      if (!email || !email.includes("@")) {
        return json(
          {
            error: "Please enter a valid email address.",
          },
          400
        );
      }

      await DB.prepare(
        `
        CREATE TABLE IF NOT EXISTS waitlist_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        `
      ).run();

      await DB.prepare(
        `
        INSERT OR IGNORE INTO waitlist_requests
        (email, status)
        VALUES (?, 'pending')
        `
      )
        .bind(email)
        .run();

      return json({
        success: true,
        message: "Waitlist request submitted.",
      });
    }

    // =========================
    // LOGIN
    // =========================

    if (action === "login") {
      const email = normalizeEmail(
        String(body.email || "")
      );

      const code = String(body.code || "")
        .trim()
        .toUpperCase();

      if (!email || !code) {
        return json(
          {
            error:
              "Email and access code are required.",
          },
          400
        );
      }

      await DB.prepare(
        `
        CREATE TABLE IF NOT EXISTS access_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          code TEXT NOT NULL UNIQUE,
          used INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        `
      ).run();

      const result = await DB.prepare(
        `
        SELECT id, email, code, used
        FROM access_codes
        WHERE email = ? AND code = ?
        LIMIT 1
        `
      )
        .bind(email, code)
        .first<{
          id: number;
          email: string;
          code: string;
          used: number;
        }>();

      if (!result) {
        return json(
          {
            error: "Invalid email or access code.",
          },
          401
        );
      }

      if (result.used) {
        return json(
          {
            error:
              "This access code has already been used.",
          },
          401
        );
      }

      await DB.prepare(
        `
        UPDATE access_codes
        SET used = 1
        WHERE id = ?
        `
      )
        .bind(result.id)
        .run();

      const response = NextResponse.json({
        success: true,
        authenticated: true,
        emailMasked: email,
      });

      response.cookies.set(
        "hexagonal_session",
        crypto.randomUUID(),
        {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        }
      );

      return response;
    }

    // =========================
    // LOGOUT
    // =========================

    if (action === "logout") {
      const response = NextResponse.json({
        success: true,
      });

      response.cookies.set(
        "hexagonal_session",
        "",
        {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        }
      );

      return response;
    }

    return json(
      {
        error: "Unknown auth action.",
      },
      404
    );
  } catch (error) {
    console.error("AUTH ERROR:", error);

    return json(
      {
        error: "Internal server error.",
      },
      500
    );
  }
}

// =========================
// SESSION
// =========================

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{ action: string }>;
  }
) {
  const { action } = await context.params;

  if (action === "session") {
    const session = req.cookies.get(
      "hexagonal_session"
    );

    if (!session?.value) {
      return json({
        authenticated: false,
      });
    }

    return json({
      authenticated: true,
      emailMasked: "Authenticated user",
    });
  }

  return json(
    {
      error: "Unknown auth action.",
    },
    404
  );
}
