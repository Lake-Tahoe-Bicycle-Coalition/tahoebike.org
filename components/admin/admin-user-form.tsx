"use client";

import { useActionState } from "react";
import { FormAlert, RequiredNote, SubmitButton, TextField } from "@/components/forms/fields";
import { emptyAdminUserFormValues, type AdminUserFormValues } from "@/lib/admin/users/fields";
import { initialFormState, type FormState } from "@/lib/forms/state";

/** The inline "Add admin" form on /admin/users. The page passes the addAdminUser action. */
export function AdminUserForm({ action }: { action: (prev: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const errors = state.fieldErrors ?? {};
  // After a failed submit the echoed values win, because React resets uncontrolled inputs.
  const values: AdminUserFormValues = {
    ...emptyAdminUserFormValues,
    ...(state.values as Partial<AdminUserFormValues> | undefined),
  };

  return (
    <form action={formAction} className="space-y-5">
      <RequiredNote />
      <FormAlert message={state.formError} />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Google account email"
          name="email"
          type="email"
          required
          autoComplete="off"
          maxLength={254}
          defaultValue={values.email}
          errors={errors.email}
          help="The address they sign in to Google with. A Gmail alias or a different address will not work."
        />
        <TextField
          label="Name"
          name="name"
          maxLength={100}
          defaultValue={values.name}
          errors={errors.name}
          help="Optional. Just so the list is easy to read."
        />
      </div>

      <SubmitButton pending={pending} label="Add admin" pendingLabel="Saving…" />
    </form>
  );
}
