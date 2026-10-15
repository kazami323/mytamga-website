// Доставка заявки в Telegram. Без импортов с «@/», чтобы модуль проверялся
// обычным `node --test`.

export type LeadPayload = {
  name: string;
  contact: string;
  company: string;
  goods: string;
};

export type DeliveryResult = "delivered" | "unavailable";

// Читаем только LEAD_TELEGRAM_BOT_TOKEN и LEAD_TELEGRAM_CHAT_ID.
export type DeliveryEnv = Record<string, string | undefined>;

export type DeliveryOptions = {
  env: DeliveryEnv;
  fetchImpl?: typeof fetch;
  /** Язык страницы, если известен. */
  lang?: string;
  now?: Date;
  timeoutMs?: number;
};

export const TELEGRAM_TEXT_LIMIT = 4000;
const TIMEOUT_MS = 8000;

export function formatLeadText(
  lead: LeadPayload,
  lang: string | undefined,
  now: Date,
): string {
  const lines = [
    "Новая заявка с сайта",
    "",
    `Имя: ${lead.name}`,
    `Контакт: ${lead.contact}`,
  ];

  if (lead.company) {
    lines.push(`Компания: ${lead.company}`);
  }

  lines.push(`Что везёте: ${lead.goods}`);

  if (lang) {
    lines.push(`Язык страницы: ${lang}`);
  }

  lines.push(`Время (UTC): ${now.toISOString()}`);

  return lines.join("\n").slice(0, TELEGRAM_TEXT_LIMIT);
}

type Attempt = "ok" | "retry" | "fail";

async function attempt(
  fetchImpl: typeof fetch,
  url: string,
  body: string,
  timeoutMs: number,
): Promise<Attempt> {
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (response.status === 200) {
      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
      } | null;

      return data?.ok === true ? "ok" : "fail";
    }

    return response.status >= 500 || response.status === 429
      ? "retry"
      : "fail";
  } catch {
    // Сеть или таймаут. Само исключение не логируем: в его тексте может
    // оказаться адрес с токеном.
    return "retry";
  }
}

export async function sendLeadToTelegram(
  lead: LeadPayload,
  options: DeliveryOptions,
): Promise<DeliveryResult> {
  const token = options.env.LEAD_TELEGRAM_BOT_TOKEN?.trim();
  const chatId = options.env.LEAD_TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return "unavailable";
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  // Без parse_mode: текст посетителя не должен читаться как разметка.
  const body = JSON.stringify({
    chat_id: chatId,
    text: formatLeadText(lead, options.lang, options.now ?? new Date()),
    disable_web_page_preview: true,
  });
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;

  let result = await attempt(fetchImpl, url, body, timeoutMs);

  if (result === "retry") {
    result = await attempt(fetchImpl, url, body, timeoutMs);
  }

  if (result !== "ok") {
    // Только факт: ни токена, ни содержимого заявки.
    console.error("[lead] Telegram delivery failed");
  }

  return result === "ok" ? "delivered" : "unavailable";
}

export const LEAD_RATE_LIMITS = {
  perIpWindowMs: 10 * 60_000,
  perIpMax: 5,
  totalWindowMs: 60 * 60_000,
  totalMax: 60,
} as const;

/** Лимит в памяти процесса: при перезапуске счётчики обнуляются. */
export function createLeadRateLimiter() {
  const byIp = new Map<string, number[]>();
  let total: number[] = [];

  return {
    /** true — заявку можно принять (и она засчитана). */
    take(ip: string, nowMs: number): boolean {
      const { perIpWindowMs, perIpMax, totalWindowMs, totalMax } =
        LEAD_RATE_LIMITS;

      total = total.filter((at) => nowMs - at < totalWindowMs);
      const recent = (byIp.get(ip) ?? []).filter(
        (at) => nowMs - at < perIpWindowMs,
      );

      if (recent.length >= perIpMax || total.length >= totalMax) {
        byIp.set(ip, recent);
        return false;
      }

      recent.push(nowMs);
      total.push(nowMs);
      byIp.set(ip, recent);

      // Не даём карте расти бесконечно.
      if (byIp.size > 5000) {
        for (const [key, times] of byIp) {
          if (times.every((at) => nowMs - at >= perIpWindowMs)) {
            byIp.delete(key);
          }
        }
      }

      return true;
    },
  };
}
