"use client";

import { useActionState } from "react";
import { ImageField } from "@/components/admin/image-field";
import { MarkdownField } from "@/components/admin/markdown-field";
import { CheckboxField, FormAlert, RequiredNote, SubmitButton, TextField } from "@/components/forms/fields";
import type { BoardMemberFormValues } from "@/lib/admin/board/fields";
import { initialFormState, type FormState } from "@/lib/forms/state";

/**
 * Create/edit form for a BoardMember. The page passes the server action
 * (createBoardMember, or updateBoardMember bound to an id) and the starting values.
 */
export function BoardMemberForm({
  action,
  defaults,
  submitLabel,
  uploadEnabled,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults: BoardMemberFormValues;
  submitLabel: string;
  uploadEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const errors = state.fieldErrors ?? {};
  // After a failed submit the echoed values win, because React resets uncontrolled inputs.
  const values: BoardMemberFormValues = {
    ...defaults,
    ...(state.values as Partial<BoardMemberFormValues> | undefined),
  };

  return (
    <form action={formAction} className="space-y-6">
      <RequiredNote />
      <FormAlert message={state.formError} />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Name"
          name="name"
          required
          maxLength={100}
          autoComplete="off"
          defaultValue={values.name}
          errors={errors.name}
        />
        <TextField
          label="Role"
          name="role"
          required
          maxLength={100}
          defaultValue={values.role}
          errors={errors.role}
          help="e.g. President, Treasurer, or Board Member. Advisors are usually just “Advisor”."
        />
      </div>

      <ImageField
        label="Photo"
        name="photoUrl"
        defaultValue={values.photoUrl}
        uploadEnabled={uploadEnabled}
        folder="board"
        aspect="square"
        errors={errors.photoUrl}
        help="Optional. A square head shot under 10 MB works best; without one the site shows the member’s initials."
      />

      <MarkdownField label="Bio" name="bio" defaultValue={values.bio} errors={errors.bio} rows={6} />

      <div className="space-y-4">
        <CheckboxField
          label="Advisor"
          name="isAdvisor"
          defaultChecked={values.isAdvisor === "on"}
          errors={errors.isAdvisor}
          help="Advisors are listed by name under the board on the About page."
        />
        <CheckboxField
          label="Active"
          name="isActive"
          defaultChecked={values.isActive === "on"}
          errors={errors.isActive}
          help="Inactive members stay in this list but are hidden from the site."
        />
      </div>

      <SubmitButton pending={pending} label={submitLabel} pendingLabel="Saving…" />
    </form>
  );
}
