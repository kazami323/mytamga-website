import { NextResponse, type NextRequest } from "next/server";

import { authorizedCall, type CallerContext, type SessionTokens } from "./authorized-call";
import { COOKIE, MAX_AGE, clearedCookieOptions, cookieOptions } from "./cookies";
import { ApiError, errorCodeFor, type BillingErrorCode } from "./errors";
import { clientIpFrom } from "./forwarded";
import { retryAfterSeconds } from "./retry";
import type { ApiCall } from "./server";

export type { SessionTokens };

export type RequestContext = CallerContext & {
  deviceId: string;
  isNewDevice: boolean;
};

/** Всё, что нужно знать о запросе, одним чтением. */
export function readContext(request: NextRequest): RequestContext {
  const existingDevice = request.cookies.get(COOKIE.device)?.value;

  return {
    accessToken: request.cookies.get(COOKIE.access)?.value,
    refreshToken: request.cookies.get(COOKIE.refresh)?.value,
    // Идентификатор устройства выпускает сервер: localStorage для этого не
    // нужен, а без заголовка каждый вход считался бы новым устройством.
    deviceId: existingDevice || crypto.randomUUID(),
    isNewDevice: !existingDevice,
    clientIp: clientIpFrom(
      request.headers.get("x-forwarded-for"),
      request.headers.get("x-real-ip"),
    ),
    userAgent: request.headers.get("user-agent"),
  };
}

export function attachDevice(
  response: NextResponse,
  context: RequestContext,
): NextResponse {
  if (context.isNewDevice) {
    response.cookies.set(COOKIE.device, context.deviceId, cookieOptions(MAX_AGE.device));
  }
  return response;
}

export function attachSession(
  response: NextResponse,
  tokens: SessionTokens,
): NextResponse {
  response.cookies.set(COOKIE.access, tokens.accessToken, cookieOptions(MAX_AGE.access));
  response.cookies.set(COOKIE.refresh, tokens.refreshToken, cookieOptions(MAX_AGE.refresh));
  return response;
}

export function clearSession(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE.access, "", clearedCookieOptions());
  response.cookies.set(COOKIE.refresh, "", clearedCookieOptions());
  return response;
}

export function failure(code: BillingErrorCode, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, code, ...extra }, { status: 200 });
}

/**
 * Ошибка API в ответ, который страница сможет перевести. Статус наших ручек
 * всегда 200: код ошибки лежит в теле, и клиенту не нужно разбирать два
 * разных языка отказов.
 */
export function failureFrom(
  error: unknown,
  badRequestCode?: BillingErrorCode,
  conflictCode?: BillingErrorCode,
) {
  if (!(error instanceof ApiError)) {
    return failure("network");
  }

  const code = errorCodeFor(error.status, badRequestCode, conflictCode);

  if (code === "rate") {
    return failure(code, { retryAfter: retryAfterSeconds(error.body) });
  }

  return failure(code);
}

/**
 * Запрос от имени человека, с обновлением токена по пути. Сама логика
 * «401 → обновись → повтори один раз» живёт в `authorized-call.ts`, без
 * Next-импортов: только так её можно покрыть тестом.
 */
export function callWithSession<T>(
  context: RequestContext,
  call: Omit<ApiCall, "accessToken" | "deviceId" | "clientIp" | "userAgent">,
) {
  return authorizedCall<T>(context, call);
}
