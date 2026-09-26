// REVIEW(translation): draft — must be checked by a native speaker before launch.
// Latin script. oʻ/gʻ are written with U+2018 (‘) and the tutuq belgisi with
// U+2019 (’). U+02BB and U+02BC are the formally correct code points, but
// Manrope carries no glyph for them: measured through CSS.getPlatformFontsForNode,
// the browser drew them in system Helvetica — a thinner, foreign mark in every
// other Uzbek word. ‘ and ’ come from Manrope itself, and they are what most
// Uzbek text online already uses. Never the plain apostrophe.
// To revert: swap ‘→ʻ and ’→ʼ in this file.
import type { Dictionary } from "./ru";

const P = "Matn uchun joy";

export const uz: Dictionary = {
  meta: {
    title: "MyTamga — tovardan deklarantgacha tushunarli import",
    description:
      "MyTamga TIF TN kodini aniqlash, bojxona to‘lovlarini hisoblash, tovarga qo‘yiladigan talablarni tekshirish va keyingi rasmiylashtirish uchun zarur bo‘lgan hamma narsani tayyorlashga yordam beradi.",
  },
  placeholder: P,
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
    kicker: P,
    title: ["Tushunarli import —", "tovardan", "deklarantgacha."],
    lead: "MyTamga TIF TN kodini aniqlash, bojxona to‘lovlarini hisoblash, tovarga qo‘yiladigan talablarni tekshirish va keyingi rasmiylashtirish uchun zarur bo‘lgan hamma narsani tayyorlashga yordam beradi.",
    actions: "Asosiy harakatlar",
    contact: "Biz bilan bog‘laning",
    learnMore: "Biz haqimizda",
    sceneLoading: "Sahna yuklanmoqda",
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
      { id: "result-1", title: P, body: P },
      { id: "result-2", title: P, body: P },
      { id: "result-3", title: P, body: P },
    ],
    cta: "Ariza qoldirish",
  },
  about: {
    kicker: "Biz haqimizda",
    title: P,
    body: P,
    facts: [
      { id: "fact-1", label: P, value: P },
      { id: "fact-2", label: P, value: P },
      { id: "fact-3", label: P, value: P },
    ],
  },
  contact: {
    kicker: "Aloqa",
    title: "Tovaringiz haqida aytib bering",
    body: "Nima olib kelayotganingizni tasvirlab bering. TIF TN kodi va to‘lovlar hisobi bilan javob beramiz.",
    channels: [
      { id: "phone", label: "Telefon", value: P, href: null },
      { id: "email", label: "Elektron pochta", value: P, href: null },
      { id: "place", label: "Manzil", value: P, href: null },
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
    catalogUnavailable:
      "Narxlar vaqtincha mavjud emas. Bizga yozing — amaldagi shartlarni yuboramiz.",
    renewManual: "30 kunga bir martalik to‘lov. Qo‘lda uzaytiriladi.",
    renewAuto: "Avtomatik uzaytiriladi, istalgan vaqtda bekor qilish mumkin.",
    cta: {
      included: "Allaqachon kiritilgan",
      buy: "Rasmiylashtirish",
      request: "So‘rov yuborish",
      download: "Ilovani yuklab olish",
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
      pay: "To‘lovga o‘tish",
      requestSent: "So‘rov yuborildi — biz siz bilan bog‘lanamiz.",
      ownerOnly: "To‘lovni tashkilot egasi rasmiylashtiradi.",
      storeManaged:
        "Obuna ilovalar do‘konida rasmiylashtirilgan. Uni o‘sha yerda boshqarish mumkin.",
      uzPhoneOnly:
        "Saytda to‘lov O‘zbekiston raqami bilan mumkin. So‘rov yuboring — boshqa usulni taklif qilamiz.",
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
  },
  footer: {
    legal: P,
  },
};
