// REVIEW(translation): draft — must be checked by a native speaker before launch.
// Latin script. oʻ/gʻ are written with U+2018 (‘) and the tutuq belgisi with
// U+2019 (’). U+02BB and U+02BC are the formally correct code points, but
// Manrope carries no glyph for them: measured through CSS.getPlatformFontsForNode,
// the browser drew them in system Helvetica — a thinner, foreign mark in every
// other Uzbek word. ‘ and ’ come from Manrope itself, and they are what most
// Uzbek text online already uses. Never the plain apostrophe.
// To revert: swap ‘→ʻ and ’→ʼ in this file.
import type { Dictionary } from "./ru";
import { groupDigits } from "../../billing/format.ts";
import { companyFor, companyLine } from "../../legal/company.ts";
import { REFERENCE_COUNTS } from "../../reference-counts.ts";

const company = companyFor("uz");

export const uz: Dictionary = {
  meta: {
    title: "MyTamga — tovardan deklarantgacha tushunarli import",
    description:
      "MyTamga TIF TN kodini aniqlash, bojxona to‘lovlarini hisoblash, tovarga qo‘yiladigan talablarni tekshirish va keyingi rasmiylashtirish uchun zarur bo‘lgan hamma narsani tayyorlashga yordam beradi.",
  },
  nav: {
    home: "Bosh sahifa",
    services: "Xizmatlar",
    calc: "Hisob-kitob",
    about: "Biz haqimizda",
    contacts: "Aloqa",
    primary: "Asosiy navigatsiya",
    footer: "Pastki navigatsiya",
    openMenu: "Menyuni ochish",
    closeMenu: "Menyuni yopish",
    language: "Til",
  },
  theme: {
    light: "Yorug‘ mavzu",
  },
  preloader: {
    loading: "Sahifa yuklanmoqda",
  },
  hero: {
    kicker: "O‘zbekiston importchilari va bojxona brokerlari uchun",
    title: ["Tushunarli import —", "tovardan", "deklarantgacha."],
    lead: "MyTamga TIF TN kodini aniqlash, bojxona to‘lovlarini hisoblash, tovarga qo‘yiladigan talablarni tekshirish va keyingi rasmiylashtirish uchun zarur bo‘lgan hamma narsani tayyorlashga yordam beradi.",
    actions: "Asosiy harakatlar",
    contact: "Biz bilan bog‘laning",
    learnMore: "Biz haqimizda",
    sceneLoading: "Sahna yuklanmoqda",
    // Первый экран-портал: камера пролетает в букву, внутри — объяснение.
    portalEnter: "Ichkariga qarang",
    portalHint: "Pastga aylantiring — harf ichiga kiramiz",
    portalChoose: "Kirish uchun harfni tanlang",
  },
  capabilities: {
    kicker: "Imkoniyatlar",
    title: "Deklaratsiya topshirishdan oldin kerak bo‘lgan hamma narsa",
    items: [
      {
        id: "code",
        title: "TIF TN kodi",
        body: "Tovar tavsifi, tarkibi va vazifasiga ko‘ra tovar nomenklaturasi kodini aniqlaymiz.",
      },
      {
        id: "payments",
        title: "To‘lovlar hisobi",
        body: "Import qiymati deklaratsiya topshirilishidan oldin ma’lum bo‘lishi uchun bojxona to‘lovlarini oldindan hisoblaymiz.",
      },
      {
        id: "requirements",
        title: "Tovarga talablar",
        body: "Aynan sizning tovaringiz uchun qanday ruxsatnomalar kerakligini tekshiramiz.",
      },
      {
        id: "documents",
        title: "Hujjatlarni tayyorlash",
        body: "Keyingi rasmiylashtirish uchun deklarantga topshiriladigan hujjatlar to‘plamini yig‘amiz.",
      },
    ],
  },
  howItWorks: {
    kicker: "Bu qanday ishlaydi",
    title: "Tayyor to‘plamgacha uch qadam",
    steps: [
      { id: "describe", title: "Tovarni tasvirlab bering", body: "Nomi, tarkibi, vazifasi va kelib chiqish mamlakati." },
      { id: "receive", title: "Kod va hisob-kitobni oling", body: "TIF TN kodi va bojxona to‘lovlari — deklaratsiyadan oldin." },
      { id: "collect", title: "Hujjatlarni oling", body: "Tayyor to‘plamni deklarantga topshirish qoladi." },
    ],
  },
  calculation: {
    kicker: "Hisob-kitob",
    title: "Hisoblash uchun nima kerak",
    inputs: [
      { id: "goods", title: "Tovar tavsifi", body: "Nomi, tarkibi va vazifasi." },
      { id: "origin", title: "Kelib chiqish mamlakati", body: "Qo‘llaniladigan stavkalar unga bog‘liq." },
      { id: "value", title: "Bojxona qiymati", body: "Bitim narxi va unga bog‘liq xarajatlar." },
      { id: "weight", title: "Og‘irlik va hajm", body: "Brutto, netto va partiya o‘lchamlari." },
    ],
    resultKicker: "Siz nimaga ega bo‘lasiz",
    results: [
      { id: "result-1", title: "Moddalar bo‘yicha to‘lovlar", body: "Boj to‘lovi, QQS, aksiz va bojxona yig‘imlari — har biri alohida va jami, so‘mda." },
      { id: "result-2", title: "Ruxsat beruvchi hujjatlar", body: "Aynan shu tovar uchun kerak bo‘lgan sertifikatlar, litsenziyalar va ruxsatnomalar." },
      { id: "result-3", title: "Har bir raqamning asosi", body: "Stavka va u qo‘llangan qonun normasi — lex.uz havolasi bilan." },
    ],
    cta: "Ariza qoldirish",
  },
  about: {
    kicker: "Biz haqimizda",
    title: "Taxminsiz import",
    body: "MyTamga — O‘zbekistonga tovar olib kiruvchilar uchun xizmat. Bojxona rasmiylashtiruvi narxi odatda qarorni o‘zgartirishga kech bo‘lganda ma’lum bo‘ladi. Biz uni oldindan hisoblaymiz — lex.uz saytida e’lon qilingan qonun va qarorlardan yig‘ilgan ma’lumotnoma asosida. Mijoz va deklarant bitta ishda ishlaydi: hujjatlar, hisob-kitob va yozishmalar — bir joyda.",
    // Цифры — из lib/reference-counts.ts: одно место на четыре языка.
    facts: [
      { id: "fact-1", label: "ma’lumotnomadagi TIF TN pozitsiyalari", value: groupDigits(REFERENCE_COUNTS.tnvedPositions) },
      { id: "fact-2", label: "bojxona boji qoidalari", value: groupDigits(REFERENCE_COUNTS.dutyRules) },
      { id: "fact-3", label: "notarif qoidalar", value: groupDigits(REFERENCE_COUNTS.nonTariffRules) },
    ],
  },
  contact: {
    kicker: "Aloqa",
    title: "Tovaringiz haqida aytib bering",
    body: "Nima olib kelayotganingizni tasvirlab bering. TIF TN kodi va to‘lovlar hisobi bilan javob beramiz.",
    channels: [
      { id: "phone", label: "Telefon", value: company.phone, href: company.phoneHref },
      { id: "email", label: "Elektron pochta", value: company.supportEmail, href: `mailto:${company.supportEmail}` },
      { id: "place", label: "Manzil", value: company.shortAddress, href: company.mapsUrl },
    ],
  },
  form: {
    name: "Ism",
    contact: "Telefon yoki pochta",
    company: "Kompaniya",
    goods: "Nima olib kelyapsiz",
    goodsPlaceholder: "Nomi, tarkibi, vazifasi, kelib chiqish mamlakati.",
    optional: "ixtiyoriy",
    submit: "Arizani yuborish",
    sending: "Yuborilmoqda…",
    unavailable:
      "Onlayn arizalar hali ulanmagan. Yonidagi aloqa ma’lumotlari orqali bog‘laning — kiritgan ma’lumotlaringiz saqlanib qoldi.",
    failed: "Yuborib bo‘lmadi. Qayta urinib ko‘ring yoki bizga to‘g‘ridan-to‘g‘ri yozing.",
    errors: {
      "name.short": "Ismingizni kiriting — kamida 2 ta belgi.",
      "name.long": "Ism juda uzun.",
      "contact.missing": "Telefon yoki pochtani qoldiring.",
      "contact.invalid": "Bu telefon yoki pochtaga o‘xshamaydi.",
      "company.long": "Kompaniya nomi juda uzun.",
      "goods.short": "Tovarni tasvirlab bering — kamida 10 ta belgi.",
      "goods.long": "Tavsif juda uzun.",
    },
  },
  billing: {
    nav: "Tariflar",
    metaTitle: "MyTamga tariflari — importchilar va brokerlar uchun obuna",
    metaDescription:
      "MyTamga tariflari: har biriga nima kiradi, jamoada qancha o‘rin bor va ilova uchun obunani qanday rasmiylashtirish mumkin.",
    kicker: "Tariflar",
    title: "MyTamga obunasi",
    lead: "Ilova va sayt uchun bitta ruxsat. Bu yerda rasmiylashtirilgan tarif barcha qurilmalarda ishlaydi.",
    pricePending: "Muhokama qilinmoqda",
    perMonth: "{amount} so‘m/oy",
    perYear: "{amount} so‘m/yil",
    free: "Bepul",
    freeForever: "Doimo bepul — bu sinov davri emas",
    byRequest: "So‘rov bo‘yicha",
    fromMonthly: "{amount} so‘m/oydan",
    period: {
      label: "To‘lov davri",
      monthly: "Oy",
      yearly: "Yil",
    },
    yearlyAs: "Yil {months} oy narxida",
    seatsIncluded: "Jamoada {count} o‘rin",
    extraSeat: "Qo‘shimcha o‘rin uchun {amount} so‘m",
    unlimited: "Cheklovsiz",
    invoiceForCompany: "Shartlar va hisob-faktura kompaniya uchun",
    yearlySaving: "Foyda {amount} so‘m",
    catalogUnavailable:
      "Narxlar vaqtincha mavjud emas. Bizga yozing — amaldagi shartlarni yuboramiz.",
    renewManual: "30 kunga bir martalik to‘lov. Qo‘lda uzaytiriladi.",
    renewAuto: "Avtomatik uzaytiriladi, istalgan vaqtda bekor qilish mumkin.",
    cta: {
      included: "Allaqachon kiritilgan",
      buy: "Rasmiylashtirish",
      request: "So‘rov yuborish",
      download: "Ilovani yuklab olish",
      lead: "So‘rov qoldirish",
    },
    providers: {
      label: "To‘lov usuli",
      connecting: "Ulanmoqda",
    },
    checkout: {
      title: "Rasmiylashtirish",
      phoneLabel: "Telefon raqami",
      phoneHint: "O‘zbekiston raqami, masalan +998 90 123 45 67",
      sendCode: "Kod olish",
      codeLabel: "SMS dagi kod",
      codeHint: "Xabardagi olti raqam",
      confirm: "Tasdiqlash",
      changeNumber: "Raqamni o‘zgartirish",
      signedIn: "Kirish bajarildi",
      signOut: "Chiqish",
      currentPlan: "Amaldagi tarif",
      until: "{date} gacha amal qiladi",
      scheduled: "{date} dan — {plan}",
      amountToPay: "To‘lov summasi: {amount} so‘m",
      continueToClick: "Click’ga o‘tish",
      cancelPayment: "Bekor qilish",
      effect: {
        new: "Yangi tarif: to‘lovdan keyin darhol ochiladi.",
        newUntil: "Yangi tarif: to‘lovdan keyin darhol ochiladi va {date} gacha amal qiladi.",
        extend: "Joriy tarifni uzaytirish: muddat ko‘payadi.",
        extendUntil: "Joriy tarifni uzaytirish: {date} gacha amal qiladi.",
        upgrade: "Oshirish: joriy tarif qoldig‘i yangi tarif kunlariga qayta hisoblanib, muddatga qo‘shiladi.",
        defer: "Joriy tarif tugagach boshlanadi: hozir hech narsa o‘zgarmaydi.",
      },
      pay: "To‘lovga o‘tish",
      requestSent: "So‘rov yuborildi — biz siz bilan bog‘lanamiz.",
      ownerOnly: "To‘lovni tashkilot egasi rasmiylashtiradi.",
      storeManaged:
        "Obuna ilovalar do‘konida rasmiylashtirilgan. Uni o‘sha yerda boshqarish mumkin.",
      uzPhoneOnly:
        `Saytda to‘lov O‘zbekiston raqami bilan mumkin. Boshqa raqam bilan ${company.supportEmail} manziliga yozing — boshqa usulni taklif qilamiz.`,
      pricesPending:
        "Narxlar hali muhokama qilinmoqda. To‘lov ochilganda xabar beramiz.",
    },
    errors: {
      rate: "Juda tez. {seconds} s dan keyin qayta urinib ko‘ring.",
      rateLater: "Juda tez. Keyinroq urinib ko‘ring.",
      forbidden: "To‘lovni tashkilot egasi rasmiylashtiradi.",
      store: "Obuna ilovalar do‘konida rasmiylashtirilgan. Uni o‘sha yerda boshqarish mumkin.",
      unavailable: "Onlayn to‘lov ulanmoqda. Bizga yozing — ruxsatni ochamiz.",
      requestOnly: "Bu tarif so‘rov bo‘yicha rasmiylashtiriladi.",
      noOrganization: "Tashkilot topilmadi. Qaytadan kiring.",
      signedOut: "Sessiya tugadi. Qaytadan kiring.",
      network: "Server bilan bog‘lanib bo‘lmadi. Yana urinib ko‘ring.",
      checkoutConflict: "Bu tarifni hozir to‘lab bo‘lmaydi: u muddatsiz berilgan yoki joriy tarifdan keyin boshqa tarif allaqachon to‘langan. Bizga yozing — hal qilamiz.",
      checkoutPerpetual: "Bu tarifni to‘lab bo‘lmaydi: u muddatsiz berilgan, faqat kengroq tarifni to‘lash mumkin.",
      checkoutScheduled: "Joriy tarifdan keyin boshqa tarif ({plan}) allaqachon to‘langan. Uni yoki kengroq tarifni to‘lash mumkin.",
      phoneInvalid:
        "Raqamni tekshiring: O‘zbekiston raqami kerak, masalan +998 90 123 45 67.",
      codeInvalid: "SMS dagi kod — olti raqam.",
      pricesPending: "To‘lov hozircha ochilmagan.",
    },
    pay: {
      title: "To‘lov",
      waiting: "To‘lovni tekshiryapmiz…",
      success: "To‘landi. MyTamga ilovasini ochingiz — tarif allaqachon ulangan.",
      timeout:
        "To‘lov qayta ishlanmoqda. Agar tarif o‘n daqiqa ichida paydo bo‘lmasa, qo‘llab-quvvatlashga yozing.",
      transaction: "To‘lov raqami: {id}",
      signIn: "To‘lovni tekshirish uchun qaytadan kiring.",
      backToPricing: "Tariflarga",
    },
    legal: {
      offer: "Ommaviy oferta",
      privacy: "Maxfiylik siyosati",
      terms: "Foydalanish shartlari",
      support: "Qo‘llab-quvvatlash",
      updated: "Yangilangan sana: {date}",
      draftNotice: "Hujjat loyihasi. U hali yurist tomonidan tekshirilmagan va kuchga kirmagan.",
      contractLanguage:
        "Shartnoma rus tilida tuziladi. Hujjatning rus tilidagi versiyasini oching.",
      detailsMissing:
        "Ijrochining rekvizitlari to‘lovlar qabul qilinishidan oldin e’lon qilinadi.",
      detailsTitle: "Rekvizitlar",
      supportTitle: "Qo‘llab-quvvatlash",
      supportBody: "Bizga yozing — ish kunlari javob beramiz.",
      openRussian: "Rus tilida ochish",
    },
  },
  footer: {
    // Год ставит сам подвал; юрлицо, ИНН и адрес — из lib/legal/company.ts.
    legal: companyLine("uz"),
    backToTop: "Yuqoriga",
    // Подпись над названием магазина, как на официальных значках. Пока
    // адреса в lib/app-links.ts нет, вместо неё — «скоро».
    appStoreCaption: "Yuklab oling",
    googlePlayCaption: "Yuklab oling",
    comingSoon: "Tez kunda",
  },
};
