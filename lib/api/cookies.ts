/**
 * Токены живут в куках, недоступных браузерному скрипту. На странице работают
 * Spline и шейдеры с внешнего CDN; sessionStorage, который предлагало задание,
 * любой из них прочитал бы.
 */
export const COOKIE = {
  access: "mt_at",
  refresh: "mt_rt",
  device: "mt_did",
  transaction: "mt_tx",
  /** Тариф этого платежа: страница возврата ждёт именно его, а не любой платный. */
  transactionPlan: "mt_txp",
} as const;

export const MAX_AGE = {
  /** Столько живёт access-токен на сервере приложения. */
  access: 900,
  refresh: 60 * 60 * 24 * 30,
  device: 31_536_000,
  /** Номера платежа хватает на страницу возврата и письмо в поддержку. */
  transaction: 3600,
} as const;

type CookieOptions = {
  httpOnly: true;
  secure: true;
  sameSite: "lax";
  path: "/";
  maxAge: number;
};

/**
 * `secure` всегда: браузеры считают localhost защищённым контекстом, так что
 * разработке это не мешает, а забыть снять флаг на продакшене — мешает.
 *
 * `sameSite: "lax"`, а не `strict`: человек возвращается с сайта провайдера,
 * то есть переходом с чужого домена. При `strict` куки не отправились бы, и
 * страница возврата не смогла бы спросить статус оплаты.
 */
export function cookieOptions(maxAgeSeconds: number): CookieOptions {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function clearedCookieOptions(): CookieOptions {
  return cookieOptions(0);
}
