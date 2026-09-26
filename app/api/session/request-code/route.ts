import { NextResponse, type NextRequest } from "next/server";

import { isSameOrigin } from "@/lib/api/origin";
import { toUzPhone } from "@/lib/api/phone";
import { callApi } from "@/lib/api/server";
import { attachDevice, failure, failureFrom, readContext } from "@/lib/api/session";
import { createThrottle } from "@/lib/api/throttle";

// Наш лимит — от двойного нажатия, не вместо серверного. Живёт в памяти
// процесса: на одной машине с API этого достаточно, а переживать перезапуск
// такому счётчику незачем.
const throttle = createThrottle(30_000);

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return failure("network");
  }

  const body = (await request.json().catch(() => null)) as { phone?: unknown } | null;
  const phone = toUzPhone(String(body?.phone ?? ""));

  if (!phone) {
    return failure("phoneInvalid");
  }

  const context = readContext(request);
  const gate = throttle.check(phone, Date.now());

  if (!gate.allowed) {
    return failure("rate", { retryAfter: Math.ceil(gate.retryAfterMs / 1000) });
  }

  try {
    await callApi({
      path: "/api/auth/send-code",
      method: "POST",
      body: { phone },
      deviceId: context.deviceId,
      clientIp: context.clientIp,
      userAgent: context.userAgent,
    });
  } catch (error) {
    return attachDevice(failureFrom(error), context);
  }

  return attachDevice(NextResponse.json({ ok: true }), context);
}
