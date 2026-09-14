"use client";

import { useActionState, useEffect, useRef } from "react";

import { submitLead } from "@/app/actions/submit-lead";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { TextField } from "@/components/ui/text-field";
import { INITIAL_LEAD_STATE, type LeadState } from "@/lib/lead";

const FIELD_ORDER = ["name", "contact", "company", "goods"] as const;

function errorFor(state: LeadState, field: (typeof FIELD_ORDER)[number]) {
  return state.status === "invalid" ? state.fieldErrors[field] : undefined;
}

function valueFor(state: LeadState, field: (typeof FIELD_ORDER)[number]) {
  return "values" in state ? state.values[field] : undefined;
}

export function LeadForm() {
  const [state, formAction, isPending] = useActionState(
    submitLead,
    INITIAL_LEAD_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Land the caret on the first broken field instead of leaving the person to
  // hunt for the red one.
  useEffect(() => {
    if (state.status !== "invalid") {
      return;
    }

    const firstBroken = FIELD_ORDER.find((field) => field in state.fieldErrors);

    if (firstBroken) {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstBroken}"]`)
        ?.focus();
    }
  }, [state]);

  // noValidate, but the fields keep `required`: assistive tech still hears
  // which ones are mandatory, while the server stays the single source of truth
  // for the messages. Native bubbles cannot be styled, speak the browser's
  // language rather than the page's, and would stop the request before our
  // validation ever ran.
  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex flex-col gap-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="lead-name"
          name="name"
          label="Имя"
          required
          autoComplete="name"
          error={errorFor(state, "name")}
          defaultValue={valueFor(state, "name")}
        />
        <TextField
          id="lead-contact"
          name="contact"
          label="Телефон или почта"
          required
          autoComplete="email"
          error={errorFor(state, "contact")}
          defaultValue={valueFor(state, "contact")}
        />
      </div>

      <TextField
        id="lead-company"
        name="company"
        label="Компания"
        autoComplete="organization"
        error={errorFor(state, "company")}
        defaultValue={valueFor(state, "company")}
      />

      <TextField
        id="lead-goods"
        name="goods"
        label="Что везёте"
        rows={5}
        required
        placeholder="Название, состав, назначение, страна происхождения."
        error={errorFor(state, "goods")}
        defaultValue={valueFor(state, "goods")}
      />

      {/* Honeypot. Hidden from people and from screen readers alike. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />

      <div className="mt-2">
        {/* The label never changes: this button sizes itself from its text,
            so swapping in a "sending" label would make it jump. */}
        <LiquidMetalButton
          type="submit"
          label="Отправить заявку"
          disabled={isPending}
        />
      </div>

      <p
        aria-live="polite"
        data-lead-status={isPending ? "pending" : state.status}
        className="text-sm leading-6 text-ink-soft"
      >
        {isPending && "Отправляем…"}
        {!isPending &&
          state.status === "unavailable" &&
          "Приём заявок пока не подключён. Свяжитесь с нами по контактам рядом — данные из формы не потеряны."}
        {!isPending &&
          state.status === "failed" &&
          "Не получилось отправить. Попробуйте ещё раз или напишите нам напрямую."}
      </p>
    </form>
  );
}
