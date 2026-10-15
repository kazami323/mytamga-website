import type { Dictionary } from "./ru";
import { groupDigits } from "../../billing/format.ts";
import { companyFor, companyLine } from "../../legal/company.ts";
import { REFERENCE_COUNTS } from "../../reference-counts.ts";

const company = companyFor("en");

export const en: Dictionary = {
  meta: {
    title: "MyTamga — clear imports, from goods to declarant",
    description:
      "MyTamga helps you find the HS code, calculate customs payments, check the requirements for your goods and prepare everything needed for clearance.",
  },
  nav: {
    home: "Home",
    services: "Services",
    calc: "Calculation",
    about: "About",
    contacts: "Contacts",
    primary: "Main navigation",
    footer: "Footer navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
  },
  theme: {
    light: "Light theme",
  },
  preloader: {
    loading: "Loading page",
  },
  hero: {
    kicker: "For importers and customs brokers in Uzbekistan",
    title: ["Clear imports —", "from goods", "to declarant."],
    lead: "MyTamga helps you find the HS code, calculate customs payments, check the requirements for your goods and prepare everything needed for clearance.",
    actions: "Main actions",
    contact: "Contact us",
    learnMore: "Learn more about us",
    sceneLoading: "Loading scene",
    // Первый экран-портал: камера пролетает в букву, внутри — объяснение.
    portalEnter: "Step inside",
    portalHint: "Scroll down to step into the letter",
    portalChoose: "Choose the letter to enter through",
  },
  capabilities: {
    kicker: "Capabilities",
    title: "Everything you need before filing the declaration",
    items: [
      {
        id: "code",
        title: "HS code",
        body: "We determine the commodity code from the product's description, composition and purpose.",
      },
      {
        id: "payments",
        title: "Customs payments",
        body: "We calculate customs payments in advance, so you know the cost of import before filing.",
      },
      {
        id: "requirements",
        title: "Product requirements",
        body: "We check which permits and certificates your particular goods require.",
      },
      {
        id: "documents",
        title: "Document preparation",
        body: "We assemble the package you then hand to the declarant for clearance.",
      },
    ],
  },
  howItWorks: {
    kicker: "How it works",
    title: "Three steps to a ready package",
    steps: [
      { id: "describe", title: "Describe your goods", body: "Name, composition, purpose and country of origin." },
      { id: "receive", title: "Get the code and the estimate", body: "HS code and customs payments — before you file." },
      { id: "collect", title: "Collect the documents", body: "All that's left is to hand the package to the declarant." },
    ],
  },
  calculation: {
    kicker: "Calculation",
    title: "What we need to calculate",
    inputs: [
      { id: "goods", title: "Product description", body: "Name, composition and purpose." },
      { id: "origin", title: "Country of origin", body: "It determines the rates that apply." },
      { id: "value", title: "Customs value", body: "Transaction price and related costs." },
      { id: "weight", title: "Weight and volume", body: "Gross, net and shipment dimensions." },
    ],
    resultKicker: "What you get",
    results: [
      { id: "result-1", title: "Payments by item", body: "Duty, VAT, excise and customs fees — each separately and in total, in UZS." },
      { id: "result-2", title: "Permits and certificates", body: "The certificates, licences and permits this particular product requires." },
      { id: "result-3", title: "The basis for every figure", body: "The rate and the legal provision it was applied under, with a link to lex.uz." },
    ],
    cta: "Submit a request",
  },
  about: {
    kicker: "About",
    title: "Importing without guesswork",
    body: "MyTamga is a service for anyone bringing goods into Uzbekistan. The cost of customs clearance usually becomes clear when it is too late to change the decision. We calculate it in advance, using a reference database compiled from the laws and resolutions published on lex.uz. The client and the declarant work in one case: documents, calculation and correspondence in one place.",
    // Цифры — из lib/reference-counts.ts: одно место на четыре языка.
    facts: [
      { id: "fact-1", label: "HS positions in the database", value: groupDigits(REFERENCE_COUNTS.tnvedPositions) },
      { id: "fact-2", label: "customs duty rules", value: groupDigits(REFERENCE_COUNTS.dutyRules) },
      { id: "fact-3", label: "non-tariff rules", value: groupDigits(REFERENCE_COUNTS.nonTariffRules) },
    ],
  },
  contact: {
    kicker: "Contacts",
    title: "Tell us about your goods",
    body: "Describe what you're shipping. We'll reply with the HS code and a payment estimate.",
    channels: [
      { id: "phone", label: "Phone", value: company.phone, href: company.phoneHref },
      { id: "email", label: "Email", value: company.supportEmail, href: `mailto:${company.supportEmail}` },
      { id: "place", label: "Address", value: company.shortAddress, href: company.mapsUrl },
    ],
  },
  form: {
    name: "Name",
    contact: "Phone or email",
    company: "Company",
    goods: "What are you shipping",
    goodsPlaceholder: "Name, composition, purpose, country of origin.",
    optional: "optional",
    submit: "Send request",
    sending: "Sending…",
    unavailable:
      "Online requests aren't connected yet. Please use the contacts alongside — what you entered is kept.",
    failed: "Couldn't send. Try again or write to us directly.",
    errors: {
      "name.short": "Enter your name — at least 2 characters.",
      "name.long": "That name is too long.",
      "contact.missing": "Leave a phone number or email.",
      "contact.invalid": "That doesn't look like a phone number or email.",
      "company.long": "That company name is too long.",
      "goods.short": "Describe your goods — at least 10 characters.",
      "goods.long": "That description is too long.",
    },
  },
  billing: {
    nav: "Pricing",
    metaTitle: "MyTamga pricing — subscriptions for importers and brokers",
    metaDescription:
      "MyTamga pricing: what each plan includes, how many team seats it carries, and how to subscribe for the app.",
    kicker: "Pricing",
    title: "MyTamga subscription",
    lead: "One subscription for the app and the site. A plan bought here opens on every device.",
    pricePending: "Under discussion",
    perMonth: "{amount} UZS/month",
    perYear: "{amount} UZS/year",
    free: "Free",
    freeForever: "Free forever — not a trial",
    byRequest: "On request",
    fromMonthly: "from {amount} UZS/month",
    period: {
      label: "Billing period",
      monthly: "Monthly",
      yearly: "Yearly",
    },
    yearlyAs: "A year: {months} of 12 months",
    seatsIncluded: "Team seats: {count}",
    extraSeat: "{amount} UZS per extra seat",
    unlimited: "Unlimited",
    invoiceForCompany: "Terms and an invoice for your company",
    yearlySaving: "You save {amount} UZS",
    catalogUnavailable:
      "Prices are temporarily unavailable. Write to us and we will send the current terms.",
    renewManual: "A single payment for 30 days. Renewed manually.",
    renewAuto: "Renews automatically; cancel at any time.",
    cta: {
      included: "Already included",
      buy: "Subscribe",
      request: "Request",
      download: "Get the app",
      lead: "Leave a request",
    },
    providers: {
      label: "Payment method",
      connecting: "Being connected",
    },
    checkout: {
      title: "Checkout",
      phoneLabel: "Phone number",
      phoneHint: "An Uzbek number, for example +998 90 123 45 67",
      sendCode: "Send the code",
      codeLabel: "Code from the SMS",
      codeHint: "Six digits from the message",
      confirm: "Confirm",
      changeNumber: "Change the number",
      signedIn: "Signed in",
      signOut: "Sign out",
      currentPlan: "Current plan",
      until: "Active until {date}",
      scheduled: "From {date} — {plan}",
      amountToPay: "To pay: {amount} UZS",
      continueToClick: "Continue to Click",
      cancelPayment: "Cancel",
      effect: {
        new: "A new plan: access opens right after payment.",
        newUntil: "A new plan: access opens right after payment and lasts until {date}.",
        extend: "Extending your current plan: the term gets longer.",
        extendUntil: "Extending your current plan: access lasts until {date}.",
        upgrade: "An upgrade: the remainder of your current plan is converted into days of the new one and added to the term.",
        defer: "Starts when your current plan ends: nothing changes now.",
      },
      pay: "Continue to payment",
      requestSent: "Request sent — we will get in touch.",
      ownerOnly: "Only the organisation owner can pay.",
      storeManaged:
        "This subscription was bought in an app store. Manage it there.",
      uzPhoneOnly:
        `Paying on the site needs an Uzbek phone number. With another number, write to ${company.supportEmail} and we will offer another way.`,
      pricesPending:
        "Prices are still under discussion. We will let you know when payment opens.",
    },
    errors: {
      rate: "Too often. Try again in {seconds} s.",
      rateLater: "Too often. Try again later.",
      forbidden: "Only the organisation owner can pay.",
      store: "This subscription was bought in an app store. Manage it there.",
      unavailable: "Online payment is being connected. Write to us and we will set up access.",
      requestOnly: "This plan is arranged on request.",
      noOrganization: "Organisation not found. Please sign in again.",
      signedOut: "The session has expired. Please sign in again.",
      network: "Could not reach the server. Please try again.",
      checkoutConflict: "This plan cannot be paid for right now: it was granted without an end date, or another plan is already paid for after the current one. Write to us and we will sort it out.",
      checkoutPerpetual: "This plan cannot be paid for: it was granted without an end date, so only a broader plan can be paid for.",
      checkoutScheduled: "Another plan ({plan}) is already paid for after the current one. You can pay for that same plan or a broader one.",
      phoneInvalid: "Check the number: an Uzbek one is needed, for example +998 90 123 45 67.",
      codeInvalid: "The code from the SMS is six digits.",
      pricesPending: "Payment is not open yet.",
    },
    pay: {
      title: "Payment",
      waiting: "Checking the payment…",
      success: "Paid. Open the MyTamga app — the plan is already active.",
      timeout:
        "The payment is being processed. If the plan does not appear within ten minutes, write to support.",
      transaction: "Payment number: {id}",
      signIn: "Sign in again to check the payment.",
      backToPricing: "Back to pricing",
    },
    legal: {
      offer: "Public offer",
      privacy: "Privacy policy",
      terms: "Terms of use",
      support: "Support",
      updated: "Updated: {date}",
      draftNotice: "A draft. It has not been reviewed by a lawyer and is not in force.",
      contractLanguage:
        "The contract is concluded in Russian. Please open the Russian version of the document.",
      detailsMissing: "The provider's registration details will be published before payments open.",
      detailsTitle: "Registration details",
      supportTitle: "Support",
      supportBody: "Write to us — we reply on working days.",
      openRussian: "Open in Russian",
    },
  },
  footer: {
    // Год ставит сам подвал; юрлицо, ИНН и адрес — из lib/legal/company.ts.
    legal: companyLine("en"),
    backToTop: "Back to top",
    // Подпись над названием магазина, как на официальных значках. Пока
    // адреса в lib/app-links.ts нет, вместо неё — «скоро».
    appStoreCaption: "Download on the",
    googlePlayCaption: "Get it on",
    comingSoon: "Coming soon to",
  },
};
