// Доставка заявки в Telegram. Без импортов с «@/», чтобы модуль проверялся
// обычным `node --test`.

export type LeadPayload = {
  name: string;
  contact: string;
  company: string;
  goods: string;
};

// "unavailable" — канал не настроен; "failed" — настроен, но отправить не вышло.
export type DeliveryResult = "delivered" | "unavailable" | "failed";

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

  // По символам, а не по code unit: суррогатную пару не разрываем.
  return Array.from(lines.join("\n"))
    .slice(0, TELEGRAM_TEXT_LIMIT)
    .join("");
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

  return result === "ok" ? "delivered" : "failed";
}

export const LEAD_RATE_LIMITS = {
  windowMs: 10 * 60_000,
  perIpMax: 5,
  totalMax: 30,
} as const;

/** Лимит в памяти процесса: при перезапуске счётчики обнуляются. */
export function createLeadRateLimiter() {
  const byIp = new Map<string, number[]>();
  let total: number[] = [];

  return {
    /** Число хранимых адресов — для тестов. */
    get size() {
      return byIp.size;
    },
    /**
     * true — заявку можно принять (и она засчитана). `ip === null` — адрес
     * определить не удалось: тогда действует только общий лимит.
     */
    take(ip: string | null, nowMs: number): boolean {
      const { windowMs, perIpMax, totalMax } = LEAD_RATE_LIMITS;

      // Чистим при каждом вызове, что бы он ни решил: записей не больше
      // totalMax, так что это дёшево.
      total = total.filter((at) => nowMs - at < windowMs);
      for (const [key, times] of byIp) {
        const live = times.filter((at) => nowMs - at < windowMs);
        if (live.length === 0) {
          byIp.delete(key);
        } else {
          byIp.set(key, live);
        }
      }

      const recent = ip === null ? [] : (byIp.get(ip) ?? []);

      if (recent.length >= perIpMax || total.length >= totalMax) {
        return false;
      }

      total.push(nowMs);

      if (ip !== null) {
        byIp.set(ip, [...recent, nowMs]);
      }

      return true;
    },
  };
}
