import { ApiError } from "./errors.ts";
import { callApi, type ApiCall } from "./server.ts";
import { createSingleFlight } from "./single-flight.ts";

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
 * Одно обновление на refresh-токен в один момент. Сервер меняет токен при
 * каждом обновлении, поэтому два параллельных обновления одним и тем же токеном
 * означают 401 проигравшему по совершенно живой сессии — а ручка обновления на
 * таком 401 снесла бы куки, которые победитель только что выдал.
 */
const refreshFlight = createSingleFlight<SessionTokens>();

/** Обновление сессии. Общее место для ручки обновления и для повтора запроса. */
export function refreshSession(
  context: CallerContext,
  callImpl: Caller = liveCaller,
): Promise<SessionTokens> {
  const refreshToken = context.refreshToken;

  if (!refreshToken) {
    return Promise.reject(new ApiError(401, { error: "no refresh token" }));
  }

  return refreshFlight(refreshToken, async () => {
    const tokens = await callImpl<SessionTokens>({
      path: "/api/auth/refresh",
      method: "POST",
      body: { refreshToken },
      deviceId: context.deviceId,
      clientIp: context.clientIp,
      userAgent: context.userAgent,
    });

    if (!tokens?.accessToken) {
      throw new ApiError(401, { error: "refresh failed" });
    }

    return tokens;
  });
}

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

  const refreshed = await refreshSession(context, callImpl);

  const data = await callImpl<T>({ ...base, accessToken: refreshed.accessToken });

  return { data, tokens: refreshed };
}
