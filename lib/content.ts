// Copy for every section built after the hero. One file, so replacing the
// placeholders with the client's real wording is a single edit.
//
// TODO(copy)   — no data exists; the visible string is a placeholder.
// REVIEW(copy) — an industry fact, not a claim about the company; the
//                client still has to confirm it.

export const PLACEHOLDER = "Место под текст";

export const howItWorks = {
  kicker: "Как это работает",
  title: "Три шага до готового пакета",
  steps: [
    {
      id: "describe",
      title: "Опишите товар",
      body: "Название, состав, назначение и страна происхождения.",
    },
    {
      id: "receive",
      title: "Получите код и расчёт",
      body: "Код ТН ВЭД и таможенные платежи — до подачи декларации.",
    },
    {
      id: "collect",
      title: "Заберите документы",
      body: "Готовый пакет остаётся передать декларанту.",
    },
  ],
} as const;

export const calculation = {
  kicker: "Расчёт",
  title: "Что нужно, чтобы посчитать",
  // REVIEW(copy): standard inputs of any customs calculation, not a promise.
  inputs: [
    {
      id: "goods",
      title: "Описание товара",
      body: "Название, состав и назначение.",
    },
    {
      id: "origin",
      title: "Страна происхождения",
      body: "От неё зависят применимые ставки.",
    },
    {
      id: "value",
      title: "Таможенная стоимость",
      body: "Цена сделки и сопутствующие расходы.",
    },
    {
      id: "weight",
      title: "Вес и объём",
      body: "Брутто, нетто и габариты партии.",
    },
  ],
  resultKicker: "Что вы получаете",
  // TODO(copy): what the calculation returns is a claim about the service.
  results: [
    { id: "result-1", title: PLACEHOLDER, body: PLACEHOLDER },
    { id: "result-2", title: PLACEHOLDER, body: PLACEHOLDER },
    { id: "result-3", title: PLACEHOLDER, body: PLACEHOLDER },
  ],
  cta: "Оставить заявку",
} as const;

export const about = {
  kicker: "О нас",
  // TODO(copy): everything below needs the client's text.
  title: PLACEHOLDER,
  body: PLACEHOLDER,
  facts: [
    { id: "fact-1", label: PLACEHOLDER, value: PLACEHOLDER },
    { id: "fact-2", label: PLACEHOLDER, value: PLACEHOLDER },
    { id: "fact-3", label: PLACEHOLDER, value: PLACEHOLDER },
  ],
} as const;

type Channel = {
  id: string;
  label: string;
  value: string;
  href: string | null;
};

export const contact: {
  kicker: string;
  title: string;
  body: string;
  channels: Channel[];
} = {
  kicker: "Контакты",
  title: "Расскажите о товаре",
  body: "Опишите, что везёте. Ответим с кодом ТН ВЭД и расчётом платежей.",
  // TODO(copy): real channels. `href` stays null until a value exists —
  // a link to a placeholder is worse than no link.
  channels: [
    { id: "phone", label: "Телефон", value: PLACEHOLDER, href: null },
    { id: "email", label: "Почта", value: PLACEHOLDER, href: null },
    { id: "place", label: "Адрес", value: PLACEHOLDER, href: null },
  ],
};

export const footer = {
  // TODO(copy): legal entity, registration number, address.
  legal: PLACEHOLDER,
} as const;
