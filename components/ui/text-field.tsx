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
  className?: string;
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
  className,
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
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? errorId : undefined,
    className: "text-field w-full px-4 py-3 text-sm",
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm text-ink-soft">
        {label}
        {!required && <span className="text-ink-ghost"> — необязательно</span>}
      </label>

      {isTextarea ? (
        <textarea {...shared} rows={rows} />
      ) : (
        <input {...shared} type={type} />
      )}

      {/* The message is text, not just a red border: colour alone is not a
          signal everyone can read. */}
      {error && (
        <p id={errorId} className="field-error text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
