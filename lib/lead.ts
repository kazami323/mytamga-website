export type LeadValues = {
  name: string;
  contact: string;
  company: string;
  goods: string;
};

export type LeadFieldErrors = Partial<Record<keyof LeadValues, string>>;

export const LEAD_LIMITS = {
  name: { min: 2, max: 80 },
  company: { max: 120 },
  goods: { min: 10, max: 2000 },
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isPhone(value: string) {
  // Ten digits is the shortest real number here once formatting is stripped.
  return value.replace(/\D/g, "").length >= 10;
}

export function readLeadValues(formData: FormData): LeadValues {
  const read = (key: string) => String(formData.get(key) ?? "").trim();

  return {
    name: read("name"),
    contact: read("contact"),
    company: read("company"),
    goods: read("goods"),
  };
}

export function validateLead(values: LeadValues): LeadFieldErrors {
  const errors: LeadFieldErrors = {};

  if (values.name.length < LEAD_LIMITS.name.min) {
    errors.name = "Укажите имя — минимум 2 символа.";
  } else if (values.name.length > LEAD_LIMITS.name.max) {
    errors.name = "Слишком длинное имя.";
  }

  if (!values.contact) {
    errors.contact = "Оставьте телефон или почту.";
  } else if (!EMAIL.test(values.contact) && !isPhone(values.contact)) {
    errors.contact = "Не похоже на телефон или почту.";
  }

  if (values.company.length > LEAD_LIMITS.company.max) {
    errors.company = "Слишком длинное название.";
  }

  if (values.goods.length < LEAD_LIMITS.goods.min) {
    errors.goods = "Опишите товар — минимум 10 символов.";
  } else if (values.goods.length > LEAD_LIMITS.goods.max) {
    errors.goods = "Слишком длинное описание.";
  }

  return errors;
}

export type LeadState =
  | { status: "idle" }
  | { status: "invalid"; values: LeadValues; fieldErrors: LeadFieldErrors }
  | { status: "unavailable"; values: LeadValues }
  | { status: "failed"; values: LeadValues };

export const INITIAL_LEAD_STATE: LeadState = { status: "idle" };
