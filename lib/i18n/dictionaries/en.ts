import type { Dictionary } from "./ru";

const P = "Placeholder text";

export const en: Dictionary = {
  meta: {
    title: "MyTamga — clear imports, from goods to declarant",
    description:
      "MyTamga helps you find the HS code, calculate customs payments, check the requirements for your goods and prepare everything needed for clearance.",
  },
  placeholder: P,
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
    kicker: P,
    title: ["Clear imports —", "from goods", "to declarant."],
    lead: "MyTamga helps you find the HS code, calculate customs payments, check the requirements for your goods and prepare everything needed for clearance.",
    actions: "Main actions",
    contact: "Contact us",
    learnMore: "Learn more about us",
    sceneLoading: "Loading scene",
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
      { id: "result-1", title: P, body: P },
      { id: "result-2", title: P, body: P },
      { id: "result-3", title: P, body: P },
    ],
    cta: "Submit a request",
  },
  about: {
    kicker: "About",
    title: P,
    body: P,
    facts: [
      { id: "fact-1", label: P, value: P },
      { id: "fact-2", label: P, value: P },
      { id: "fact-3", label: P, value: P },
    ],
  },
  contact: {
    kicker: "Contacts",
    title: "Tell us about your goods",
    body: "Describe what you're shipping. We'll reply with the HS code and a payment estimate.",
    channels: [
      { id: "phone", label: "Phone", value: P, href: null },
      { id: "email", label: "Email", value: P, href: null },
      { id: "place", label: "Address", value: P, href: null },
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
  footer: {
    legal: P,
  },
};
