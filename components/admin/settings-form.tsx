"use client";

import { useActionState } from "react";
import {
  CheckboxField,
  FormAlert,
  RequiredNote,
  SubmitButton,
  TextareaField,
  TextField,
} from "@/components/forms/fields";
import { SETTING_FIELDS, type SettingField, settingGroups } from "@/lib/admin/settings/fields";
import { initialFormState, type FormState } from "@/lib/forms/state";
import type { SettingKey } from "@/lib/settings";

type SettingValues = Record<SettingKey, string>;

/** Mirrors settingIsTrue() in lib/settings.ts, which cannot be imported here (it pulls in Prisma). */
function isOn(value: string): boolean {
  return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
}

function isSettingKey(key: string): key is SettingKey {
  return Object.hasOwn(SETTING_FIELDS, key);
}

const DEFAULT_PREVIEW = 60;

/**
 * One form for every site setting, grouped into fieldsets. The page passes the save
 * action, the per-key reset action, the stored values and the code defaults.
 */
export function SettingsForm({
  action,
  resetAction,
  values: saved,
  defaults,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  resetAction: (key: string) => Promise<void>;
  values: SettingValues;
  defaults: SettingValues;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const errors = state.fieldErrors ?? {};
  // After a failed submit the echoed values win, because React resets uncontrolled inputs.
  const values: SettingValues = { ...saved, ...(state.values as Partial<SettingValues> | undefined) };

  // With this many fields, name the ones that need attention next to the summary.
  const problemLabels = Object.keys(errors)
    .filter(isSettingKey)
    .map((key) => SETTING_FIELDS[key].label);
  const formError =
    state.formError && problemLabels.length > 0 ? `${state.formError} Check: ${problemLabels.join(", ")}.` : state.formError;

  return (
    <form action={formAction} className="space-y-10">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-4 border-b border-asphalt/15 bg-white px-4 py-3">
        <RequiredNote />
        <SubmitButton pending={pending} label="Save settings" pendingLabel="Saving…" />
      </div>
      <FormAlert message={formError} />

      {settingGroups().map(([group, keys]) => (
        <fieldset key={group} className="space-y-5">
          <legend className="mb-5 text-xl sm:text-xl">{group}</legend>
          {keys.map((key) => (
            <SettingControl
              key={key}
              name={key}
              field={SETTING_FIELDS[key]}
              value={values[key]}
              saved={saved[key]}
              fallback={defaults[key]}
              errors={errors[key]}
              reset={resetAction.bind(null, key)}
            />
          ))}
        </fieldset>
      ))}

      <SubmitButton pending={pending} label="Save settings" pendingLabel="Saving…" />
    </form>
  );
}

function SettingControl({
  name,
  field,
  value,
  saved,
  fallback,
  errors,
  reset,
}: {
  name: SettingKey;
  field: SettingField;
  /** What the control shows: the stored value, or the echoed one after a failed save. */
  value: string;
  /** The stored value, compared with the code default for the "Default:" note. */
  saved: string;
  fallback: string;
  errors?: string[];
  reset: () => Promise<void>;
}) {
  const boolean = field.kind === "boolean";
  const customized = boolean ? isOn(saved) !== isOn(fallback) : saved !== fallback;
  const defaultLabel = boolean
    ? isOn(fallback)
      ? "on"
      : "off"
    : fallback.length > DEFAULT_PREVIEW
      ? `${fallback.slice(0, DEFAULT_PREVIEW)}…`
      : fallback;

  return (
    <div>
      {boolean ? (
        <CheckboxField label={field.label} name={name} defaultChecked={isOn(value)} errors={errors} help={field.help} />
      ) : field.kind === "textarea" ? (
        <TextareaField
          label={field.label}
          name={name}
          rows={3}
          maxLength={2000}
          defaultValue={value}
          errors={errors}
          help={field.help}
        />
      ) : (
        <TextField
          label={field.label}
          name={name}
          required
          type={field.kind === "email" ? "email" : "text"}
          inputMode={field.kind === "url" ? "url" : field.kind === "number" ? "numeric" : undefined}
          maxLength={field.kind === "number" ? 12 : field.kind === "text" ? 500 : 2000}
          defaultValue={value}
          errors={errors}
          help={field.help}
        />
      )}
      {customized ? (
        <p className="mt-1 text-sm text-asphalt/70">
          Default: <span className="break-all">{defaultLabel}</span>{" "}
          <button
            type="submit"
            formAction={reset}
            className="ml-2 font-semibold text-tahoe-deep underline"
            onClick={(event) => {
              if (!window.confirm(`Reset “${field.label}” to its default? Unsaved changes on this page will be lost.`)) {
                event.preventDefault();
              }
            }}
          >
            Reset to default
          </button>
        </p>
      ) : null}
    </div>
  );
}
