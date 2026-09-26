import { NextResponse, type NextRequest } from "next/server";

import { attachSession, callWithSession, failure, failureFrom, readContext } from "@/lib/api/session";
import { parseSubscription } from "@/lib/billing/subscription";

export async function GET(request: NextRequest) {
  const context = readContext(request);

  try {
    const { data, tokens } = await callWithSession<unknown>(context, {
      path: "/api/organizations/current/subscription",
    });

    const view = parseSubscription(data);

    if (!view) {
      return failure("network");
    }

    const response = NextResponse.json({ ok: true, subscription: view });

    // Токен мог обновиться по пути — положить его обратно может только ручка.
    return tokens ? attachSession(response, tokens) : response;
  } catch (error) {
    return failureFrom(error);
  }
}
