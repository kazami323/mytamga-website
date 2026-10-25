import type { Metadata } from "next";

import type { Locale } from "./i18n/config.ts";
import { openGraphFor, seoAlternates, twitterFor, type IndexablePath } from "./seo.ts";

/**
 * Заголовки и описания страниц для поисковиков. `title` — без бренда: макет
 * добавляет « | MyTamga». У главной заголовок полный (`absolute`).
 * Формулировки описывают только то, что сайт и приложение делают сейчас.
 */

export interface PageCopy {
  title: string;
  description: string;
}

export const BRAND_SUFFIX = " | MyTamga";

/** Пути страниц в виде ключей словаря. */
export const SEO_COPY: Record<Locale, Record<IndexablePath, PageCopy>> = {
  ru: {
    "": {
      title: "Код ТН ВЭД и расчёт таможенных платежей в Узбекистане — MyTamga",
      description:
        "MyTamga помогает импортёрам и таможенным брокерам определить код ТН ВЭД, рассчитать пошлину, НДС и акциз и проверить требования к товару при ввозе в Узбекистан.",
    },
    "/pricing": {
      title: "Тарифы: подписка для импортёров и брокеров",
      description:
        "Тарифы MyTamga для импортёров и таможенных брокеров: что входит в каждый, сколько мест в команде и как оформить подписку на приложение для расчёта платежей.",
    },
    "/support": {
      title: "Поддержка: помощь по приложению и подписке",
      description:
        "Поддержка MyTamga: напишите на почту, если нужна помощь с приложением для кода ТН ВЭД и расчёта таможенных платежей, подпиской или оплатой. Отвечаем по рабочим дням.",
    },
    "/delete-account": {
      title: "Удаление аккаунта MyTamga: как удалить свои данные",
      description:
        "Как удалить аккаунт MyTamga: в приложении или письмом в поддержку, что удаляется, что остаётся обезличенным и как отменить подписку в магазине приложений.",
    },
    "/privacy": {
      title: "Политика конфиденциальности сервиса расчёта пошлин",
      description:
        "Политика конфиденциальности MyTamga: какие данные получают сайт и приложение для расчёта таможенных платежей, зачем они нужны и как вы можете ими управлять.",
    },
    "/terms": {
      title: "Условия использования приложения для расчёта пошлин",
      description:
        "Условия использования MyTamga: правила работы с приложением для определения кода ТН ВЭД и расчёта таможенных платежей, права и обязанности пользователя и сервиса.",
    },
    "/offer": {
      title: "Публичная оферта на подписку для импортёров",
      description:
        "Публичная оферта MyTamga на подписку: условия заказа и оплаты тарифов приложения для импортёров и таможенных брокеров в Узбекистане и реквизиты компании.",
    },
  },
  uz: {
    "": {
      title: "TIF TN kodi va bojxona to‘lovlari hisob-kitobi — MyTamga",
      description:
        "MyTamga importchi va brokerlarga TIF TN kodini aniqlash, boj, QQS va aksizni hisoblash hamda O‘zbekistonga import tovar talablarini tekshirishda yordam beradi.",
    },
    "/pricing": {
      title: "Tariflar: importchi va brokerlar uchun obuna",
      description:
        "MyTamga tariflari importchi va brokerlar uchun: har bir tarifga nima kiradi, jamoada nechta o‘rin bor va bojxona hisob-kitobi ilovasiga qanday obuna bo‘lish.",
    },
    "/support": {
      title: "Qo‘llab-quvvatlash: ilova va obuna yordami",
      description:
        "MyTamga yordam xizmati: TIF TN kodi va bojxona to‘lovlari ilovasi, obuna yoki to‘lov bo‘yicha yordam kerak bo‘lsa, pochtaga yozing. Ish kunlari javob beramiz.",
    },
    "/delete-account": {
      title: "Akkauntni o‘chirish: ma’lumotlar qanday o‘chadi",
      description:
        "MyTamga akkauntini qanday o‘chirish mumkin: ilovada yoki yordam xizmatiga xat orqali, nima o‘chadi, nima shaxssiz qoladi va obunani qanday bekor qilish.",
    },
    "/privacy": {
      title: "Maxfiylik siyosati: bojxona hisob-kitobi ilovasi",
      description:
        "MyTamga maxfiylik siyosati: bojxona to‘lovlarini hisoblash uchun sayt va ilova qanday ma’lumot oladi, ular nima uchun kerak va siz ularni qanday boshqarasiz.",
    },
    "/terms": {
      title: "Bojxona hisob-kitobi ilovasidan foydalanish shartlari",
      description:
        "MyTamga foydalanish shartlari: TIF TN kodini aniqlash va bojxona to‘lovlarini hisoblash ilovasi qoidalari, foydalanuvchi va xizmatning huquq va majburiyatlari.",
    },
    "/offer": {
      title: "Importchilar uchun obuna bo‘yicha ommaviy oferta",
      description:
        "MyTamga obunasi bo‘yicha ommaviy oferta: importchi va bojxona brokerlari uchun ilova tariflarini buyurtma va to‘lov shartlari hamda kompaniya rekvizitlari.",
    },
  },
  en: {
    "": {
      title: "HS Code and Customs Duty Calculator for Uzbekistan — MyTamga",
      description:
        "MyTamga helps importers and customs brokers find the HS code, calculate customs duty, VAT and excise, and check product requirements for import to Uzbekistan.",
    },
    "/pricing": {
      title: "Pricing: subscriptions for importers and brokers",
      description:
        "MyTamga pricing for importers and customs brokers: what each plan includes, how many seats the team gets and how to subscribe to the customs payment app.",
    },
    "/support": {
      title: "Support: help with the app and your subscription",
      description:
        "MyTamga support: email us if you need help with the app for HS codes and customs payment calculation, your subscription or a payment. We reply on working days.",
    },
    "/delete-account": {
      title: "Delete your account: how your data is removed",
      description:
        "How to delete your MyTamga account: in the app or by writing to support, what is deleted, what stays anonymised, and how to cancel a subscription in the app store.",
    },
    "/privacy": {
      title: "Privacy Policy of the customs duty calculator app",
      description:
        "MyTamga privacy policy: what data the website and the customs payment app receive, why it is needed, how it is handled and how you can manage it yourself.",
    },
    "/terms": {
      title: "Terms of Use of the customs duty calculator app",
      description:
        "MyTamga terms of use: rules for working with the app that finds HS codes and calculates customs payments for imports to Uzbekistan, and the duties of both sides.",
    },
    "/offer": {
      title: "Public offer for the MyTamga app subscription",
      description:
        "MyTamga public offer for the subscription: terms for ordering and paying app plans for importers and customs brokers in Uzbekistan, with the company details.",
    },
  },
  zh: {
    "": {
      title: "乌兹别克斯坦 HS编码查询与进口关税计算 — MyTamga",
      description:
        "MyTamga 帮助进口商和报关公司确定乌兹别克斯坦 HS编码，计算进口关税、增值税和消费税，并核对商品进口要求，为后续清关做好准备。",
    },
    "/pricing": {
      title: "价格：面向进口商与报关公司的订阅",
      description:
        "MyTamga 价格方案：面向进口商与报关公司，了解各方案包含的功能、团队席位数量，以及如何订阅用于计算进口关税的应用。",
    },
    "/support": {
      title: "客户支持：应用与订阅问题",
      description:
        "MyTamga 客户支持：使用 HS编码与进口关税计算应用、订阅或付款时遇到问题，请发邮件联系我们，我们会在工作日回复。",
    },
    "/delete-account": {
      title: "删除账户：如何删除您的数据",
      description:
        "如何删除 MyTamga 账户：在应用内删除或写信给客户支持，哪些数据会被删除、哪些以匿名方式保留，以及如何在应用商店取消订阅。",
    },
    "/privacy": {
      title: "隐私政策",
      description:
        "MyTamga 隐私政策：网站和进口关税计算应用会获取哪些数据、用途是什么、如何保存，以及您可以如何管理这些数据。",
    },
    "/terms": {
      title: "应用使用条款",
      description:
        "MyTamga 使用条款：使用 HS编码查询与进口关税计算应用的规则，以及用户与服务双方的权利和义务。",
    },
    "/offer": {
      title: "订阅公开要约",
      description:
        "MyTamga 订阅公开要约：面向乌兹别克斯坦进口商与报关公司的应用方案下单与付款条件、期限、退款规定及公司信息。",
    },
  },
};

export function seoCopy(lang: Locale, path: IndexablePath): PageCopy {
  return SEO_COPY[lang][path];
}

/** Заголовок целиком, как его увидит поисковик. */
export function fullTitle(lang: Locale, path: IndexablePath): string {
  const { title } = SEO_COPY[lang][path];
  return path === "" ? title : `${title}${BRAND_SUFFIX}`;
}

/** Метаданные страницы: свой canonical, hreflang, заголовок, описание, Open Graph. */
export function pageMetadata(lang: Locale, path: IndexablePath): Metadata {
  const { title, description } = SEO_COPY[lang][path];
  const shown = fullTitle(lang, path);

  return {
    title: path === "" ? { absolute: title } : title,
    description,
    alternates: seoAlternates(lang, path),
    openGraph: openGraphFor(lang, path, shown, description),
    twitter: twitterFor(shown, description),
  };
}
