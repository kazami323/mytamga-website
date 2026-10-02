import type { LeadErrorCode } from "@/lib/lead";
import { groupDigits } from "../../billing/format.ts";
import { companyFor, companyLine } from "../../legal/company.ts";
import { REFERENCE_COUNTS } from "../../reference-counts.ts";

// The source of truth for the shape of every dictionary: the other three are
// typed against it, so a missing or extra key fails the typecheck.
//
// REVIEW(copy) — an industry fact the client still has to confirm.

const company = companyFor("ru");

export const ru = {
  // Title and description reuse the hero's approved statement and supporting
  // copy rather than inventing a pitch.
  meta: {
    title: "MyTamga — понятный импорт от товара до декларанта",
    description:
      "MyTamga помогает определить код ТН ВЭД, рассчитать таможенные платежи, проверить требования к товару и подготовить всё необходимое для дальнейшего оформления.",
  },
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
    kicker: "Для импортёров и таможенных брокеров Узбекистана",
    // One entry per line: each language chooses its own breaks.
    title: ["Понятный импорт —", "от товара", "до декларанта."],
    lead: "MyTamga помогает определить код ТН ВЭД, рассчитать таможенные платежи, проверить требования к товару и подготовить всё необходимое для дальнейшего оформления.",
    actions: "Основные действия",
    contact: "Связаться с нами",
    learnMore: "Узнать о нас больше",
    sceneLoading: "Загрузка сцены",
    // Первый экран-портал: камера пролетает в букву, внутри — объяснение.
    portalEnter: "Заглянуть внутрь",
    portalHint: "Прокрутите вниз — войдём в букву",
    portalChoose: "Выберите букву, через которую войти",
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
    results: [
      { id: "result-1", title: "Платежи по статьям", body: "Пошлина, НДС, акциз и таможенные сборы — каждая отдельно и итогом, в сумах." },
      { id: "result-2", title: "Разрешительные документы", body: "Сертификаты, лицензии и разрешения, которые нужны именно для этого товара." },
      { id: "result-3", title: "Основание каждой цифры", body: "Ставка и норма закона, по которой она применена, со ссылкой на lex.uz." },
    ],
    cta: "Оставить заявку",
  },
  about: {
    kicker: "О нас",
    title: "Импорт без догадок",
    body: "MyTamga — сервис для тех, кто ввозит товары в Узбекистан. Стоимость растаможки обычно становится известна, когда менять решение уже поздно. Мы считаем её заранее — по справочнику, собранному из законов и постановлений, опубликованных на lex.uz. Клиент и декларант работают в одном деле: документы, расчёт и переписка — в одном месте.",
    // Цифры — из lib/reference-counts.ts: одно место на четыре языка.
    facts: [
      { id: "fact-1", label: "позиций ТН ВЭД в справочнике", value: groupDigits(REFERENCE_COUNTS.tnvedPositions) },
      { id: "fact-2", label: "правил таможенных пошлин", value: groupDigits(REFERENCE_COUNTS.dutyRules) },
      { id: "fact-3", label: "нетарифных правил", value: groupDigits(REFERENCE_COUNTS.nonTariffRules) },
    ],
  },
  contact: {
    kicker: "Контакты",
    title: "Расскажите о товаре",
    body: "Опишите, что везёте. Ответим с кодом ТН ВЭД и расчётом платежей.",
    // Значения и ссылки — из lib/legal/company.ts, единственного места реквизитов.
    channels: [
      { id: "phone", label: "Телефон", value: company.phone, href: company.phoneHref as string | null },
      { id: "email", label: "Почта", value: company.supportEmail, href: `mailto:${company.supportEmail}` as string | null },
      { id: "place", label: "Адрес", value: company.shortAddress, href: company.mapsUrl as string | null },
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
  billing: {
    nav: "Тарифы",
    metaTitle: "Тарифы MyTamga — подписка для импортёров и брокеров",
    metaDescription:
      "Тарифы MyTamga: что входит в каждый, сколько мест в команде и как оформить подписку для приложения.",
    kicker: "Тарифы",
    title: "Подписка MyTamga",
    lead: "Один доступ для приложения и сайта. Тариф, оформленный здесь, открывается на всех устройствах.",
    // Цены ещё не объявлены: пока это единственное честное, что можно сказать.
    pricePending: "В процессе обсуждения",
    perMonth: "{amount} сум/мес",
    perYear: "{amount} сум/год",
    free: "Бесплатно",
    freeForever: "Бесплатно постоянно — это не пробный период",
    byRequest: "По заявке",
    fromMonthly: "от {amount} сум/мес",
    period: {
      label: "Период оплаты",
      monthly: "Месяц",
      yearly: "Год",
    },
    // «{months} из 12 месяцев»: существительное согласовано с 12, которое
    // постоянно, поэтому число платежей может быть любым без «2 месяцев».
    yearlyAs: "Год: {months} из 12 месяцев",
    seatsIncluded: "Мест в команде: {count}",
    extraSeat: "{amount} сум за место сверх",
    unlimited: "Без ограничений",
    catalogUnavailable:
      "Цены временно недоступны. Напишите нам — пришлём действующие условия.",
    renewManual: "Разовая оплата на 30 дней. Продлевать вручную.",
    renewAuto: "Продлевается автоматически, отменить можно в любой момент.",
    cta: {
      included: "Уже включён",
      buy: "Оформить",
      request: "Запросить",
      download: "Скачать приложение",
    },
    providers: {
      label: "Способ оплаты",
      connecting: "Подключается",
    },
    checkout: {
      title: "Оформление",
      phoneLabel: "Номер телефона",
      phoneHint: "Узбекский номер, например +998 90 123 45 67",
      sendCode: "Получить код",
      codeLabel: "Код из SMS",
      codeHint: "Шесть цифр из сообщения",
      confirm: "Подтвердить",
      changeNumber: "Изменить номер",
      signedIn: "Вход выполнен",
      signOut: "Выйти",
      currentPlan: "Текущий тариф",
      until: "Действует до {date}",
      pay: "Перейти к оплате",
      requestSent: "Заявка отправлена — мы свяжемся с вами.",
      ownerOnly: "Оплату оформляет владелец организации.",
      storeManaged:
        "Подписка оформлена в магазине приложений. Управлять ею можно там же.",
      // Сервер приложения знает только узбекские номера — это его устройство,
      // а не наш выбор.
      uzPhoneOnly:
        `Оплата на сайте доступна с узбекским номером. С другим номером напишите на ${company.supportEmail} — предложим другой способ.`,
      pricesPending: "Цены ещё обсуждаются. Мы сообщим, когда откроем оплату.",
    },
    errors: {
      rate: "Слишком часто. Повторите через {seconds} с.",
      rateLater: "Слишком часто. Попробуйте позже.",
      forbidden: "Оплату оформляет владелец организации.",
      store: "Подписка оформлена в магазине приложений. Управлять ею можно там же.",
      unavailable: "Онлайн-оплата подключается. Напишите нам — оформим доступ.",
      requestOnly: "Этот тариф оформляется по заявке.",
      noOrganization: "Организация не найдена. Войдите заново.",
      signedOut: "Сессия истекла. Войдите заново.",
      network: "Не удалось связаться с сервером. Попробуйте ещё раз.",
      phoneInvalid: "Проверьте номер: нужен узбекский, например +998 90 123 45 67.",
      codeInvalid: "Код из SMS — шесть цифр.",
      pricesPending: "Оплата пока не открыта.",
    },
    pay: {
      title: "Оплата",
      waiting: "Проверяем оплату…",
      success: "Оплачено. Откройте приложение MyTamga — тариф уже подключён.",
      timeout:
        "Платёж обрабатывается. Если тариф не появится в течение десяти минут, напишите в поддержку.",
      transaction: "Номер платежа: {id}",
      signIn: "Чтобы проверить оплату, войдите заново.",
      backToPricing: "К тарифам",
    },
    legal: {
      offer: "Публичная оферта",
      privacy: "Политика конфиденциальности",
      terms: "Условия использования",
      support: "Поддержка",
      updated: "Дата обновления: {date}",
      draftNotice:
        "Проект документа. Он ещё не проверен юристом и не вступил в силу.",
      contractLanguage:
        "Договор заключается на русском языке. Откройте русскую версию документа.",
      detailsMissing:
        "Реквизиты исполнителя будут опубликованы до начала приёма платежей.",
      detailsTitle: "Реквизиты",
      supportTitle: "Поддержка",
      supportBody: "Напишите нам — отвечаем по рабочим дням.",
      openRussian: "Открыть на русском",
    },
  },
  footer: {
    // Год ставит сам подвал; юрлицо, ИНН и адрес — из lib/legal/company.ts.
    legal: companyLine("ru"),
    backToTop: "Наверх",
    // Подпись над названием магазина, как на официальных значках. Пока
    // адреса в lib/app-links.ts нет, вместо неё — «скоро».
    appStoreCaption: "Загрузите в",
    googlePlayCaption: "Доступно в",
    comingSoon: "Скоро в",
  },
};

export type Dictionary = typeof ru;
