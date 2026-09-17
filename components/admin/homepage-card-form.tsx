"use client";

import { useActionState } from "react";
import { ImageField } from "@/components/admin/image-field";
import {
  CheckboxField,
  FormAlert,
  RequiredNote,
  SubmitButton,
  TextareaField,
  TextField,
} from "@/components/forms/fields";
import type { HomepageCardFormValues } from "@/lib/admin/cards/fields";
import { initialFormState, type FormState } from "@/lib/forms/state";

/**
 * Create/edit form for a HomepageCard. The page passes the server action
 * (createHomepageCard, or updateHomepageCard bound to an id) and the starting values.
 */
export function HomepageCardForm({
  action,
  defaults,
  submitLabel,
  uploadEnabled,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults: HomepageCardFormValues;
  submitLabel: string;
  uploadEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const errors = state.fieldErrors ?? {};
  // After a failed submit the echoed values win, because React resets uncontrolled inputs.
  const values: HomepageCardFormValues = {
    ...defaults,
    ...(state.values as Partial<HomepageCardFormValues> | undefined),
  };

  return (
    <form action={formAction} className="space-y-6">
      <RequiredNote />
      <FormAlert message={state.formError} />

      <TextField
        label="Title"
        name="title"
        required
        maxLength={120}
        defaultValue={values.title}
        errors={errors.title}
        help="The card heading, e.g. “June is Tahoe Bike Month”."
      />

      <TextareaField
        label="Blurb"
        name="blurb"
        required
        maxLength={600}
        rows={4}
        defaultValue={values.blurb}
        errors={errors.blurb}
        help="A sentence or two. Plain text; no formatting."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Button label"
          name="ctaLabel"
          required
          maxLength={60}
          defaultValue={values.ctaLabel}
          errors={errors.ctaLabel}
          help="The button text, e.g. “Join today”."
        />
        <TextField
          label="Button link"
          name="ctaUrl"
          required
          inputMode="url"
          maxLength={2000}
          defaultValue={values.ctaUrl}
          errors={errors.ctaUrl}
          help="A site path like /join or a full https:// address."
        />
      </div>

      <ImageField
        label="Image"
        name="imageUrl"
        defaultValue={values.imageUrl}
        uploadEnabled={uploadEnabled}
        folder="cards"
        aspect="landscape"
        errors={errors.imageUrl}
        help="Optional. A landscape photo, roughly 4:3, under 10 MB. It is cropped to fit the card."
      />

      <CheckboxField
        label="Active"
        name="isActive"
        defaultChecked={values.isActive === "on"}
        errors={errors.isActive}
        help="Inactive cards stay in this list but are hidden from the home page."
      />

      <SubmitButton pending={pending} label={submitLabel} pendingLabel="Saving…" />
    </form>
  );
}
