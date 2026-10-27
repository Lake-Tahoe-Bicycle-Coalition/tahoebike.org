"use client";

import { useActionState, useId } from "react";
import {
  ADVOCACY_LIST_KEYS,
  SIGNUP_LISTS,
  type SignupListKey,
  signupListKeys,
} from "@/lib/constant-contact-lists";
import { subscribeNewsletter } from "@/lib/forms/actions";
import { type FormState, initialFormState } from "@/lib/forms/state";
import {
  CheckboxField,
  CheckboxGroup,
  FormAlert,
  HoneypotField,
  RequiredNote,
  SubmitButton,
  SuccessMessage,
  TextField,
} from "./fields";
import { TurnstileWidget } from "./turnstile-widget";

/**
 * The form inside NewsletterSignupForm. Every checkbox posts `lists=<key>` (keys of
 * SIGNUP_LISTS in lib/constant-contact-lists.ts) to the `subscribeNewsletter` action,
 * which adds the address to those Constant Contact lists. Two modes:
 *
 * - "compact" (homepage, /join, /programs): the email box and Subscribe button on one
 *   row, subscribing to the newsletter only. Its success message is followed by an
 *   optional second form (NewsletterDetailsForm) for the name and the other lists.
 * - "full" (/newsletter, /advocacy): email, name and every list choice up front.
 *
 * Works without JavaScript: each step is an ordinary form post answered by the server
 * action, which either returns the next state or redirects to Constant Contact's hosted
 * page (see subscribeNewsletter). The hidden `step` field ("1" or "2") is echoed back.
 */

export type NewsletterFormMode = "compact" | "full";

/** Whether the full form lists the newsletter before or after the "Where do you ride?" group. */
export type NewsletterListOrder = "newsletter-first" | "advocacy-first";

type Props = {
  mode: NewsletterFormMode;
  /** Full mode: boxes ticked when the form first renders. */
  defaultLists?: readonly SignupListKey[];
  listOrder?: NewsletterListOrder;
};

export function NewsletterForm({ mode, defaultLists = [], listOrder = "newsletter-first" }: Props) {
  return mode === "compact" ? (
    <CompactNewsletterForm />
  ) : (
    <FullNewsletterForm defaultLists={defaultLists} listOrder={listOrder} />
  );
}

/** How the success messages name each list: "You'll hear from us about: …". */
const LIST_PHRASES: Record<SignupListKey, string> = {
  general: "the monthly newsletter",
  advocacy_south: "projects in South Lake Tahoe",
  advocacy_north: "projects in North Lake Tahoe",
  advocacy_truckee: "projects in Truckee",
  volunteers: "volunteering",
};

const NEWSLETTER_HELP = "Tahoe biking news, events and volunteer opportunities, about once a month.";
const ADVOCACY_LEGEND = "Where do you ride?";
const ADVOCACY_HELP = "We'll email you when a project there is open for public comment.";

/** The comma-joined keys the action echoes back in `values.lists`, unknown keys dropped. */
function parseListKeys(joined: string | undefined): SignupListKey[] {
  const given = new Set((joined ?? "").split(","));
  return signupListKeys.filter((key) => given.has(key));
}

function describeLists(joined: string | undefined): string {
  return parseListKeys(joined)
    .map((key) => LIST_PHRASES[key])
    .join(" · ");
}

/** The boxes to tick: what was just submitted after an error, otherwise the defaults. */
function checkedLists(state: FormState, defaults: readonly SignupListKey[]): Set<SignupListKey> {
  return new Set(state.status === "error" && state.values ? parseListKeys(state.values.lists) : defaults);
}

// --- Compact: email only, then optional details ---------------------------------------

/**
 * A single field, so it keeps its own inline layout instead of TextField. Subscribes to
 * the newsletter list only (hidden `lists=general`).
 */
function CompactNewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeNewsletter, initialFormState);
  const id = useId();
  const emailId = `${id}-email`;
  const errorId = `${id}-email-error`;

  if (state.status === "success") {
    const email = state.values?.email;
    // No address only when the honeypot answered; there is nothing to add details to.
    if (!email) {
      return (
        <div className="mt-5">
          <SuccessMessage>Thanks for subscribing!</SuccessMessage>
        </div>
      );
    }
    return <NewsletterDetailsForm email={email} />;
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
      <input type="hidden" name="lists" value="general" />
      <input type="hidden" name="step" value="1" />
      <HoneypotField />
      <TurnstileWidget resetKey={state} />
    </form>
  );
}

/**
 * Step two of the compact form, shown once the address is on the newsletter list: the
 * optional name and the other lists. It posts the same address again with
 * `lists=general`, which keeps the schema's "at least one list" rule satisfied and is a
 * no-op in Constant Contact (sign_up_form only ever adds lists).
 */
function NewsletterDetailsForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(subscribeNewsletter, initialFormState);

  if (state.status === "success") {
    return (
      <div className="mt-5">
        <SuccessMessage>
          All set. You&apos;ll hear from us about: {describeLists(state.values?.lists)}
        </SuccessMessage>
      </div>
    );
  }

  const values = state.values;
  const checked = checkedLists(state, []);
  // The address is hidden here, so a problem with it can only be shown as a form error.
  const formError = state.formError ?? state.fieldErrors?.email?.join(" ");

  return (
    <div className="mt-5 space-y-5">
      <SuccessMessage>
        You&apos;re subscribed. {email} will get the monthly newsletter.
      </SuccessMessage>
      <form action={formAction} className="space-y-4">
        <h3 className="text-lg">Tell us a little more (optional)</h3>
        <FormAlert message={formError} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="First name"
            name="firstName"
            autoComplete="given-name"
            maxLength={50}
            defaultValue={values?.firstName}
            errors={state.fieldErrors?.firstName}
          />
          <TextField
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            maxLength={50}
            defaultValue={values?.lastName}
            errors={state.fieldErrors?.lastName}
          />
        </div>
        <AdvocacyGroup checked={checked} errors={state.fieldErrors?.lists} />
        <VolunteerCheckbox checked={checked} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="lists" value="general" />
        <input type="hidden" name="step" value="2" />
        <HoneypotField />
        <TurnstileWidget resetKey={state} />
        <SubmitButton pending={pending} label="Save" pendingLabel="Saving…" />
      </form>
    </div>
  );
}

// --- Full: everything up front -------------------------------------------------------

function FullNewsletterForm({
  defaultLists,
  listOrder,
}: {
  defaultLists: readonly SignupListKey[];
  listOrder: NewsletterListOrder;
}) {
  const [state, formAction, pending] = useActionState(subscribeNewsletter, initialFormState);

  if (state.status === "success") {
    const email = state.values?.email;
    const lists = describeLists(state.values?.lists);
    return (
      <div className="mt-5">
        <SuccessMessage>
          {email && lists ? `Thanks! ${email} will hear from us about: ${lists}` : "Thanks for signing up!"}
        </SuccessMessage>
      </div>
    );
  }

  const values = state.values;
  const errors = state.fieldErrors ?? {};
  const checked = checkedLists(state, defaultLists);

  const newsletter = (
    <CheckboxField
      key="general"
      label={SIGNUP_LISTS.general.label}
      name="lists"
      value="general"
      help={NEWSLETTER_HELP}
      defaultChecked={checked.has("general")}
    />
  );
  const advocacy = <AdvocacyGroup key="advocacy" checked={checked} />;

  return (
    <form action={formAction} className="mt-5 space-y-5">
      <FormAlert message={state.formError} />
      <RequiredNote />
      <TextField
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={values?.email}
        errors={errors.email}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="First name"
          name="firstName"
          autoComplete="given-name"
          maxLength={50}
          defaultValue={values?.firstName}
          errors={errors.firstName}
        />
        <TextField
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          maxLength={50}
          defaultValue={values?.lastName}
          errors={errors.lastName}
        />
      </div>
      {/* One fieldset around every list choice, so the "at least one" error is announced
          with the whole group rather than with any single box. */}
      <CheckboxGroup
        legend="What would you like to hear about?"
        errors={errors.lists}
        className="space-y-4"
      >
        {listOrder === "advocacy-first" ? [advocacy, newsletter] : [newsletter, advocacy]}
        <VolunteerCheckbox checked={checked} />
      </CheckboxGroup>
      <input type="hidden" name="step" value="1" />
      <HoneypotField />
      <TurnstileWidget resetKey={state} />
      <SubmitButton pending={pending} label="Sign up" pendingLabel="Signing up…" />
    </form>
  );
}

// --- Shared pieces -------------------------------------------------------------------

function AdvocacyGroup({ checked, errors }: { checked: Set<SignupListKey>; errors?: string[] }) {
  return (
    <CheckboxGroup
      legend={ADVOCACY_LEGEND}
      help={ADVOCACY_HELP}
      errors={errors}
      legendClassName="font-semibold"
    >
      <div className="space-y-2">
        {ADVOCACY_LIST_KEYS.map((key) => (
          <CheckboxField
            key={key}
            label={SIGNUP_LISTS[key].label}
            name="lists"
            value={key}
            defaultChecked={checked.has(key)}
          />
        ))}
      </div>
    </CheckboxGroup>
  );
}

function VolunteerCheckbox({ checked }: { checked: Set<SignupListKey> }) {
  return (
    <CheckboxField
      label={SIGNUP_LISTS.volunteers.label}
      name="lists"
      value="volunteers"
      defaultChecked={checked.has("volunteers")}
    />
  );
}
