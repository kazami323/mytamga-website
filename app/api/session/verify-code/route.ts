import { NextResponse, type NextRequest } from "next/server";

import { isSameOrigin } from "@/lib/api/origin";
import { toUzPhone, toVerificationCode } from "@/lib/api/phone";
import { callApi } from "@/lib/api/server";
import {
  attachDevice,
  attachSession,
  failure,
  failureFrom,
  readContext,
  type SessionTokens,
} from "@/lib/api/session";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return failure("network");
  }

  const body = (await request.json().catch(() => null)) as
    | { phone?: unknown; code?: unknown }
    | null;

  const phone = toUzPhone(String(body?.phone ?? ""));
  const code = toVerificationCode(String(body?.code ?? ""));

  if (!phone) {
    return failure("phoneInvalid");
  }

  // API требует ровно шесть цифр: отправив пять, мы получили бы 400 и
  // показали человеку сообщение не про код.
  if (!code) {
    return failure("codeInvalid");
  }

  const context = readContext(request);

  try {
    const tokens = await callApi<SessionTokens>({
      path: "/api/auth/verify-code",
      method: "POST",
      body: { phone, code },
      deviceId: context.deviceId,
      clientIp: context.clientIp,
      userAgent: context.userAgent,
    });

    if (!tokens?.accessToken || !tokens?.refreshToken) {
      return attachDevice(failure("network"), context);
    }

    // Наружу уходит только признак успеха: ни один токен браузеру не виден.
    return attachDevice(
      attachSession(NextResponse.json({ ok: true }), tokens),
      context,
    );
  } catch (error) {
    return attachDevice(failureFrom(error, "codeInvalid"), context);
  }
}
