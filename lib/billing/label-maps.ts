import type { LabelMap } from "./labels.ts";

// Подписи возможностей, лимитов и описания тарифов задаёт сайт, а не API:
// подача утверждена владельцем. Ключи совпадают с каталогом; ключ без подписи
// откатывается к подписи из API (см. labelFor).
//
// REVIEW(translation): узбекские и китайские формулировки — черновик, до
// запуска их должен проверить носитель языка.
//
// Узбекский: o‘/g‘ пишутся через U+2018, как во всех словарях сайта.

type Maps = { ru: LabelMap; uz: LabelMap; en: LabelMap; zh: LabelMap };

export const FEATURE_LABELS: Maps = {
  ru: {
    standard_calculation: "Расчёт таможенных платежей",
    case_save: "Сохранение в дело",
    export: "PDF-отчёт",
    ai_check: "ИИ-проверка",
    declarant_chat: "Чат с декларантом",
    advanced_calculation: "Расширенный расчёт",
    advanced_explanation: "Объяснение ставок",
    multi_line_cases: "Несколько товаров в одном деле",
    version_history: "История версий",
    scenario_compare: "Сравнение сценариев",
    priority_processing: "Приоритетная обработка",
    manual_rate_verification: "Ручная проверка ставок специалистом",
    client_management: "Свои клиенты",
    personal_manager: "Персональный менеджер",
    manual_tnved_verification: "Ручная проверка кода ТН ВЭД специалистом",
    declarant_team: "Команда декларантов",
  },
  uz: {
    standard_calculation: "Bojxona to‘lovlarini hisoblash",
    case_save: "Ishga saqlash",
    export: "PDF-hisobot",
    ai_check: "AI tekshiruvi",
    declarant_chat: "Deklarant bilan chat",
    advanced_calculation: "Kengaytirilgan hisob-kitob",
    advanced_explanation: "Stavkalar izohi",
    multi_line_cases: "Bitta ishda bir nechta tovar",
    version_history: "Versiyalar tarixi",
    scenario_compare: "Variantlarni solishtirish",
    priority_processing: "Ustuvor ishlov berish",
    manual_rate_verification: "Stavkalarni mutaxassis qo‘lda tekshiradi",
    client_management: "O‘z mijozlaringiz",
    personal_manager: "Shaxsiy menejer",
    manual_tnved_verification: "TIF TN kodini mutaxassis qo‘lda tekshiradi",
    declarant_team: "Deklarantlar jamoasi",
  },
  en: {
    standard_calculation: "Customs payment calculation",
    case_save: "Save to a case",
    export: "PDF report",
    ai_check: "AI review",
    declarant_chat: "Chat with a declarant",
    advanced_calculation: "Advanced calculation",
    advanced_explanation: "Rate explanations",
    multi_line_cases: "Several goods in one case",
    version_history: "Version history",
    scenario_compare: "Scenario comparison",
    priority_processing: "Priority processing",
    manual_rate_verification: "Manual rate check by a specialist",
    client_management: "Your own clients",
    personal_manager: "Personal manager",
    manual_tnved_verification: "Manual HS code check by a specialist",
    declarant_team: "Declarant team",
  },
  zh: {
    standard_calculation: "海关税费计算",
    case_save: "保存到案例",
    export: "PDF 报告",
    ai_check: "AI 校验",
    declarant_chat: "与报关员沟通",
    advanced_calculation: "高级计算",
    advanced_explanation: "税率说明",
    multi_line_cases: "一个案例含多种商品",
    version_history: "版本历史",
    scenario_compare: "方案对比",
    priority_processing: "优先处理",
    manual_rate_verification: "专家人工核对税率",
    client_management: "自有客户管理",
    personal_manager: "专属客户经理",
    manual_tnved_verification: "专家人工核对商品编码",
    declarant_team: "报关团队",
  },
};

// Подписи строк таблицы «Лимиты в месяц»: «в месяц» уже в заголовке таблицы.
export const LIMIT_LABELS: Maps = {
  ru: {
    calculations_per_month: "Расчётов",
    active_cases: "Активных дел",
    cases_per_month: "Новых дел",
    pdf_exports_per_month: "PDF-отчётов",
    ai_checks_per_month: "ИИ-проверок",
    team_seats: "Человек в команде",
  },
  uz: {
    calculations_per_month: "Hisob-kitoblar",
    active_cases: "Faol ishlar",
    cases_per_month: "Yangi ishlar",
    pdf_exports_per_month: "PDF-hisobotlar",
    ai_checks_per_month: "AI tekshiruvlari",
    team_seats: "Jamoadagi odamlar",
  },
  en: {
    calculations_per_month: "Calculations",
    active_cases: "Active cases",
    cases_per_month: "New cases",
    pdf_exports_per_month: "PDF reports",
    ai_checks_per_month: "AI reviews",
    team_seats: "People on the team",
  },
  zh: {
    calculations_per_month: "计算次数",
    active_cases: "进行中的案例",
    cases_per_month: "新建案例",
    pdf_exports_per_month: "PDF 报告",
    ai_checks_per_month: "AI 校验次数",
    team_seats: "团队人数",
  },
};

// Описания («для кого») по ключу тарифа.
export const PLAN_DESCRIPTIONS: Maps = {
  ru: {
    basic: "Попробовать",
    start: "Разовые и небольшие поставки",
    business: "Регулярный импорт",
    pro: "Без ограничений на расчёты, приоритет",
    team: "Команда до 5 человек и свои клиенты — для брокеров",
    corporate: "До 15 человек, персональный менеджер",
    vip: "Условия и счёт под компанию",
  },
  uz: {
    basic: "Sinab ko‘rish",
    start: "Bir martalik va kichik yetkazib berishlar",
    business: "Muntazam import",
    pro: "Hisob-kitoblarda cheklovsiz, ustuvorlik",
    team: "5 kishigacha jamoa va o‘z mijozlaringiz — brokerlar uchun",
    corporate: "15 kishigacha, shaxsiy menejer",
    vip: "Shartlar va hisob-faktura kompaniya uchun",
  },
  en: {
    basic: "Try it out",
    start: "One-off and small shipments",
    business: "Regular imports",
    pro: "Unlimited calculations, priority",
    team: "A team of up to 5 and your own clients — for brokers",
    corporate: "Up to 15 people, a personal manager",
    vip: "Terms and an invoice for your company",
  },
  zh: {
    basic: "免费试用",
    start: "单次及小批量进口",
    business: "定期进口",
    pro: "计算不限次数，优先处理",
    team: "最多 5 人团队和自有客户——适合报关代理",
    corporate: "最多 15 人，专属客户经理",
    vip: "按公司需求定制条款与发票",
  },
};
