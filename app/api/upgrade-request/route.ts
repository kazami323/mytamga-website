import { NextResponse, type NextRequest } from "next/server";

import { isSameOrigin } from "@/lib/api/origin";
import { attachSession, callWithSession, failure, failureFrom, readContext } from "@/lib/api/session";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return failure("network");
  }

  const body = (await request.json().catch(() => null)) as
    | { planKey?: unknown; note?: unknown }
    | null;

  const planKey = String(body?.planKey ?? "");

  if (!planKey) {
    return failure("requestOnly");
  }

  const context = readContext(request);

  try {
    const { tokens } = await callWithSession<unknown>(context, {
      path: "/api/organizations/current/subscription/upgrade-requests",
      method: "POST",
      // Поле называется requestedPlanKey, а не planKey: перепутать — значит
      // молча создавать пустые заявки.
      body: {
        requestedPlanKey: planKey,
        note: String(body?.note ?? "").slice(0, 2000) || undefined,
      },
    });

    const response = NextResponse.json({ ok: true });

    return tokens ? attachSession(response, tokens) : response;
  } catch (error) {
    return failureFrom(error);
  }
}
