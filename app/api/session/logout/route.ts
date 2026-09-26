import { NextResponse, type NextRequest } from "next/server";

import { isSameOrigin } from "@/lib/api/origin";
import { callApi } from "@/lib/api/server";
import { clearSession, failure, readContext } from "@/lib/api/session";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return failure("network");
  }

  const context = readContext(request);

  if (context.accessToken) {
    // Сессия на сервере закрывается по возможности, но куки снимаем в любом
    // случае: выход не должен зависеть от доступности API.
    await callApi({
      path: "/api/auth/logout",
      method: "POST",
      body: { refreshToken: context.refreshToken },
      accessToken: context.accessToken,
      deviceId: context.deviceId,
      clientIp: context.clientIp,
      userAgent: context.userAgent,
    }).catch(() => null);
  }

  return clearSession(NextResponse.json({ ok: true }));
}
