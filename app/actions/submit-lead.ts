"use server";

import { headers } from "next/headers";

import { clientIpFrom } from "@/lib/api/forwarded";
import { createLeadRateLimiter, sendLeadToTelegram } from "@/lib/lead-delivery";
import {
  readLeadValues,
  validateLead,
  type LeadState,
  type LeadValues,
} from "@/lib/lead";

const limiter = createLeadRateLimiter();

async function deliverLead(
  values: LeadValues,
): Promise<"delivered" | "unavailable"> {
  const requestHeaders = await headers();
  const ip =
    clientIpFrom(
      requestHeaders.get("x-forwarded-for"),
      requestHeaders.get("x-real-ip"),
    ) ?? "unknown";

  // Превышение лимита выглядит для посетителя как «недоступно»: подсказывать
  // спамеру границы незачем.
  if (!limiter.take(ip, Date.now())) {
    return "unavailable";
  }

  return sendLeadToTelegram(values, { env: process.env });
}

// A "use server" module may only export async functions, so the state type and
// its initial value live in lib/lead.ts rather than here.
export async function submitLead(
  _previous: LeadState,
  formData: FormData,
): Promise<LeadState> {
  const values = readLeadValues(formData);

  // Honeypot: a real person never fills a field they cannot see.
  if (String(formData.get("website") ?? "")) {
    return { status: "unavailable", values };
  }

  const fieldErrors = validateLead(values);

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "invalid", values, fieldErrors };
  }

  try {
    const result = await deliverLead(values);
    return result === "delivered"
      ? { status: "sent" }
      : { status: "unavailable", values };
  } catch {
    return { status: "failed", values };
  }
}
