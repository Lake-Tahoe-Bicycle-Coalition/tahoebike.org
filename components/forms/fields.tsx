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
  /** Short hint shown under the control and linked with aria-describedby. */
  help?: string;
};

type FieldIds = { inputId: string; errorId: string; helpId: string };

function useFieldIds(name: string): FieldIds {
  const id = useId();
  return { inputId: `${id}-${name}`, errorId: `${id}-${name}-error`, helpId: `${id}-${name}-help` };
}

function errorAttributes(errors: string[] | undefined, ids: FieldIds, help?: string) {
  const hasErrors = errors !== undefined && errors.length > 0;
  const describedBy = [hasErrors ? ids.errorId : null, help ? ids.helpId : null].filter(Boolean).join(" ");
  return {
    ...(hasErrors ? { "aria-invalid": true as const } : {}),
    ...(describedBy ? { "aria-describedby": describedBy } : {}),
  };
}

function FieldShell({
  label,
  required,
  ids,
  errors,
  className,
  help,
  children,
}: Omit<FieldProps, "name"> & { ids: FieldIds; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={ids.inputId} className="field-label">
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      {children}
      {help ? (
        <p id={ids.helpId} className="mt-1 text-sm text-asphalt/70">
          {help}
        </p>
      ) : null}
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

export function TextField({ label, name, errors, required, className, help, ...input }: FieldProps & InputExtras) {
  const ids = useFieldIds(name);
  return (
    <FieldShell label={label} required={required} ids={ids} errors={errors} className={className} help={help}>
      <input
        id={ids.inputId}
        name={name}
        required={required}
        className="field-input"
        type="text"
        {...input}
        {...errorAttributes(errors, ids, help)}
      />
    </FieldShell>
  );
}

type TextareaExtras = Omit<
  ComponentProps<"textarea">,
  "id" | "name" | "className" | "aria-invalid" | "aria-describedby" | "required"
>;

export function TextareaField({ label, name, errors, required, className, help, ...textarea }: FieldProps & TextareaExtras) {
  const ids = useFieldIds(name);
  return (
    <FieldShell label={label} required={required} ids={ids} errors={errors} className={className} help={help}>
      <textarea
        id={ids.inputId}
        name={name}
        required={required}
        className="field-input"
        rows={5}
        {...textarea}
        {...errorAttributes(errors, ids, help)}
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
  help,
  options,
  placeholder = "Choose one",
  defaultValue,
}: FieldProps & {
  options: readonly { value: string; label: string }[];
  /** The empty first option; pass null to omit it (every option is a real choice). */
  placeholder?: string | null;
  defaultValue?: string;
}) {
  const ids = useFieldIds(name);
  return (
    <FieldShell label={label} required={required} ids={ids} errors={errors} className={className} help={help}>
      <select
        id={ids.inputId}
        name={name}
        required={required}
        className="field-input"
        defaultValue={defaultValue ?? ""}
        {...errorAttributes(errors, ids, help)}
      >
        {placeholder === null ? null : <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/**
 * A single checkbox with its label to the right. Browsers send "on" when ticked and
 * nothing when not, so read it with the `checkbox` validator in lib/forms/validators.ts.
 */
export function CheckboxField({
  label,
  name,
  errors,
  className,
  help,
  defaultChecked,
}: Omit<FieldProps, "required"> & { help?: string; defaultChecked?: boolean }) {
  const ids = useFieldIds(name);
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          id={ids.inputId}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          className="mt-1 h-5 w-5 shrink-0 accent-tahoe-deep"
          {...errorAttributes(errors, ids, help)}
        />
        <div>
          <label htmlFor={ids.inputId} className="font-semibold">
            {label}
          </label>
          {help ? (
            <p id={ids.helpId} className="text-sm text-asphalt/70">
              {help}
            </p>
          ) : null}
        </div>
      </div>
      {errors && errors.length > 0 ? (
        <p id={ids.errorId} className="mt-1 text-sm font-semibold text-red-700">
          {errors.join(" ")}
        </p>
      ) : null}
    </div>
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

export function SubmitButton({
  pending,
  label,
  pendingLabel = "Sending…",
}: {
  pending: boolean;
  label: string;
  pendingLabel?: string;
}) {
  return (
    <button type="submit" className="btn btn-primary disabled:opacity-60" disabled={pending}>
      {pending ? pendingLabel : label}
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
