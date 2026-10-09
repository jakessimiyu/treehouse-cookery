import { Client } from "pg";
import pkg from "pg/package.json";

export const dynamic = "force-dynamic";

type Variant = { name: string; ssl: boolean | { rejectUnauthorized: boolean } };

const VARIANTS: Variant[] = [
  { name: "ssl: { rejectUnauthorized: false }", ssl: { rejectUnauthorized: false } },
  { name: "ssl: true", ssl: true },
  { name: "ssl: false", ssl: false },
];

async function tryVariant(url: string, v: Variant) {
  const client = new Client({
    connectionString: url,
    ssl: v.ssl,
    connectionTimeoutMillis: 8000,
  });
  let step = "connect";
  try {
    await client.connect();
    step = "query";
    const r = await client.query("select now() as now");
    return { variant: v.name, ok: true, now: r.rows[0].now };
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.error("debug-db variant failed:", v.name, err);
    return { variant: v.name, ok: false, failedAt: step, code: e.code, message: e.message };
  } finally {
    await client.end().catch(() => {});
  }
}

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return Response.json({ ok: false, message: "DATABASE_URL is not set" }, { status: 500 });
  }

  const results = [];
  for (const v of VARIANTS) {
    results.push(await tryVariant(url, v));
  }

  return Response.json({
    pgVersion: (pkg as { version: string }).version,
    runtime: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    results,
  });
}