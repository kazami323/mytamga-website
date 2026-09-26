import type { BillingErrorCode } from "./errors";

export type ApiResult<T> =
  | ({ ok: true } & T)
  | { ok: false; code: BillingErrorCode; retryAfter?: number | null };

/**
 * Браузер обращается только к нашему домену. Наши ручки всегда отвечают 200:
 * код отказа лежит в теле, поэтому разбирать статусы здесь не нужно.
 */
async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });

    const payload = (await response.json()) as ApiResult<T>;

    return payload?.ok === true ? payload : payload ?? { ok: false, code: "network" };
  } catch {
    return { ok: false, code: "network" };
  }
}

export function getJson<T>(path: string): Promise<ApiResult<T>> {
  return request<T>(path);
}

export function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}
