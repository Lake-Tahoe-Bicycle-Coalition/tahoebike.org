"use client";

import { useActionState, useRef } from "react";
import { DateTimeField } from "@/components/admin/date-time-field";
import { MarkdownField } from "@/components/admin/markdown-field";
import { UnsavedChangesGuard } from "@/components/admin/unsaved-changes-guard";
import { FormAlert, RequiredNote, SelectField, SubmitButton, TextField } from "@/components/forms/fields";
import type { EventFormValues } from "@/lib/admin/events/fields";
import { programOptions } from "@/lib/admin/events/fields";
import { initialFormState, type FormState } from "@/lib/forms/state";

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

/** `YYYY-MM-DD` + `HH:MM` as a UTC timestamp, or null if either is incomplete. */
function wallClock(date: string, time: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const clock = /^(\d{2}):(\d{2})/.exec(time);
  if (!match || !clock) return null;
  // Wall-clock arithmetic in UTC; the form's times are Pacific wall-clock, so no zone applies here.
  const [year, month, day, hour, minute] = [...match.slice(1), ...clock.slice(1)].map(Number) as [number, number, number, number, number];
  return Date.UTC(year, month - 1, day, hour, minute);
}

function toFields(timestamp: number): [string, string] {
  const iso = new Date(timestamp).toISOString();
  return [iso.slice(0, 10), iso.slice(11, 16)];
}

/** Start plus two hours as `[YYYY-MM-DD, HH:MM]` wall-clock strings, or null if the start is incomplete. */
function defaultEnd(date: string, time: string): [string, string] | null {
  const start = wallClock(date, time);
  return start === null ? null : toFields(start + DEFAULT_DURATION_MS);
}

/** A duplicated event keeps its end time: the end date is the start date, or the next day if it ends earlier. */
function endOnStartDay(date: string, time: string, endTime: string): [string, string] | null {
  const start = wallClock(date, time);
  const end = wallClock(date, endTime);
  if (start === null || end === null) return null;
  return toFields(end < start ? end + 24 * 60 * 60 * 1000 : end);
}

/**
 * Create/edit form for an Event. The page passes the server action (createEvent, or
 * updateEvent bound to an id) and the starting values.
 */
export function EventForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults: EventFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const errors = state.fieldErrors ?? {};
  // After a failed submit the echoed values win, because React resets uncontrolled inputs.
  const values: EventFormValues = { ...defaults, ...(state.values as Partial<EventFormValues> | undefined) };

  // The end fields last filled in by us; they follow the start until the admin edits them.
  // `keepTime`: a duplicated event (empty dates, copied times) keeps its copied end time.
  const autoEnd = useRef<{ fields: [string, string]; keepTime: boolean } | null>(null);

  /**
   * Prefill the end while it is empty (or still our own suggestion): two hours after the start,
   * or, on a duplicate whose end time was copied, the same end time on the start's day.
   */
  function suggestEnd(event: React.ChangeEvent<HTMLFormElement>) {
    const name = (event.target as unknown as HTMLInputElement).name;
    if (name !== "startDate" && name !== "startTime") return;
    const field = (n: string) => event.currentTarget.elements.namedItem(n) as HTMLInputElement | null;
    const [startDate, startTime, endDate, endTime] = ["startDate", "startTime", "endDate", "endTime"].map(field);
    if (!startDate || !startTime || !endDate || !endTime) return;
    const auto = autoEnd.current;
    const ours = auto !== null && endDate.value === auto.fields[0] && endTime.value === auto.fields[1];
    const keepTime = ours ? auto.keepTime : endDate.value === "" && endTime.value !== "";
    if (!ours && endDate.value !== "") return;
    const suggestion = keepTime
      ? endOnStartDay(startDate.value, startTime.value, endTime.value)
      : defaultEnd(startDate.value, startTime.value);
    if (!suggestion) return;
    [endDate.value, endTime.value] = suggestion;
    autoEnd.current = { fields: suggestion, keepTime };
  }

  return (
    <form action={formAction} onChange={suggestEnd} className="space-y-6">
      <UnsavedChangesGuard />
      <RequiredNote />
      <FormAlert message={state.formError} />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Title"
          name="title"
          required
          maxLength={200}
          defaultValue={values.title}
          errors={errors.title}
          help="Shown as the event heading, e.g. the venue or “Bike Kitchen fix-up”."
        />
        <SelectField
          label="Program"
          name="program"
          required
          options={programOptions}
          placeholder={null}
          defaultValue={values.program}
          errors={errors.program}
          help="Where it appears: Bike Kitchen events on the Bike Kitchen page, Bike Valet events on the Bike Valet page, Other events on the home page."
        />
      </div>

      <DateTimeField
        label="Starts"
        name="start"
        required
        defaultDate={values.startDate}
        defaultTime={values.startTime}
        errors={errors}
      />
      <DateTimeField
        label="Ends"
        name="end"
        required
        help="Filled in from the start (two hours later, or the copied end time on a duplicate); change it if needed."
        defaultDate={values.endDate}
        defaultTime={values.endTime}
        errors={errors}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Location name"
          name="locationName"
          maxLength={200}
          defaultValue={values.locationName}
          errors={errors.locationName}
        />
        <TextField
          label="Address"
          name="address"
          maxLength={300}
          defaultValue={values.address}
          errors={errors.address}
          help="Street address; the site links it to Google Maps."
        />
      </div>

      <MarkdownField
        label="Description"
        name="description"
        defaultValue={values.description}
        errors={errors.description}
        rows={6}
      />

      <TextField
        label="Sign-up link"
        name="registrationUrl"
        inputMode="url"
        maxLength={2000}
        defaultValue={values.registrationUrl}
        errors={errors.registrationUrl}
        help="Optional. Where the “Sign up” button goes, e.g. the POINT shift page."
      />

      <SubmitButton pending={pending} label={submitLabel} pendingLabel="Saving…" />
    </form>
  );
}
