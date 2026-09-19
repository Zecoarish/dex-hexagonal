import { getCloudflareContext } from "@opennextjs/cloudflare";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  const env = getCloudflareContext().env as any;
  const db = env.DB;

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const isAdmin = () =>
    !!env.ADMIN_PASSWORD && body.password === env.ADMIN_PASSWORD;

  // Daftar waitlist
  if (action === "waitlist") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Email tidak valid" }, 400);
    }
    await db
      .prepare("INSERT OR IGNORE INTO waitlist (email) VALUES (?)")
      .bind(email)
      .run();
    return json({ ok: true });
  }

  // Admin: lihat daftar
  if (action === "admin-list") {
    if (!isAdmin()) return json({ error: "Password salah" }, 401);
    const { results } = await db
      .prepare("SELECT id, email, status, code FROM waitlist ORDER BY id DESC")
      .all();
    return json({ ok: true, list: results });
  }

  // Admin: approve + kirim email
  if (action === "approve") {
    if (!isAdmin()) return json({ error: "Password salah" }, 401);
    const row: any = await db
      .prepare("SELECT * FROM waitlist WHERE id = ?")
      .bind(body.id)
      .first();
    if (!row) return json({ error: "Data tidak ada" }, 404);

    const code = row.code || makeCode();
    await db
      .prepare("UPDATE waitlist SET status = 'Approved', code = ? WHERE id = ?")
      .bind(code, row.id)
      .run();

    let emailSent = false;
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Hexagonal <onboarding@resend.dev>",
          to: [row.email],
          subject: "Kode akses Hexagonal Testnet",
          html: `<p>Kode akses lo:</p><h2>${code}</h2><p>Masukin kode ini bareng email lo di halaman "Sudah punya kode akses?".</p>`,
        }),
      });
      emailSent = r.ok;
    } catch {}
    return json({ ok: true, code, emailSent });
  }

  // User: cek kode
  if (action === "unlock") {
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.code || "").trim().toUpperCase();
    const row = await db
      .prepare(
        "SELECT id FROM waitlist WHERE email = ? AND code = ? AND status = 'Approved'"
      )
      .bind(email, code)
      .first();
    return row ? json({ ok: true }) : json({ error: "Email atau kode salah" }, 401);
  }

  return json({ error: "Not found" }, 404);
  }
