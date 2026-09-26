import { apiUrl } from "./base.ts";
import { ApiError } from "./errors.ts";

export type ApiCall = {
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
  accessToken?: string;
  deviceId?: string;
  clientIp?: string | null;
  userAgent?: string | null;
};

// Сервер хранит это как название сессии устройства, которое человек потом видит
// в списке своих входов. Целый User-Agent там не нужен.
const MAX_DEVICE_NAME = 120;

export function buildHeaders(call: ApiCall): Record<string, string> {
  const headers: Record<string, string> = {
    accept: "application/json",
    "x-platform": "web",
  };

  if (call.body !== undefined) {
    headers["content-type"] = "application/json";
  }

  if (call.accessToken) {
    headers.authorization = `Bearer ${call.accessToken}`;
  }

  if (call.deviceId) {
    headers["x-device-id"] = call.deviceId;
  }

  if (call.clientIp) {
    headers["x-forwarded-for"] = call.clientIp;
  }

  const deviceName = String(call.userAgent ?? "").trim();

  if (deviceName) {
    headers["x-device-name"] = deviceName.slice(0, MAX_DEVICE_NAME);
  }

  return headers;
}

/**
 * Единственное место, которое обращается к API приложения. `fetchImpl`
 * подставляется в тестах — сетевой вызов иначе нечем проверить.
 */
export async function callApi<T>(
  call: ApiCall,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const url = apiUrl(call.path);

  if (!url) {
    // Настройки нет — для страницы это то же, что недоступный провайдер.
    throw new ApiError(503, { error: "MYTAMGA_API_URL is not configured" });
  }

  let response: Response;

  try {
    response = await fetchImpl(url, {
      method: call.method ?? "GET",
      headers: buildHeaders(call),
      body: call.body === undefined ? undefined : JSON.stringify(call.body),
      cache: "no-store",
    });
  } catch (cause) {
    throw new ApiError(0, { error: String(cause) });
  }

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      // Ответ не JSON — обычно это страница ошибки от прокси.
      payload = { error: text.slice(0, 500) };
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, payload);
  }

  return payload as T;
}
