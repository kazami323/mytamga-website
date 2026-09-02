"use server";

import {
  readLeadValues,
  validateLead,
  type LeadState,
  type LeadValues,
} from "@/lib/lead";

/**
 * The seam. Wiring a real channel — Telegram, email, a CRM — is a change to
 * this function plus environment variables, and nothing else.
 *
 * It reports "unavailable" rather than pretending to succeed: a landing page
 * that swallows enquiries loses customers silently.
 */
async function deliverLead(
  values: LeadValues,
): Promise<"delivered" | "unavailable"> {
  // No channel is configured yet, so there is nothing to deliver to. Wiring
  // one means replacing this body; `values` is the payload it will send.
  void values;

  return "unavailable";
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
    await deliverLead(values);
    return { status: "unavailable", values };
  } catch {
    return { status: "failed", values };
  }
}
