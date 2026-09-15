"use client";

import { useEffect, useId, useRef, type ComponentProps, type ReactNode } from "react";

/**
 * Shared building blocks for the public forms: labelled controls with inline errors
 * (aria-describedby / aria-invalid), the honeypot, the alert region, the submit
 * button, and the success message.
 */

type FieldProps = {
  label: string;
  name: string;
  errors?: string[];
  required?: boolean;
  className?: string;
};

type FieldIds = { inputId: string; errorId: string };

function useFieldIds(name: string): FieldIds {
  const id = useId();
  return { inputId: `${id}-${name}`, errorId: `${id}-${name}-error` };
}

function errorAttributes(errors: string[] | undefined, ids: FieldIds) {
  return errors && errors.length > 0
    ? { "aria-invalid": true as const, "aria-describedby": ids.errorId }
    : {};
}

function FieldShell({
  label,
  required,
  ids,
  errors,
  className,
  children,
}: Omit<FieldProps, "name"> & { ids: FieldIds; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={ids.inputId} className="field-label">
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      {children}
      {errors && errors.length > 0 ? (
        <p id={ids.errorId} className="mt-1 text-sm font-semibold text-red-700">
          {errors.join(" ")}
        </p>
      ) : null}
    </div>
  );
}

export function RequiredMark() {
  return (
    <span className="text-red-700" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

export function RequiredNote() {
  return (
    <p className="text-sm">
      Required fields are marked with <RequiredMark />
      <span className="sr-only">an asterisk</span>.
    </p>
  );
}

type InputExtras = Omit<
  ComponentProps<"input">,
  "id" | "name" | "className" | "aria-invalid" | "aria-describedby" | "required"
>;

export function TextField({ label, name, errors, required, className, ...input }: FieldProps & InputExtras) {
  const ids = useFieldIds(name);
  return (
    <FieldShell label={label} required={required} ids={ids} errors={errors} className={className}>
      <input
        id={ids.inputId}
        name={name}
        required={required}
        className="field-input"
        type="text"
        {...input}
        {...errorAttributes(errors, ids)}
      />
    </FieldShell>
  );
}

type TextareaExtras = Omit<
  ComponentProps<"textarea">,
  "id" | "name" | "className" | "aria-invalid" | "aria-describedby" | "required"
>;

export function TextareaField({ label, name, errors, required, className, ...textarea }: FieldProps & TextareaExtras) {
  const ids = useFieldIds(name);
  return (
    <FieldShell label={label} required={required} ids={ids} errors={errors} className={className}>
      <textarea
        id={ids.inputId}
        name={name}
        required={required}
        className="field-input"
        rows={5}
        {...textarea}
        {...errorAttributes(errors, ids)}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  name,
  errors,
  required,
  className,
  options,
  placeholder = "Choose one",
  defaultValue,
}: FieldProps & {
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string;
}) {
  const ids = useFieldIds(name);
  return (
    <FieldShell label={label} required={required} ids={ids} errors={errors} className={className}>
      <select
        id={ids.inputId}
        name={name}
        required={required}
        className="field-input"
        defaultValue={defaultValue ?? ""}
        {...errorAttributes(errors, ids)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Invisible to people (and assistive tech); bots tend to fill it. Must stay empty. */
export function HoneypotField() {
  const id = useId();
  return (
    <div className="sr-only" aria-hidden="true">
      <label htmlFor={id}>Website</label>
      <input id={id} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded border border-red-700 bg-red-50 px-4 py-3 text-red-900">
      {message}
    </div>
  );
}

export function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button type="submit" className="btn btn-primary disabled:opacity-60" disabled={pending}>
      {pending ? "Sending…" : label}
    </button>
  );
}

/**
 * Replaces the form after a successful submit and moves keyboard focus to itself so
 * screen readers announce it. (`autoFocus` only works on form controls in React 19,
 * hence the ref.)
 */
export function SuccessMessage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <p
      ref={ref}
      role="status"
      tabIndex={-1}
      className="rounded border border-tahoe bg-tahoe/10 px-4 py-3 font-semibold"
    >
      {children}
    </p>
  );
}
