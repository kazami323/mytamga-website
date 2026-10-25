import { test } from "node:test";
import assert from "node:assert/strict";

import { LOCALES } from "../lib/i18n/config.ts";
import { COMPANY, companyFor } from "../lib/legal/company.ts";
import {
  INDEXABLE_PATHS,
  highestPlanPrice,
  mobileApplicationJsonLd,
  organizationJsonLd,
  pageUrl,
  serializeJsonLd,
  seoAlternates,
  verificationTags,
  websiteJsonLd,
} from "../lib/seo.ts";
import { SEO_COPY, fullTitle, pageMetadata } from "../lib/seo-copy.ts";

delete process.env.NEXT_PUBLIC_SITE_URL;
const SITE = "https://mytamga.uz";

test("canonical указывает на саму страницу на её языке", () => {
  for (const lang of LOCALES) {
    for (const path of INDEXABLE_PATHS) {
      assert.equal(seoAlternates(lang, path).canonical, `${SITE}/${lang}${path}`);
    }
  }
});

test("hreflang: ru, uz, en, zh-Hans и x-default на русскую версию", () => {
  for (const lang of LOCALES) {
    for (const path of INDEXABLE_PATHS) {
      const { languages } = seoAlternates(lang, path);
      assert.deepEqual(Object.keys(languages).sort(), ["en", "ru", "uz", "x-default", "zh-Hans"]);
      assert.equal(languages.uz, `${SITE}/uz${path}`);
      assert.equal(languages["zh-Hans"], `${SITE}/zh${path}`);
      assert.equal(languages["x-default"], `${SITE}/ru${path}`);
    }
  }
});

test("pageMetadata: свой canonical, openGraph с url страницы, шаблон заголовка", () => {
  const home = pageMetadata("en", "");
  assert.deepEqual(home.title, { absolute: SEO_COPY.en[""].title });
  const og = pageMetadata("uz", "/pricing").openGraph as { url: string; locale: string; siteName: string };
  assert.equal(og.url, `${SITE}/uz/pricing`);
  assert.equal(og.locale, "uz_UZ");
  assert.equal(og.siteName, "MyTamga");
  assert.equal(pageMetadata("ru", "/terms").title, SEO_COPY.ru["/terms"].title);
});

test("заголовки и описания уникальны и в пределах длины", () => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();

  for (const lang of LOCALES) {
    for (const path of INDEXABLE_PATHS) {
      const title = fullTitle(lang, path);
      const { description } = SEO_COPY[lang][path];
      const [titleMin, titleMax, descMin, descMax] =
        lang === "zh" ? [12, 40, 45, 110] : [50, 65, 140, 165];

      const titleLength = [...title].length;
      const descLength = [...description].length;
      assert.ok(titleLength >= titleMin && titleLength <= titleMax, `${lang}${path} title ${titleLength}`);
      assert.ok(descLength >= descMin && descLength <= descMax, `${lang}${path} description ${descLength}`);
      assert.ok(title.includes("MyTamga"), `${lang}${path}: нет бренда`);
      titles.add(title);
      descriptions.add(description);
    }
  }

  assert.equal(titles.size, LOCALES.length * INDEXABLE_PATHS.length);
  assert.equal(descriptions.size, LOCALES.length * INDEXABLE_PATHS.length);
});

test("sitemap: все языки × страницы, без /api и /pay", async () => {
  const { default: sitemap } = await import("../app/sitemap.ts");
  const entries = sitemap();

  assert.equal(entries.length, LOCALES.length * INDEXABLE_PATHS.length);
  for (const lang of LOCALES) {
    for (const path of INDEXABLE_PATHS) {
      const entry = entries.find((e) => e.url === pageUrl(lang, path));
      assert.ok(entry, `${lang}${path}`);
      assert.equal(Object.keys(entry.alternates?.languages ?? {}).length, 5);
    }
  }
  for (const entry of entries) {
    assert.ok(!entry.url.includes("/api"));
    assert.ok(!entry.url.includes("/pay"));
  }
});

test("robots: запрещает /api/ и /pay/, указывает sitemap", async () => {
  const { default: robots } = await import("../app/robots.ts");
  const result = robots();
  const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;

  assert.deepEqual(rules.disallow, ["/api/", "/*/pay/"]);
  assert.equal(result.sitemap, `${SITE}/sitemap.xml`);
});

test("JSON-LD: валидный JSON, `<` экранирован, оценок и отзывов нет", () => {
  const company = companyFor("ru");
  const org = organizationJsonLd({
    legalName: company.legalName,
    address: company.address,
    phone: company.phone,
    email: company.supportEmail,
    googlePlay: "https://play.google.com/store/apps/details?id=uz.tamga.navigator",
  });
  const app = mobileApplicationJsonLd({ googlePlay: null, highPrice: 399000 });
  const all = [org, websiteJsonLd("zh"), app];

  for (const data of all) {
    const text = serializeJsonLd(data);
    assert.deepEqual(JSON.parse(text), data);
    assert.ok(!/aggregateRating|review/i.test(text));
  }

  assert.equal(org.telephone, COMPANY.phone);
  assert.equal(org.email, COMPANY.supportEmail);
  assert.equal(org.legalName, company.legalName);
  assert.equal(org.logo, `${SITE}/brand/mytamga-logo.png`);
  assert.deepEqual(org.sameAs, ["https://play.google.com/store/apps/details?id=uz.tamga.navigator"]);
  assert.equal(websiteJsonLd("zh").inLanguage, "zh-Hans");
  assert.equal(serializeJsonLd({ a: "</script>" }).includes("<"), false);
  assert.equal(app.offers?.lowPrice, 0);
  assert.equal(app.offers?.highPrice, 399000);
  assert.equal("sameAs" in organizationJsonLd({ ...{ legalName: "", address: "", phone: "", email: "" }, googlePlay: null }), false);
});

test("highestPlanPrice — максимум месячных цен, годовые и «по заявке» не учитываются", () => {
  const plan = { priceMonthly: 0, priceYearly: null, currency: "UZS", isRequestOnly: false };
  assert.equal(highestPlanPrice(null), null);
  assert.equal(highestPlanPrice([plan]), null);
  assert.equal(
    highestPlanPrice([
      plan,
      { ...plan, priceMonthly: 39000, priceYearly: 390000 },
      { ...plan, priceMonthly: 999999, isRequestOnly: true },
    ]),
    39000,
  );
});

test("подтверждение владения: теги только при заданных переменных", () => {
  const prev = [process.env.GOOGLE_SITE_VERIFICATION, process.env.YANDEX_VERIFICATION];
  try {
    delete process.env.GOOGLE_SITE_VERIFICATION;
    delete process.env.YANDEX_VERIFICATION;
    assert.equal(verificationTags(), undefined);
    process.env.GOOGLE_SITE_VERIFICATION = "g-token";
    assert.deepEqual(verificationTags(), { google: "g-token" });
    process.env.YANDEX_VERIFICATION = "y-token";
    assert.deepEqual(verificationTags(), { google: "g-token", yandex: "y-token" });
  } finally {
    for (const [i, key] of ["GOOGLE_SITE_VERIFICATION", "YANDEX_VERIFICATION"].entries()) {
      if (prev[i] === undefined) delete process.env[key];
      else process.env[key] = prev[i];
    }
  }
});
