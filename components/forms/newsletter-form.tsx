"use client";

import { useActionState, useId } from "react";
import { SIGNUP_LISTS, type SignupListKey, signupListKeys } from "@/lib/constant-contact-lists";
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
 * - "compact" (homepage, /join, /programs, /volunteer): the email box and Subscribe
 *   button on one row, subscribing to one primary list only (`primaryList`: the general
 *   newsletter by default, volunteers on /volunteer). Its success message is followed by
 *   an optional second form (NewsletterDetailsForm) for the name and the other lists.
 * - "full" (/newsletter, /advocacy): email, name and every list choice up front.
 *
 * Both show the lists as one "Newsletter Topics" group in SIGNUP_LISTS order. In compact
 * step two the list the visitor is already on (the primary list) is shown ticked and
 * disabled; a disabled box does not post, so that form carries a hidden
 * `lists=<primaryList>` instead. The full form's boxes are all ordinary ones, some ticked
 * to begin with (`defaultLists`).
 *
 * Works without JavaScript: each step is an ordinary form post answered by the server
 * action, which either returns the next state or redirects to Constant Contact's hosted
 * page (see subscribeNewsletter). The hidden `step` field ("1" or "2") is echoed back.
 */

export type NewsletterFormMode = "compact" | "full";

type Props = {
  mode: NewsletterFormMode;
  /** Full mode: boxes ticked when the form first renders. */
  defaultLists?: readonly SignupListKey[];
  /** Compact mode: the list step one subscribes to (default: the general newsletter). */
  primaryList?: SignupListKey;
};

export function NewsletterForm({
  mode,
  defaultLists = [],
  primaryList = "general",
}: Props) {
  return mode === "compact" ? (
    <CompactNewsletterForm primaryList={primaryList} />
  ) : (
    <FullNewsletterForm defaultLists={defaultLists} />
  );
}

const TOPICS_LEGEND = "Newsletter Topics";

/** Compact step one's success message, by primary list. */
function subscribedMessage(primary: SignupListKey, email: string): string {
  switch (primary) {
    case "general":
      return `You're subscribed. ${email} will get the monthly newsletter.`;
    case "volunteers":
      return `You're on the volunteer list. ${email} will hear about volunteer opportunities.`;
    default:
      return `You're subscribed. ${email} will hear about: ${SIGNUP_LISTS[primary].label}`;
  }
}

/** The comma-joined keys the action echoes back in `values.lists`, unknown keys dropped. */
function parseListKeys(joined: string | undefined): SignupListKey[] {
  const given = new Set((joined ?? "").split(","));
  return signupListKeys.filter((key) => given.has(key));
}

function describeLists(joined: string | undefined): string {
  return parseListKeys(joined)
    .map((key) => SIGNUP_LISTS[key].label)
    .join(" · ");
}

/** The boxes to tick: what was just submitted after an error, otherwise the defaults. */
function checkedLists(state: FormState, defaults: readonly SignupListKey[]): Set<SignupListKey> {
  return new Set(state.status === "error" && state.values ? parseListKeys(state.values.lists) : defaults);
}

// --- Compact: email only, then optional details ---------------------------------------

/**
 * A single field, so it keeps its own inline layout instead of TextField. Subscribes to
 * the primary list only (hidden `lists=<primaryList>`).
 */
function CompactNewsletterForm({ primaryList }: { primaryList: SignupListKey }) {
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
    return <NewsletterDetailsForm email={email} primaryList={primaryList} />;
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
      <input type="hidden" name="lists" value={primaryList} />
      <input type="hidden" name="step" value="1" />
      <HoneypotField />
      <TurnstileWidget resetKey={state} />
    </form>
  );
}

/**
 * Step two of the compact form, shown once the address is on the primary list: the
 * optional name and the other lists (the primary one shown ticked and disabled). It
 * posts the same address again with `lists=<primaryList>`, which keeps the schema's "at
 * least one list" rule satisfied and is a no-op in Constant Contact (sign_up_form only
 * ever adds lists).
 */
function NewsletterDetailsForm({ email, primaryList }: { email: string; primaryList: SignupListKey }) {
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
      <SuccessMessage>{subscribedMessage(primaryList, email)}</SuccessMessage>
      <form action={formAction} className="space-y-4">
        <div>
          <h3 className="text-lg">Tell us a little more</h3>
          {primaryList === "general" ? null : (
            <p className="mt-1">Add your name, or pick other newsletter topics.</p>
          )}
        </div>
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
        <PhoneRow defaultValue={values?.phone} errors={state.fieldErrors?.phone} />
        <NewsletterTopics checked={checked} locked={primaryList} errors={state.fieldErrors?.lists} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="lists" value={primaryList} />
        <input type="hidden" name="step" value="2" />
        <HoneypotField />
        <TurnstileWidget resetKey={state} />
        <SubmitButton pending={pending} label="Save" pendingLabel="Saving…" />
      </form>
    </div>
  );
}

// --- Full: everything up front -------------------------------------------------------

function FullNewsletterForm({ defaultLists }: { defaultLists: readonly SignupListKey[] }) {
  const [state, formAction, pending] = useActionState(subscribeNewsletter, initialFormState);

  if (state.status === "success") {
    const email = state.values?.email;
    const lists = describeLists(state.values?.lists);
    return (
      <div className="mt-5">
        <SuccessMessage>
          {email && lists ? `Thanks! You'll hear from us about: ${lists}` : "Thanks for signing up!"}
        </SuccessMessage>
      </div>
    );
  }

  const values = state.values;
  const errors = state.fieldErrors ?? {};
  const checked = checkedLists(state, defaultLists);

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
      <PhoneRow defaultValue={values?.phone} errors={errors.phone} />
      <NewsletterTopics checked={checked} errors={errors.lists} />
      <input type="hidden" name="step" value="1" />
      <HoneypotField />
      <TurnstileWidget resetKey={state} />
      <SubmitButton pending={pending} label="Sign up" pendingLabel="Signing up…" />
    </form>
  );
}

// --- Shared pieces -------------------------------------------------------------------

/** Optional phone, on its own row at the width of one name field. */
function PhoneRow({ defaultValue, errors }: { defaultValue?: string; errors?: string[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        label="Phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        maxLength={25}
        defaultValue={defaultValue}
        errors={errors}
      />
    </div>
  );
}

/**
 * Every list as one fieldset, so the "at least one" error is announced with the whole
 * group rather than with any single box. The `locked` list's box is ticked and
 * disabled; the form must then post `lists=<locked>` itself (hidden input).
 */
function NewsletterTopics({
  checked,
  locked,
  errors,
}: {
  checked: Set<SignupListKey>;
  locked?: SignupListKey;
  errors?: string[];
}) {
  return (
    <CheckboxGroup legend={TOPICS_LEGEND} errors={errors}>
      <div className="space-y-2">
        {signupListKeys.map((key) => {
          const isLocked = key === locked;
          return (
            <CheckboxField
              key={key}
              label={SIGNUP_LISTS[key].label}
              name="lists"
              value={key}
              disabled={isLocked}
              defaultChecked={isLocked || checked.has(key)}
            />
          );
        })}
      </div>
    </CheckboxGroup>
  );
}
