"use client";

import { useActionState, useId } from "react";
import { subscribeNewsletter } from "@/lib/forms/actions";
import { initialFormState } from "@/lib/forms/state";
import { FormAlert, HoneypotField, SuccessMessage } from "./fields";
import { TurnstileWidget } from "./turnstile-widget";

/**
 * The email box and Subscribe button inside NewsletterSignupForm. A single field, so it
 * keeps its own inline layout instead of TextField. Works without JavaScript: the
 * server action either answers with the success message or redirects to Constant
 * Contact's hosted page (see subscribeNewsletter).
 */
export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeNewsletter, initialFormState);
  const id = useId();
  const emailId = `${id}-email`;
  const errorId = `${id}-email-error`;

  if (state.status === "success") {
    const email = state.values?.email;
    return (
      <div className="mt-5">
        <SuccessMessage>
          Thanks for subscribing! {email ? `${email} is on our newsletter list.` : null}
        </SuccessMessage>
      </div>
    );
  }

  const emailErrors = state.fieldErrors?.email;

  return (
    <form action={formAction} className="mt-5 space-y-3">
      <FormAlert message={state.formError} />
      <div>
        <label htmlFor={emailId} className="field-label">
          Email address
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id={emailId}
            type="email"
            name="email"
            autoComplete="email"
            required
            defaultValue={state.values?.email}
            className="field-input border-asphalt/60"
            {...(emailErrors ? { "aria-invalid": true, "aria-describedby": errorId } : {})}
          />
          <button
            type="submit"
            className="btn btn-primary shrink-0 disabled:opacity-60"
            disabled={pending}
          >
            {pending ? "Subscribing…" : "Subscribe"}
          </button>
        </div>
        {emailErrors ? (
          <p id={errorId} className="mt-1 text-sm font-semibold text-red-700">
            {emailErrors.join(" ")}
          </p>
        ) : null}
      </div>
      <HoneypotField />
      <TurnstileWidget resetKey={state} />
    </form>
  );
}
