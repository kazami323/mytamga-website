# API: доверять адресу посетителя от сайта по ключу

Задача для репозитория приложения (`apps/api`). Со стороны сайта всё готово:
сайт уже отправляет нужные заголовки, как только ему задан ключ.

## Почему

Сайт `mytamga.uz` стоит на общем хостинге ahost (cPanel, тариф «Микро»), API —
на VPS в eskiz.uz. Браузер посетителя обращается к сайту, а вход по SMS, чтение
подписки и оплату сайт выполняет сам, запросом к API.

Поэтому API видит не адрес посетителя, а адрес сервера ahost. Лимит входа
(`AuthRateLimitGuard`, `AUTH_RATE_LIMIT_MAX` запросов за окно на адрес) начинает
считать всех посетителей сайта как одного: при пороге 3 в минуту четвёртый
человек получит 429, ничего не нарушив.

Добавить адрес ahost в `TRUST_PROXY` **нельзя**. Это общий хостинг: с того же
адреса ходят сайты других клиентов ahost. API начал бы верить их
`X-Forwarded-For`, и любой сосед подделал бы адрес посетителя и обошёл лимит.

## Что сделать

Принимать адрес посетителя из отдельного заголовка `x-site-client-ip` **только**
когда заголовок `x-site-proxy-key` совпадает с секретом `SITE_PROXY_KEY`. Во всех
остальных случаях — как сейчас, `request.ip`.

Сайт отправляет оба заголовка только при заданном ключе и только когда знает
адрес посетителя. Обычный `X-Forwarded-For` он тоже отправляет, но после Caddy на
VPS в нём будет ещё и адрес ahost — поэтому нужен отдельный заголовок, который
Caddy не трогает.

### 1. Помощник — `apps/api/src/common/http/client-ip.ts`

```ts
import { createHash, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

type RequestLike = {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
};

function header(request: RequestLike, name: string): string {
  const value = request.headers?.[name];
  return String(Array.isArray(value) ? value[0] : value ?? "").trim();
}

// Обе стороны хэшируются: timingSafeEqual требует равной длины, а ранний выход
// по разнице длин сам выдаёт информацию о секрете.
function sameSecret(presented: string, expected: string): boolean {
  const a = createHash("sha256").update(presented).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Адрес клиента для лимитов. Сайт на общем хостинге ручается за адрес
 * посетителя заголовком x-site-client-ip — но только вместе с секретом,
 * который знают сайт и API. Без секрета или с неверным — request.ip, как прежде.
 */
export function resolveClientIp(request: RequestLike, siteProxyKey: string): string {
  const fallback = String(request.ip || "unknown").trim() || "unknown";

  if (!siteProxyKey) {
    return fallback;
  }

  const presented = header(request, "x-site-proxy-key");
  const claimed = header(request, "x-site-client-ip");

  if (!presented || !claimed || !sameSecret(presented, siteProxyKey)) {
    return fallback;
  }

  return isIP(claimed) ? claimed : fallback;
}
```

### 2. Подключить в двух местах

`apps/api/src/modules/auth/auth-rate-limit.guard.ts`, в `canActivate`: тип
запроса дополнить `headers`, а строку

```ts
const ip = String(request.ip || "unknown").trim() || "unknown";
```

заменить на

```ts
const ip = resolveClientIp(request, this.config.siteProxyKey);
```

`apps/api/src/common/rate-limit/rate-limit.guard.ts`, в `resolveIdentity` —
так же: для анонимных запросов ключ лимита `ip:${resolveClientIp(...)}`.
Для вошедших ключ по-прежнему `user:<id>`.

### 3. Настройка

- `apps/api/src/config/env.validation.ts`:
  `SITE_PROXY_KEY: Joi.string().allow("").min(32).default("")`
- `apps/api/src/config/app.config.ts`:
  `siteProxyKey: String(process.env.SITE_PROXY_KEY ?? "").trim(),`
- `apps/api/src/config/app-config.service.ts`:
  `get siteProxyKey() { return this.get("siteProxyKey"); }`
- `deploy/ahost/.env.production.example`:
  `SITE_PROXY_KEY=` с комментарием «секрет, общий с сайтом mytamga.uz
  (MYTAMGA_API_PROXY_KEY там); openssl rand -hex 32».

Пустой ключ — прежнее поведение, ничего не меняется для мобильного приложения,
которое ходит в API напрямую.

### 4. Тесты

Для `resolveClientIp`:
- ключ не задан → `request.ip`, даже если заголовки пришли;
- неверный ключ → `request.ip`;
- верный ключ, нет `x-site-client-ip` → `request.ip`;
- верный ключ, `x-site-client-ip` не похож на адрес → `request.ip`;
- верный ключ и адрес → адрес из заголовка.

Для `AuthRateLimitGuard`: два запроса с верным ключом и **разными**
`x-site-client-ip` попадают в разные счётчики; с неверным ключом — в один.

`scripts/verify-api-security.cjs` менять не нужно: новых публичных маршрутов нет.

## Развёртывание API на VPS eskiz.uz

Папка `deploy/ahost` к ahost привязана только названием: это сборка под
Ubuntu с Docker, Postgres, Redis и Caddy, она подходит для VPS eskiz как есть.
В `.env.production`:

```bash
API_DOMAIN=api.mytamga.uz
SITE_PROXY_KEY=<тот же ключ, что MYTAMGA_API_PROXY_KEY на сайте>
CLICK_RETURN_URL=https://mytamga.uz/pay/return
```

`CORS_ORIGINS` для сайта не нужен: браузер посетителя к API не обращается, это
делает сервер сайта.

## Как проверить на живых серверах

Запросить код входа на сайте с двух разных сетей (мобильный интернет и Wi-Fi):
в журнале API должны быть два разных адреса, а не адрес сервера ahost.
