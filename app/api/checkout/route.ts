import { NextResponse, type NextRequest } from "next/server";

import { COOKIE, MAX_AGE, cookieOptions } from "@/lib/api/cookies";
import { isSameOrigin } from "@/lib/api/origin";
import { attachSession, callWithSession, failure, failureFrom, readContext } from "@/lib/api/session";
import { PRICES_PUBLISHED } from "@/lib/billing/flags";
import { loadProviders } from "@/lib/billing/plans.server";

type CheckoutResult = { url?: unknown; transactionId?: unknown };

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return failure("network");
  }

  // Второй рубеж. Пока цена не объявлена, списывать нечего: провайдер возьмёт
  // сумму из своей настройки, а человек её не видел.
  if (!PRICES_PUBLISHED) {
    return failure("pricesPending");
  }

  const body = (await request.json().catch(() => null)) as
    | { planKey?: unknown; provider?: unknown }
    | null;

  const planKey = String(body?.planKey ?? "");
  const provider = String(body?.provider ?? "");

  if (!planKey) {
    return failure("requestOnly");
  }

  // Оплату предлагаем только через то, что реестр объявил подключённым:
  // показывать иллюзию онлайн-оплаты он запрещает прямо.
  const providers = await loadProviders();
  const isOnline = providers?.some((entry) => entry.key === provider && entry.online);

  if (!isOnline) {
    return failure("unavailable");
  }

  const context = readContext(request);

  try {
    const { data, tokens } = await callWithSession<CheckoutResult>(context, {
      path: "/api/organizations/current/subscription/checkout-session",
      method: "POST",
      body: { planKey, provider, source: "website" },
    });

    const url = typeof data?.url === "string" ? data.url : "";
    const transactionId = typeof data?.transactionId === "string" ? data.transactionId : "";

    if (!url) {
      return failure("network");
    }

    const response = NextResponse.json({ ok: true, url });

    if (transactionId) {
      // Провайдер вернёт человека без наших параметров, а номер платежа нужен
      // странице возврата и письму в поддержку.
      response.cookies.set(COOKIE.transaction, transactionId, cookieOptions(MAX_AGE.transaction));
    }

    return tokens ? attachSession(response, tokens) : response;
  } catch (error) {
    return failureFrom(error);
  }
}
