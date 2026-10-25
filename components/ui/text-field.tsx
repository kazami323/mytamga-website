import type React from "react";

import { cn } from "@/lib/utils";

interface TextFieldProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  rows?: number;
  required?: boolean;
  error?: string;
  defaultValue?: string;
  autoComplete?: string;
  placeholder?: string;
  optionalLabel?: string;
  className?: string;
  // Управляемое значение нужно кассе; форма заявки на главной его не передаёт
  // и продолжает работать неуправляемой.
  value?: string;
  onValueChange?: (value: string) => void;
}

export function TextField({
  id,
  name,
  label,
  type = "text",
  rows,
  required = false,
  error,
  defaultValue,
  autoComplete,
  placeholder,
  optionalLabel,
  className,
  value,
  onValueChange,
}: TextFieldProps) {
  const errorId = `${id}-error`;
  const isTextarea = typeof rows === "number";

  const shared = {
    id,
    name,
    defaultValue,
    placeholder,
    autoComplete,
    required,
    value,
    onChange: onValueChange
      ? (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          onValueChange(event.target.value)
      : undefined,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? errorId : undefined,
    className: "text-field w-full px-4 py-3 text-base",
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-[0.9375rem] text-ink-soft">
        {label}
        {!required && optionalLabel && (
          <span className="text-ink-ghost"> — {optionalLabel}</span>
        )}
      </label>

      {isTextarea ? (
        <textarea {...shared} rows={rows} />
      ) : (
        <input {...shared} type={type} />
      )}

      {/* The message is text, not just a red border: colour alone is not a
          signal everyone can read. */}
      {error && (
        <p id={errorId} className="field-error text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
