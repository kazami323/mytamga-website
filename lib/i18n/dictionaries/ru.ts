import type { LeadErrorCode } from "@/lib/lead";

// The source of truth for the shape of every dictionary: the other three are
// typed against it, so a missing or extra key fails the typecheck.
//
// TODO(copy)   — no data exists; the visible string is the placeholder.
// REVIEW(copy) — an industry fact the client still has to confirm.

const P = "Место под текст";

export const ru = {
  // Title and description reuse the hero's approved statement and supporting
  // copy rather than inventing a pitch.
  meta: {
    title: "MyTamga — понятный импорт от товара до декларанта",
    description:
      "MyTamga помогает определить код ТН ВЭД, рассчитать таможенные платежи, проверить требования к товару и подготовить всё необходимое для дальнейшего оформления.",
  },
  placeholder: P,
  nav: {
    home: "Главная",
    services: "Услуги",
    calc: "Расчёт",
    about: "О нас",
    contacts: "Контакты",
    primary: "Основная навигация",
    footer: "Навигация в подвале",
    openMenu: "Открыть меню",
    closeMenu: "Закрыть меню",
    language: "Язык",
  },
  theme: {
    light: "Светлая тема",
  },
  preloader: {
    loading: "Загрузка страницы",
  },
  hero: {
    kicker: P, // TODO(copy)
    // One entry per line: each language chooses its own breaks.
    title: ["Понятный импорт —", "от товара", "до декларанта."],
    lead: "MyTamga помогает определить код ТН ВЭД, рассчитать таможенные платежи, проверить требования к товару и подготовить всё необходимое для дальнейшего оформления.",
    actions: "Основные действия",
    contact: "Связаться с нами",
    learnMore: "Узнать о нас больше",
    sceneLoading: "Загрузка сцены",
  },
  capabilities: {
    kicker: "Возможности",
    title: "Всё, что нужно до подачи декларации",
    items: [
      {
        id: "code",
        title: "Код ТН ВЭД",
        body: "Определяем код товарной номенклатуры по описанию товара, его составу и назначению.",
      },
      {
        id: "payments",
        title: "Расчёт платежей",
        body: "Считаем таможенные платежи заранее, чтобы стоимость ввоза была известна до подачи декларации.",
      },
      {
        id: "requirements",
        title: "Требования к товару",
        body: "Проверяем, какие разрешительные документы нужны именно вашему товару.",
      },
      {
        id: "documents",
        title: "Подготовка документов",
        body: "Собираем пакет, который останется передать декларанту для дальнейшего оформления.",
      },
    ],
  },
  howItWorks: {
    kicker: "Как это работает",
    title: "Три шага до готового пакета",
    steps: [
      { id: "describe", title: "Опишите товар", body: "Название, состав, назначение и страна происхождения." },
      { id: "receive", title: "Получите код и расчёт", body: "Код ТН ВЭД и таможенные платежи — до подачи декларации." },
      { id: "collect", title: "Заберите документы", body: "Готовый пакет остаётся передать декларанту." },
    ],
  },
  calculation: {
    kicker: "Расчёт",
    title: "Что нужно, чтобы посчитать",
    // REVIEW(copy): standard inputs of any customs calculation, not a promise.
    inputs: [
      { id: "goods", title: "Описание товара", body: "Название, состав и назначение." },
      { id: "origin", title: "Страна происхождения", body: "От неё зависят применимые ставки." },
      { id: "value", title: "Таможенная стоимость", body: "Цена сделки и сопутствующие расходы." },
      { id: "weight", title: "Вес и объём", body: "Брутто, нетто и габариты партии." },
    ],
    resultKicker: "Что вы получаете",
    // TODO(copy): what the calculation returns is a claim about the service.
    results: [
      { id: "result-1", title: P, body: P },
      { id: "result-2", title: P, body: P },
      { id: "result-3", title: P, body: P },
    ],
    cta: "Оставить заявку",
  },
  about: {
    kicker: "О нас",
    // TODO(copy): everything below needs the client's text.
    title: P,
    body: P,
    facts: [
      { id: "fact-1", label: P, value: P },
      { id: "fact-2", label: P, value: P },
      { id: "fact-3", label: P, value: P },
    ],
  },
  contact: {
    kicker: "Контакты",
    title: "Расскажите о товаре",
    body: "Опишите, что везёте. Ответим с кодом ТН ВЭД и расчётом платежей.",
    // TODO(copy): real channels. `href` stays null until a value exists — a
    // link to a placeholder is worse than no link.
    channels: [
      { id: "phone", label: "Телефон", value: P, href: null as string | null },
      { id: "email", label: "Почта", value: P, href: null as string | null },
      { id: "place", label: "Адрес", value: P, href: null as string | null },
    ],
  },
  form: {
    name: "Имя",
    contact: "Телефон или почта",
    company: "Компания",
    goods: "Что везёте",
    goodsPlaceholder: "Название, состав, назначение, страна происхождения.",
    optional: "необязательно",
    submit: "Отправить заявку",
    sending: "Отправляем…",
    unavailable:
      "Приём заявок пока не подключён. Свяжитесь с нами по контактам рядом — данные из формы не потеряны.",
    failed: "Не получилось отправить. Попробуйте ещё раз или напишите нам напрямую.",
    errors: {
      "name.short": "Укажите имя — минимум 2 символа.",
      "name.long": "Слишком длинное имя.",
      "contact.missing": "Оставьте телефон или почту.",
      "contact.invalid": "Не похоже на телефон или почту.",
      "company.long": "Слишком длинное название.",
      "goods.short": "Опишите товар — минимум 10 символов.",
      "goods.long": "Слишком длинное описание.",
    } satisfies Record<LeadErrorCode, string>,
  },
  footer: {
    legal: P, // TODO(copy): legal entity, registration number, address.
  },
};

export type Dictionary = typeof ru;
