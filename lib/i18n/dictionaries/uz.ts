// REVIEW(translation): draft — must be checked by a native speaker before launch.
// Latin script. oʻ and gʻ use U+02BB, the tutuq belgisi (maʼlum) uses U+02BC —
// never the plain apostrophe.
import type { Dictionary } from "./ru";

const P = "Matn uchun joy";

export const uz: Dictionary = {
  meta: {
    title: "MyTamga — tovardan deklarantgacha tushunarli import",
    description:
      "MyTamga TIF TN kodini aniqlash, bojxona toʻlovlarini hisoblash, tovarga qoʻyiladigan talablarni tekshirish va keyingi rasmiylashtirish uchun zarur boʻlgan hamma narsani tayyorlashga yordam beradi.",
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
    light: "Yorugʻ mavzu",
  },
  preloader: {
    loading: "Sahifa yuklanmoqda",
  },
  hero: {
    kicker: P,
    title: ["Tushunarli import —", "tovardan", "deklarantgacha."],
    lead: "MyTamga TIF TN kodini aniqlash, bojxona toʻlovlarini hisoblash, tovarga qoʻyiladigan talablarni tekshirish va keyingi rasmiylashtirish uchun zarur boʻlgan hamma narsani tayyorlashga yordam beradi.",
    actions: "Asosiy harakatlar",
    contact: "Biz bilan bogʻlaning",
    learnMore: "Biz haqimizda",
    sceneLoading: "Sahna yuklanmoqda",
  },
  capabilities: {
    kicker: "Imkoniyatlar",
    title: "Deklaratsiya topshirishdan oldin kerak boʻlgan hamma narsa",
    items: [
      {
        id: "code",
        title: "TIF TN kodi",
        body: "Tovar tavsifi, tarkibi va vazifasiga koʻra tovar nomenklaturasi kodini aniqlaymiz.",
      },
      {
        id: "payments",
        title: "Toʻlovlar hisobi",
        body: "Import qiymati deklaratsiya topshirilishidan oldin maʼlum boʻlishi uchun bojxona toʻlovlarini oldindan hisoblaymiz.",
      },
      {
        id: "requirements",
        title: "Tovarga talablar",
        body: "Aynan sizning tovaringiz uchun qanday ruxsatnomalar kerakligini tekshiramiz.",
      },
      {
        id: "documents",
        title: "Hujjatlarni tayyorlash",
        body: "Keyingi rasmiylashtirish uchun deklarantga topshiriladigan hujjatlar toʻplamini yigʻamiz.",
      },
    ],
  },
  howItWorks: {
    kicker: "Bu qanday ishlaydi",
    title: "Tayyor toʻplamgacha uch qadam",
    steps: [
      { id: "describe", title: "Tovarni tasvirlab bering", body: "Nomi, tarkibi, vazifasi va kelib chiqish mamlakati." },
      { id: "receive", title: "Kod va hisob-kitobni oling", body: "TIF TN kodi va bojxona toʻlovlari — deklaratsiyadan oldin." },
      { id: "collect", title: "Hujjatlarni oling", body: "Tayyor toʻplamni deklarantga topshirish qoladi." },
    ],
  },
  calculation: {
    kicker: "Hisob-kitob",
    title: "Hisoblash uchun nima kerak",
    inputs: [
      { id: "goods", title: "Tovar tavsifi", body: "Nomi, tarkibi va vazifasi." },
      { id: "origin", title: "Kelib chiqish mamlakati", body: "Qoʻllaniladigan stavkalar unga bogʻliq." },
      { id: "value", title: "Bojxona qiymati", body: "Bitim narxi va unga bogʻliq xarajatlar." },
      { id: "weight", title: "Ogʻirlik va hajm", body: "Brutto, netto va partiya oʻlchamlari." },
    ],
    resultKicker: "Siz nimaga ega boʻlasiz",
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
    body: "Nima olib kelayotganingizni tasvirlab bering. TIF TN kodi va toʻlovlar hisobi bilan javob beramiz.",
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
      "Onlayn arizalar hali ulanmagan. Yonidagi aloqa maʼlumotlari orqali bogʻlaning — kiritgan maʼlumotlaringiz saqlanib qoldi.",
    failed: "Yuborib boʻlmadi. Qayta urinib koʻring yoki bizga toʻgʻridan-toʻgʻri yozing.",
    errors: {
      "name.short": "Ismingizni kiriting — kamida 2 ta belgi.",
      "name.long": "Ism juda uzun.",
      "contact.missing": "Telefon yoki pochtani qoldiring.",
      "contact.invalid": "Bu telefon yoki pochtaga oʻxshamaydi.",
      "company.long": "Kompaniya nomi juda uzun.",
      "goods.short": "Tovarni tasvirlab bering — kamida 10 ta belgi.",
      "goods.long": "Tavsif juda uzun.",
    },
  },
  footer: {
    legal: P,
  },
};
