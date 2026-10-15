import type { Locale } from "../i18n/config.ts";
import { COMPANY } from "./company.ts";

/**
 * Страница удаления аккаунта (адрес для анкеты Google Play). Текст — по уже
 * опубликованной странице API (apps/api/public/legal/delete-account) и
 * по поведению приложения. Обещаний сверх них здесь нет.
 *
 * Расхождение с опубликованной страницей API: подписку из App Store / Google
 * Play удаление аккаунта не отменяет — её нужно отменить в настройках магазина.
 */

export type DeleteAccountSection = {
  heading: string;
  paragraphs?: string[];
  /** Нумерованные шаги. */
  steps?: string[];
  items?: string[];
  /** Раздел с письмом: после абзацев выводится ссылка на адрес поддержки. */
  mail?: boolean;
};

export type DeleteAccountContent = {
  /** Подпись ссылки в подвале и kicker страницы. */
  linkLabel: string;
  title: string;
  description: string;
  intro: string;
  sections: DeleteAccountSection[];
};

const EMAIL = COMPANY.supportEmail;

const ru: DeleteAccountContent = {
  linkLabel: "Удаление аккаунта",
  title: "Удаление аккаунта MyTamga",
  description:
    "Как удалить аккаунт MyTamga: в приложении или письмом в поддержку, что удаляется, что остаётся обезличенным и как отменить подписку в магазине.",
  intro: "Разработчик: MY TAMGA APP, MCHJ (Ташкент, Узбекистан). Аккаунт можно удалить самостоятельно в приложении.",
  sections: [
    {
      heading: "Как удалить аккаунт в приложении",
      steps: [
        "Откройте приложение MyTamga и войдите в аккаунт.",
        "Перейдите в «Профиль» и нажмите «Удалить аккаунт». Приложение покажет, что будет удалено.",
        "Подтвердите удаление, введя номер телефона аккаунта (если у аккаунта нет номера — слово «УДАЛИТЬ» или DELETE).",
      ],
      paragraphs: ["Аккаунт удаляется сразу, отложенного периода нет."],
    },
    {
      heading: "Что удаляется",
      items: [
        "аккаунт: профиль, имя, номер телефона, адрес электронной почты, настройки;",
        "сессии и вход на всех устройствах;",
        "ваши личные организации вместе с их делами, документами и расчётами;",
        "уведомления.",
      ],
      paragraphs: ["Файлы документов стираются из хранилища в течение короткого времени после удаления."],
    },
    {
      heading: "Что остаётся обезличенным",
      items: [
        "записи журналов (например, журналов безопасности);",
        "платёжные операции.",
      ],
      paragraphs: [
        "Эти записи остаются без привязки к вам и хранятся в течение срока, установленного законодательством.",
      ],
    },
    {
      heading: "Подписки App Store и Google Play",
      paragraphs: [
        "Удаление аккаунта не отменяет подписку, оформленную через App Store или Google Play. Отмените её в настройках подписок магазина, иначе магазин продолжит списывать оплату.",
      ],
    },
    {
      heading: "Если в организации есть другие участники",
      paragraphs: [
        "Если вы единственный владелец организации, в которой есть другие участники, удалить аккаунт нельзя, пока вы не передадите владение другому участнику или не удалите участников.",
        "Если вы участник чужой организации, ваше участие прекращается, а организация и её дела остаются у других участников.",
      ],
    },
    {
      heading: "Нет доступа к приложению",
      mail: true,
      paragraphs: [
        `Напишите на ${EMAIL} с темой «Удаление аккаунта» и укажите номер телефона аккаунта. Если у аккаунта есть адрес электронной почты, пишите с него. Для подтверждения мы можем попросить подтвердить, что номер принадлежит вам. Мы удалим аккаунт в течение 30 дней.`,
        "Никогда не присылайте в письме пароль или код из SMS — мы их не запрашиваем.",
      ],
    },
  ],
};

