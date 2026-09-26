import { ApiError } from "./errors.ts";
import { callApi, type ApiCall } from "./server.ts";

export type SessionTokens = { accessToken: string; refreshToken: string };

export type CallerContext = {
  accessToken?: string;
  refreshToken?: string;
  deviceId: string;
  clientIp: string | null;
  userAgent: string | null;
};

/** Подставляется в тестах: настоящая логика обновления иначе непроверяема. */
export type Caller = <R>(call: ApiCall) => Promise<R>;

const liveCaller: Caller = (call) => callApi(call);

/**
 * Запрос от имени человека. Access-токен живёт пятнадцать минут, поэтому на 401
 * обновляемся по refresh-токену и повторяем один раз — ровно один, иначе мёртвый
 * refresh увёл бы нас в цикл.
 *
 * Обновлённые токены возвращаются наружу, а не пишутся в куки здесь: переписать
 * куки может только ручка, у неё есть ответ.
 */
export async function authorizedCall<T>(
  context: CallerContext,
  call: Omit<ApiCall, "accessToken" | "deviceId" | "clientIp" | "userAgent">,
  callImpl: Caller = liveCaller,
): Promise<{ data: T; tokens?: SessionTokens }> {
  const base = {
    ...call,
    deviceId: context.deviceId,
    clientIp: context.clientIp,
    userAgent: context.userAgent,
  };

  // Ни одного токена — в сеть не идём: ответ известен заранее.
  if (!context.accessToken && !context.refreshToken) {
    throw new ApiError(401, { error: "no session" });
  }

  if (context.accessToken) {
    try {
      return { data: await callImpl<T>({ ...base, accessToken: context.accessToken }) };
    } catch (error) {
      const isExpired = error instanceof ApiError && error.status === 401;

      if (!isExpired || !context.refreshToken) {
        throw error;
      }
    }
  }

  if (!context.refreshToken) {
    throw new ApiError(401, { error: "no refresh token" });
  }

  const refreshed = await callImpl<SessionTokens>({
    ...base,
    path: "/api/auth/refresh",
    method: "POST",
    body: { refreshToken: context.refreshToken },
  });

  if (!refreshed?.accessToken) {
    throw new ApiError(401, { error: "refresh failed" });
  }

  const data = await callImpl<T>({ ...base, accessToken: refreshed.accessToken });

  return { data, tokens: refreshed };
}
