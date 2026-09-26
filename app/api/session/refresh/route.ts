import { NextResponse, type NextRequest } from "next/server";

import { isSameOrigin } from "@/lib/api/origin";
import { callApi } from "@/lib/api/server";
import {
  attachSession,
  clearSession,
  failure,
  failureFrom,
  readContext,
  type SessionTokens,
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
    const tokens = await callApi<SessionTokens>({
      path: "/api/auth/refresh",
      method: "POST",
      body: { refreshToken: context.refreshToken },
      deviceId: context.deviceId,
      clientIp: context.clientIp,
      userAgent: context.userAgent,
    });

    if (!tokens?.accessToken) {
      return clearSession(failure("signedOut"));
    }

    return attachSession(NextResponse.json({ ok: true }), tokens);
  } catch (error) {
    // Refresh-токен мёртв — держать его в куке незачем.
    return clearSession(failureFrom(error));
  }
}
