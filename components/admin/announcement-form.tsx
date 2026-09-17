"use client";

import { useActionState } from "react";
import { DateTimeField } from "@/components/admin/date-time-field";
import { FormAlert, RequiredNote, SubmitButton, TextareaField, TextField } from "@/components/forms/fields";
import type { AnnouncementFormValues } from "@/lib/admin/announcements/fields";
import { initialFormState, type FormState } from "@/lib/forms/state";

/**
 * Create/edit form for an Announcement. The page passes the server action
 * (createAnnouncement, or updateAnnouncement bound to an id) and the starting values.
 */
export function AnnouncementForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults: AnnouncementFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const errors = state.fieldErrors ?? {};
  // After a failed submit the echoed values win, because React resets uncontrolled inputs.
  const values: AnnouncementFormValues = {
    ...defaults,
    ...(state.values as Partial<AnnouncementFormValues> | undefined),
  };

  return (
    <form action={formAction} className="space-y-6">
      <RequiredNote />
      <FormAlert message={state.formError} />

      <TextareaField
        label="Message"
        name="message"
        required
        rows={3}
        maxLength={300}
        defaultValue={values.message}
        errors={errors.message}
        help="One or two sentences, shown in the yellow banner at the top of every page. Keep it to a single paragraph."
      />

      <TextField
        label="Link"
        name="linkUrl"
        inputMode="url"
        maxLength={2000}
        defaultValue={values.linkUrl}
        errors={errors.linkUrl}
        help="Optional. Where the “Learn more” link after the message goes, e.g. /bike-valet or https://…"
      />

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

      <SubmitButton pending={pending} label={submitLabel} pendingLabel="Saving…" />
    </form>
  );
}
