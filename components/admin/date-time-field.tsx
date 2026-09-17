"use client";

import { TextField } from "@/components/forms/fields";

/**
 * A wall-clock instant in Pacific time as a date input and a time input side by side.
 * Field names are `<name>Date` and `<name>Time`; the server joins them with
 * fromZonedParts() (lib/admin/datetime.ts).
 */
export function DateTimeField({
  label,
  name,
  required,
  defaultDate,
  defaultTime,
  errors,
  className,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultDate?: string;
  defaultTime?: string;
  /** Errors keyed by field name, as returned by the action; both halves are looked up. */
  errors?: Record<string, string[]>;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className="field-label">{label}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Date"
          name={`${name}Date`}
          type="date"
          required={required}
          defaultValue={defaultDate}
          errors={errors?.[`${name}Date`]}
        />
        <TextField
          label="Time (Pacific)"
          name={`${name}Time`}
          type="time"
          required={required}
          defaultValue={defaultTime}
          errors={errors?.[`${name}Time`]}
        />
      </div>
    </fieldset>
  );
}
