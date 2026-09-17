"use client";

import { useActionState } from "react";
import { DateTimeField } from "@/components/admin/date-time-field";
import { MarkdownField } from "@/components/admin/markdown-field";
import { FormAlert, RequiredNote, SelectField, SubmitButton, TextField } from "@/components/forms/fields";
import type { EventFormValues } from "@/lib/admin/events/fields";
import { programOptions } from "@/lib/admin/events/fields";
import { initialFormState, type FormState } from "@/lib/forms/state";

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

  return (
    <form action={formAction} className="space-y-6">
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
          help="Bike Kitchen events appear on the Bike Kitchen page. Other programs are stored for future pages."
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
