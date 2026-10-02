# MyTamga — сайт

Сайт MyTamga: главная, тарифы с оформлением подписки, юридические страницы.
Четыре языка — русский, узбекский, английский, китайский. Next.js 16,
React 19, Tailwind CSS 4.

## Выложить на хостинг

Полная инструкция — **[docs/DEPLOY_RU.md](docs/DEPLOY_RU.md)**: сайт на ahost
(cPanel, Node.js), API приложения на VPS в eskiz.uz, секреты, DNS, проверка.

Готовый пакет для загрузки — в [Releases](../../releases), файл
`mytamga-site.zip`.

## Запустить у себя

Нужен Node.js 20.9+.

```bash
npm ci
npm run dev        # http://localhost:3000
```

Страница тарифов и вход по номеру берут данные из API приложения. Для них
рядом должен работать API (репозиторий приложения, `npm run dev:api`, порт
3001), а в `.env.local` этого репозитория — строка:

```
MYTAMGA_API_URL=http://localhost:3001
```

Без API сайт работает, а на странице тарифов будет «цены временно недоступны».

## Проверки

```bash
npm test               # тесты логики
npm run typecheck
npm run lint
npm run check:catalog  # цены на странице сверяются с каталогом API
npm run check:legal    # что осталось по юридическим страницам
```

## Где что

| Что | Где |
| --- | --- |
| Тексты сайта на четырёх языках | `lib/i18n/dictionaries/` |
| Реквизиты компании | `lib/legal/company.ts` |
| Этапы кассы (объявлены ли цены) | `lib/billing/flags.ts` |
| Адреса приложения в магазинах | `lib/app-links.ts` |
| Решения по устройству сайта | [DESIGN.md](DESIGN.md) |
| Весь текст сайта одним списком | [docs/SITE_COPY_RU.md](docs/SITE_COPY_RU.md) |
