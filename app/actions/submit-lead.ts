"use server";

import { headers } from "next/headers";

import { clientIpFrom } from "@/lib/api/forwarded";
import {
  createLeadRateLimiter,
  sendLeadToTelegram,
  type DeliveryResult,
} from "@/lib/lead-delivery";
import {
  readLeadValues,
  validateLead,
  type LeadState,
  type LeadValues,
} from "@/lib/lead";

const limiter = createLeadRateLimiter();

async function deliverLead(
  values: LeadValues,
): Promise<DeliveryResult> {
  const requestHeaders = await headers();
  // Нет адреса — лимит на IP не применяется, остаётся только общий.
  const ip = clientIpFrom(
    requestHeaders.get("x-forwarded-for"),
    requestHeaders.get("x-real-ip"),
  );

  // Превышение лимита — «попробуйте ещё раз» ("failed"), не «недоступно».
  if (!limiter.take(ip, Date.now())) {
    return "failed";
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
    if (result === "delivered") {
      return { status: "sent" };
    }

    return { status: result, values };
  } catch {
    return { status: "failed", values };
  }
}
