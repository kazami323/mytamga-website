import { NextResponse, type NextRequest } from "next/server";

import { COOKIE, MAX_AGE, cookieOptions } from "@/lib/api/cookies";
import { isSameOrigin } from "@/lib/api/origin";
import { ApiError, checkoutConflictFrom } from "@/lib/api/errors";
import { attachSession, callWithSession, failure, failureFrom, readContext } from "@/lib/api/session";
import { normalizePeriod, parseCheckout } from "@/lib/billing/checkout-effect";
import { PRICES_PUBLISHED } from "@/lib/billing/flags";
import { loadProviders } from "@/lib/billing/plans.server";

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
    | { planKey?: unknown; provider?: unknown; billingPeriod?: unknown }
    | null;

  const planKey = String(body?.planKey ?? "");
  const provider = String(body?.provider ?? "");
  const billingPeriod = normalizePeriod(body?.billingPeriod);

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
    const { data, tokens } = await callWithSession<unknown>(context, {
      path: "/api/organizations/current/subscription/checkout-session",
      method: "POST",
      body: { planKey, provider, billingPeriod, source: "website" },
    });

    const offer = parseCheckout(data);

    if (!offer) {
      return failure("network");
    }

    const { url, transactionId, effect, amount } = offer;

    // effect и amount есть только у нового сервера; старый их не присылает, и
    // страница тогда идёт в Click сразу, как раньше.
    const response = NextResponse.json({
      ok: true,
      url,
      effect,
      amount,
      billingPeriod: offer.billingPeriod ?? billingPeriod,
    });

    if (transactionId) {
      // Провайдер вернёт человека без наших параметров, а номер платежа нужен
      // странице возврата и письму в поддержку.
      response.cookies.set(COOKIE.transaction, transactionId, cookieOptions(MAX_AGE.transaction));
      // И какой тариф оплачен: иначе страница возврата ждала бы «pro» и на
      // успешной оплате Business отчитывалась бы «платёж обрабатывается».
      response.cookies.set(COOKIE.transactionPlan, planKey, cookieOptions(MAX_AGE.transaction));
    }

    return tokens ? attachSession(response, tokens) : response;
  } catch (error) {
    // 409 здесь — не только «оплачено в магазине»: тариф может быть выдан
    // бессрочно или после текущего уже оплачен другой.
    if (error instanceof ApiError && error.status === 409) {
      const { code, detail } = checkoutConflictFrom(error.body);
      return failure(code, { detail });
    }

    return failureFrom(error, undefined, "checkoutConflict");
  }
}