const uz: DeleteAccountContent = {
  linkLabel: "Akkauntni o‘chirish",
  title: "MyTamga akkauntini o‘chirish",
  description:
    "MyTamga akkauntini qanday o‘chirish: ilovada yoki qo‘llab-quvvatlashga xat orqali, nimalar o‘chiriladi, nimalar shaxssizlantirilib qoladi va do‘kondagi obunani qanday bekor qilish.",
  intro: "Ishlab chiquvchi: MY TAMGA APP, MCHJ (Toshkent, O‘zbekiston). Akkauntni ilovada o‘zingiz o‘chirishingiz mumkin.",
  sections: [
    {
      heading: "Ilovada akkauntni qanday o‘chirish",
      steps: [
        "MyTamga ilovasini oching va akkauntga kiring.",
        "«Profil» bo‘limiga o‘ting va «Akkauntni o‘chirish» tugmasini bosing. Ilova nimalar o‘chirilishini ko‘rsatadi.",
        "Akkaunt telefon raqamini kiritib o‘chirishni tasdiqlang (akkauntda telefon raqami bo‘lmasa — DELETE so‘zi).",
      ],
      paragraphs: ["Akkaunt darhol o‘chiriladi, kechiktirilgan muddat yo‘q."],
    },
    {
      heading: "Nimalar o‘chiriladi",
      items: [
        "akkaunt: profil, ism, telefon raqami, elektron pochta manzili, sozlamalar;",
        "barcha qurilmalardagi sessiyalar va kirish;",
        "shaxsiy tashkilotlaringiz ularning ishlari, hujjatlari va hisob-kitoblari bilan birga;",
        "bildirishnomalar.",
      ],
      paragraphs: ["Hujjat fayllari o‘chirilgandan so‘ng qisqa vaqt ichida saqlash joyidan o‘chiriladi."],
    },
    {
      heading: "Nimalar shaxssizlantirilib qoladi",
      items: ["jurnal yozuvlari (masalan, xavfsizlik jurnallari);", "to‘lov operatsiyalari."],
      paragraphs: [
        "Bu yozuvlar sizga bog‘lanmagan holda qoladi va qonunchilikda belgilangan muddat davomida saqlanadi.",
      ],
    },
    {
      heading: "App Store va Google Play obunalari",
      paragraphs: [
        "Akkauntni o‘chirish App Store yoki Google Play orqali rasmiylashtirilgan obunani bekor qilmaydi. Uni do‘konning obuna sozlamalarida bekor qiling, aks holda do‘kon to‘lovni yechishda davom etadi.",
      ],
    },
    {
      heading: "Tashkilotda boshqa a’zolar bo‘lsa",
      paragraphs: [
        "Agar siz boshqa a’zolari bor tashkilotning yagona egasi bo‘lsangiz, egalikni boshqa a’zoga o‘tkazmaguningizcha yoki a’zolarni o‘chirmaguningizcha akkauntni o‘chirib bo‘lmaydi.",
        "Agar siz boshqa birovning tashkilotida a’zo bo‘lsangiz, a’zoligingiz tugaydi, tashkilot va uning ishlari esa boshqa a’zolarda qoladi.",
      ],
    },
    {
      heading: "Ilovaga kirish imkoni yo‘q bo‘lsa",
      mail: true,
      paragraphs: [
        `${EMAIL} manziliga «Akkauntni o‘chirish» mavzusida xat yozing va akkaunt telefon raqamini ko‘rsating. Agar akkauntda elektron pochta bo‘lsa, o‘sha manzildan yozing. Tasdiqlash uchun raqam sizga tegishli ekanini tasdiqlashingizni so‘rashimiz mumkin. Akkauntni 30 kun ichida o‘chiramiz.`,
        "Xatda hech qachon parol yoki SMS-kodni yubormang — biz ularni so‘ramaymiz.",
      ],
    },
  ],
};

