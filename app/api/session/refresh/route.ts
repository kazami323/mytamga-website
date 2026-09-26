import { NextResponse, type NextRequest } from "next/server";

import { isSameOrigin } from "@/lib/api/origin";
import { refreshSession } from "@/lib/api/authorized-call";
import {
  attachSession,
  clearSession,
  failure,
  failureFrom,
  readContext,
} from "@/lib/api/session";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return failure("network");
  }

  const context = readContext(request);

  if (!context.refreshToken) {
    return clearSession(failure("signedOut"));
  }

  try {
    // Единичное обновление на процесс: два параллельных обновления одним
    // токеном дали бы проигравшему 401 по живой сессии, и этот же обработчик
    // снёс бы куки, которые победитель только что выдал.
    const tokens = await refreshSession(context);

    return attachSession(NextResponse.json({ ok: true }), tokens);
  } catch (error) {
    // Refresh-токен мёртв — держать его в куке незачем.
    return clearSession(failureFrom(error, "signedOut"));
  }
}
