import type { LabelMap } from "./labels.ts";

// REVIEW(translation): узбекские и китайские подписи — черновик, до запуска их
// должен проверить носитель языка. Ключи совпадают с каталогом тарифов;
// русского здесь нет намеренно: каталог отдаёт русские подписи сам.
//
// Узбекский: o‘/g‘ пишутся через U+2018, как во всех словарях сайта.

type Maps = { uz: LabelMap; en: LabelMap; zh: LabelMap };

export const FEATURE_LABELS: Partial<Maps> = {
  uz: {
    standard_calculation: "Asosiy hisob-kitob",
    case_save: "Ishga saqlash",
    export: "PDF eksport",
    ai_check: "AI tekshiruvi",
    advanced_calculation: "Kengaytirilgan hisob-kitob",
    advanced_explanation: "Stavkalar izohi",
    version_history: "Versiyalar tarixi",
    scenario_compare: "Variantlarni solishtirish",
    multi_line_cases: "Ko‘p qatorli ishlar",
    declarant_chat: "Deklarant bilan chat",
    client_management: "O‘z mijozlaringiz",
    declarant_team: "Deklarantlar jamoasi",
    priority_processing: "Ustuvor ko‘rib chiqish",
    personal_manager: "Shaxsiy menejer",
    manual_rate_verification: "Stavkalarni qo‘lda tekshirish",
    manual_tnved_verification: "TIF TN kodini qo‘lda tekshirish",
  },
  en: {
    standard_calculation: "Basic calculation",
    case_save: "Save to a case",
    export: "PDF export",
    ai_check: "AI review",
    advanced_calculation: "Advanced calculation",
    advanced_explanation: "Rate explanations",
    version_history: "Version history",
    scenario_compare: "Scenario comparison",
    multi_line_cases: "Multi-line cases",
    declarant_chat: "Chat with a declarant",
    client_management: "Your own clients",
    declarant_team: "Declarant team",
    priority_processing: "Priority processing",
    personal_manager: "Personal manager",
    manual_rate_verification: "Manual rate verification",
    manual_tnved_verification: "Manual HS code verification",
  },
  zh: {
    standard_calculation: "基础计算",
    case_save: "保存到案例",
    export: "PDF 导出",
    ai_check: "AI 校验",
    advanced_calculation: "高级计算",
    advanced_explanation: "税率说明",
    version_history: "版本历史",
    scenario_compare: "方案对比",
    multi_line_cases: "多行案例",
    declarant_chat: "与报关员沟通",
    client_management: "客户管理",
    declarant_team: "报关团队",
    priority_processing: "优先处理",
    personal_manager: "专属客户经理",
    manual_rate_verification: "人工核对税率",
    manual_tnved_verification: "人工核对商品编码",
  },
};

export const LIMIT_LABELS: Partial<Maps> = {
  uz: {
    calculations_per_month: "Oyiga hisob-kitoblar",
    active_cases: "Faol ishlar",
    cases_per_month: "Oyiga ishlar",
    ai_checks_per_month: "Oyiga AI tekshiruvlari",
    pdf_exports_per_month: "Oyiga PDF eksportlar",
    team_seats: "Jamoadagi o‘rinlar",
  },
  en: {
    calculations_per_month: "Calculations per month",
    active_cases: "Active cases",
    cases_per_month: "Cases per month",
    ai_checks_per_month: "AI reviews per month",
    pdf_exports_per_month: "PDF exports per month",
    team_seats: "Team seats",
  },
  zh: {
    calculations_per_month: "每月计算次数",
    active_cases: "进行中的案例",
    cases_per_month: "每月案例数",
    ai_checks_per_month: "每月 AI 校验次数",
    pdf_exports_per_month: "每月 PDF 导出次数",
    team_seats: "团队席位",
  },
};
