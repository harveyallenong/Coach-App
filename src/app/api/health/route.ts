import { connection } from "next/server";

import { checkHealth } from "@/server/services/health.service";

export async function GET() {
  await connection();
  const health = await checkHealth();
  return Response.json(health, {
    status: health.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
