"use client";

import { useActionState } from "react";
import { submitRackApplication } from "@/lib/forms/actions";
import {
  matchingFundsOptions,
  rackApplicationFieldLabels as labels,
  rackStyleOptions,
} from "@/lib/forms/schemas";
import { initialFormState } from "@/lib/forms/state";
import {
  FormAlert,
  HoneypotField,
  RequiredNote,
  SelectField,
  SubmitButton,
  SuccessMessage,
  TextField,
  TextareaField,
} from "./fields";
import { TurnstileWidget } from "./turnstile-widget";

export function RackApplicationForm() {
  const [state, formAction, pending] = useActionState(submitRackApplication, initialFormState);

  if (state.status === "success") {
    return (
      <SuccessMessage>
        Thanks! Your bike rack application has been received. We will be in touch.
      </SuccessMessage>
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
          label={labels.businessName}
          name="businessName"
          required
          autoComplete="organization"
          maxLength={200}
          defaultValue={values.businessName}
          errors={errors.businessName}
        />
        <TextField
          label={labels.contactName}
          name="contactName"
          required
          autoComplete="name"
          maxLength={100}
          defaultValue={values.contactName}
          errors={errors.contactName}
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
          required
          autoComplete="tel"
          maxLength={40}
          defaultValue={values.phone}
          errors={errors.phone}
        />
        <TextField
          label={labels.businessAddress}
          name="businessAddress"
          required
          autoComplete="street-address"
          maxLength={300}
          defaultValue={values.businessAddress}
          errors={errors.businessAddress}
          className="sm:col-span-2"
        />
        <TextField
          label={labels.racksRequested}
          name="racksRequested"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          step={1}
          required
          defaultValue={values.racksRequested}
          errors={errors.racksRequested}
        />
        <SelectField
          label={labels.rackStyle}
          name="rackStyle"
          required
          options={rackStyleOptions}
          defaultValue={values.rackStyle}
          errors={errors.rackStyle}
        />
        <SelectField
          label="Can your business provide matching funds?"
          name="matchingFunds"
          required
          options={matchingFundsOptions}
          defaultValue={values.matchingFunds}
          errors={errors.matchingFunds}
          className="sm:col-span-2"
        />
        <TextareaField
          label={labels.expectedUse}
          name="expectedUse"
          required
          rows={5}
          maxLength={3000}
          defaultValue={values.expectedUse}
          errors={errors.expectedUse}
          className="sm:col-span-2"
        />
        <TextareaField
          label="Anything else we should know?"
          name="notes"
          rows={4}
          maxLength={3000}
          defaultValue={values.notes}
          errors={errors.notes}
          className="sm:col-span-2"
        />
      </div>
      <HoneypotField />
      <TurnstileWidget resetKey={state} />
      <SubmitButton pending={pending} label="Submit Application" />
    </form>
  );
}
