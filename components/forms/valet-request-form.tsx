"use client";

import { useActionState } from "react";
import { submitValetRequest } from "@/lib/forms/actions";
import { organizationTypeOptions, valetRequestFieldLabels as labels } from "@/lib/forms/fields";
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

export function ValetRequestForm() {
  const [state, formAction, pending] = useActionState(submitValetRequest, initialFormState);

  if (state.status === "success") {
    return (
      <SuccessMessage>
        Thanks! Your bike valet request has been received. We will be in touch with a quote.
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
          label={labels.contactName}
          name="contactName"
          required
          autoComplete="name"
          maxLength={100}
          defaultValue={values.contactName}
          errors={errors.contactName}
        />
        <TextField
          label={labels.organization}
          name="organization"
          required
          autoComplete="organization"
          maxLength={200}
          defaultValue={values.organization}
          errors={errors.organization}
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
          label={labels.eventName}
          name="eventName"
          required
          maxLength={200}
          defaultValue={values.eventName}
          errors={errors.eventName}
          className="sm:col-span-2"
        />
        <TextField
          label={labels.eventDate}
          name="eventDate"
          type="date"
          required
          defaultValue={values.eventDate}
          errors={errors.eventDate}
        />
        <div className="grid grid-cols-2 gap-5">
          <TextField
            label={labels.startTime}
            name="startTime"
            type="time"
            required
            defaultValue={values.startTime}
            errors={errors.startTime}
          />
          <TextField
            label={labels.endTime}
            name="endTime"
            type="time"
            required
            defaultValue={values.endTime}
            errors={errors.endTime}
          />
        </div>
        <TextField
          label={labels.location}
          name="location"
          required
          maxLength={300}
          defaultValue={values.location}
          errors={errors.location}
          className="sm:col-span-2"
        />
        <TextField
          label={labels.expectedAttendance}
          name="expectedAttendance"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          required
          defaultValue={values.expectedAttendance}
          errors={errors.expectedAttendance}
        />
        <TextField
          label={labels.expectedBikes}
          name="expectedBikes"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          required
          defaultValue={values.expectedBikes}
          errors={errors.expectedBikes}
        />
        <SelectField
          label="Is your organization a nonprofit or a Bike Coalition Business Member?"
          name="organizationType"
          required
          options={organizationTypeOptions}
          defaultValue={values.organizationType}
          errors={errors.organizationType}
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
      <SubmitButton pending={pending} label="Send Request" />
    </form>
  );
}
