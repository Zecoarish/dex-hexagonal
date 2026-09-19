import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{ action: string }>;
  }
) {
  const { action } = await context.params;

  try {
    const { env } = getCloudflareContext();
    const DB = env.DB;
    const ADMIN_KEY = env.ADMIN_KEY;

    const providedKey =
      req.headers.get("x-admin-key");

    if (
      !ADMIN_KEY ||
      providedKey !== ADMIN_KEY
    ) {
      return json(
        { error: "Unauthorized." },
        401
      );
    }

    if (!DB) {
      return json(
        {
          error:
            "Database binding DB was not found.",
        },
        500
      );
    }

    if (action === "waitlist") {
      const result = await DB.prepare(`
        SELECT
          id,
          email,
          status,
          created_at
        FROM waitlist_requests
        ORDER BY id DESC
      `).all();

      return json({
        success: true,
        data: result.results,
      });
    }

    return json(
      {
        error:
          "Unknown admin action.",
      },
      404
    );
  } catch (error) {
    console.error(
      "ADMIN ERROR:",
      error
    );

    return json(
      {
        error:
          "Internal server error.",
      },
      500
    );
  }
                                      }
