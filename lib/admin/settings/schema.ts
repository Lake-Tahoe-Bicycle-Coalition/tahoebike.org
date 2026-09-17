import { z } from "zod";
import { checkbox, email, optionalText, requiredLine, requiredLink, wholeNumber } from "@/lib/forms/validators";
import type { SettingKey, Settings } from "@/lib/settings";
import { SETTING_FIELDS, type SettingField, settingFieldNames } from "./fields";

/**
 * Validates the settings form. Server-only. Every setting is stored as a string, so
 * each validator normalizes back to the string the public pages expect ("150",
 * "true"/"false", a trimmed URL).
 */
function validatorFor(field: SettingField): z.ZodType<string> {
  switch (field.kind) {
    case "email":
      return email;
    case "url":
      return requiredLink(field.label);
    case "number":
      return wholeNumber(field.label, field.max ?? 1_000_000, 0).transform(String);
    case "boolean":
      return checkbox.transform((on) => (on ? "true" : "false"));
    case "textarea":
      return optionalText(field.label, 2000);
    case "text":
      return requiredLine(field.label, 500);
  }
}

const shape = Object.fromEntries(
  settingFieldNames.map((key) => [key, validatorFor(SETTING_FIELDS[key])]),
) as Record<SettingKey, z.ZodType<string>>;

export const settingsSchema = z.object(shape);

export type SettingsData = z.output<typeof settingsSchema>;

/** The stored settings as form values (they are strings already; this names the step). */
export function settingsToFormValues(settings: Settings): Record<SettingKey, string> {
  return { ...settings };
}
