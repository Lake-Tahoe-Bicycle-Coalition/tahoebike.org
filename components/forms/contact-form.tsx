"use client";

import { useActionState } from "react";
import { submitContact } from "@/lib/forms/actions";
import { contactFieldLabels as labels } from "@/lib/forms/schemas";
import { initialFormState } from "@/lib/forms/state";
import {
  FormAlert,
  HoneypotField,
  RequiredNote,
  SubmitButton,
  SuccessMessage,
  TextField,
  TextareaField,
} from "./fields";
import { TurnstileWidget } from "./turnstile-widget";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, initialFormState);

  if (state.status === "success") {
    return (
      <SuccessMessage>Thanks for your message. We will get back to you soon.</SuccessMessage>
    );
  }

  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <RequiredNote />
      <FormAlert message={state.formError} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label={labels.firstName}
          name="firstName"
          required
          autoComplete="given-name"
          maxLength={100}
          defaultValue={values.firstName}
          errors={errors.firstName}
        />
        <TextField
          label={labels.lastName}
          name="lastName"
          required
          autoComplete="family-name"
          maxLength={100}
          defaultValue={values.lastName}
          errors={errors.lastName}
        />
        <TextField
          label={labels.email}
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={values.email}
          errors={errors.email}
        />
        <TextField
          label={labels.phone}
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={40}
          defaultValue={values.phone}
          errors={errors.phone}
        />
        <TextareaField
          label={labels.message}
          name="message"
          required
          rows={6}
          maxLength={5000}
          defaultValue={values.message}
          errors={errors.message}
          className="sm:col-span-2"
        />
      </div>
      <HoneypotField />
      <TurnstileWidget resetKey={state} />
      <SubmitButton pending={pending} label="Send Message" />
    </form>
  );
}