const en: DeleteAccountContent = {
  linkLabel: "Delete account",
  title: "Delete your MyTamga account",
  description:
    "How to delete your MyTamga account: in the app or by emailing support, what is deleted, what is kept in anonymized form, and how to cancel a store subscription.",
  intro: "Developer: MY TAMGA APP, MCHJ (Tashkent, Uzbekistan). You can delete your account yourself in the app.",
  sections: [
    {
      heading: "How to delete your account in the app",
      steps: [
        "Open MyTamga and sign in to your account.",
        "Go to “Profile” and tap “Delete account”. The app shows what will be deleted.",
        "Confirm by entering your account phone number (if the account has no phone number, type the word DELETE).",
      ],
      paragraphs: ["The account is deleted immediately. There is no waiting period."],
    },
    {
      heading: "What is deleted",
      items: [
        "your account: profile, name, phone number, email address, settings;",
        "sessions and sign-in on all devices;",
        "your personal organizations together with their cases, documents and calculations;",
        "notifications.",
      ],
      paragraphs: ["Document files are erased from storage shortly after deletion."],
    },
    {
      heading: "What is kept in anonymized form",
      items: ["log records (for example, security logs);", "payment transactions."],
      paragraphs: [
        "These records are kept without any link to you, for the period required by law.",
      ],
    },
    {
      heading: "App Store and Google Play subscriptions",
      paragraphs: [
        "Deleting your account does not cancel a subscription bought through the App Store or Google Play. Cancel it in the subscription settings of the store, otherwise the store will keep charging you.",
      ],
    },
    {
      heading: "If the organization has other members",
      paragraphs: [
        "If you are the only owner of an organization that has other members, you cannot delete your account until you transfer ownership to another member or remove the members.",
        "If you are a member of someone else’s organization, your membership ends, and the organization and its cases stay with the other members.",
      ],
    },
    {
      heading: "No access to the app",
      mail: true,
      paragraphs: [
        `Email ${EMAIL} with the subject “Account deletion” and state the account phone number. If the account has an email address, write from it. To verify, we may ask you to confirm that the number is yours. We will delete the account within 30 days.`,
        "Never send a password or an SMS code by email — we do not ask for them.",
      ],
    },
  ],
};

// REVIEW(translation): китайский текст — перевод с английского, носителем не вычитан.
const zh: DeleteAccountContent = {
  linkLabel: "删除账户",
  title: "删除您的 MyTamga 账户",
  description:
    "如何删除 MyTamga 账户：在应用中操作或发邮件联系客服，哪些数据会被删除，哪些以匿名形式保留，以及如何取消应用商店订阅。",
  intro: "开发者：MY TAMGA APP, MCHJ（乌兹别克斯坦塔什干）。您可以在应用中自行删除账户。",
  sections: [
    {
      heading: "如何在应用中删除账户",
      steps: [
        "打开 MyTamga 并登录账户。",
        "进入“个人资料”，点击“删除账户”。应用会显示将被删除的内容。",
        "输入账户的手机号码以确认（如果账户没有手机号码，请输入 DELETE）。",
      ],
      paragraphs: ["账户会立即删除，没有等待期。"],
    },
    {
      heading: "哪些数据会被删除",
      items: [
        "账户：个人资料、姓名、手机号码、电子邮件地址、设置；",
        "所有设备上的会话和登录状态；",
        "您的个人组织及其案件、文件和计算记录；",
        "通知。",
      ],
      paragraphs: ["文件在删除后不久会从存储中清除。"],
    },
    {
      heading: "哪些数据以匿名形式保留",
      items: ["日志记录（例如安全日志）；", "支付交易记录。"],
      paragraphs: ["这些记录与您不再关联，并按法律规定的期限保存。"],
    },
    {
      heading: "App Store 和 Google Play 订阅",
      paragraphs: [
        "删除账户不会取消通过 App Store 或 Google Play 购买的订阅。请在商店的订阅设置中取消，否则商店会继续扣费。",
      ],
    },
    {
      heading: "如果组织中还有其他成员",
      paragraphs: [
        "如果您是有其他成员的组织的唯一所有者，则在将所有权转让给其他成员或移除这些成员之前，无法删除账户。",
        "如果您是他人组织的成员，您的成员身份将终止，该组织及其案件仍归其他成员所有。",
      ],
    },
    {
      heading: "无法访问应用",
      mail: true,
      paragraphs: [
        `请发送主题为“账户删除”的邮件至 ${EMAIL}，并注明账户的手机号码。如果账户绑定了电子邮件地址，请使用该地址发送。为了验证，我们可能会请您确认该号码属于您。我们将在 30 天内删除账户。`,
        "请勿通过邮件发送密码或短信验证码——我们不会索取。",
      ],
    },
  ],
};

export const DELETE_ACCOUNT: Record<Locale, DeleteAccountContent> = { ru, uz, en, zh };
