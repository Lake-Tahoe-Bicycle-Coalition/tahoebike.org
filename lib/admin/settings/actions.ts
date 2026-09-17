"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { adminListUrl, formFailure, parseAdminForm } from "@/lib/admin/form";
import { revalidateWholeSite } from "@/lib/admin/revalidate";
import { prisma } from "@/lib/db";
import type { FormState } from "@/lib/forms/state";
import { isSettingKey } from "@/lib/settings";
import { SETTING_FIELDS, settingFieldNames } from "./fields";
import { settingsSchema } from "./schema";

const PAGE = "/admin/settings";

/** Saves every setting at once (the page is one form), so a half-applied save is impossible. */
export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseAdminForm(formData, settingsSchema, settingFieldNames);
  if (!parsed.ok) return parsed.state;

  try {
    await prisma.$transaction(
      settingFieldNames.map((key) =>
        prisma.siteSetting.upsert({
          where: { key },
          create: { key, value: parsed.data[key] },
          update: { value: parsed.data[key] },
        }),
      ),
    );
  } catch (error) {
    console.error("[admin] could not save settings", error);
    return formFailure("The settings could not be saved. Please try again.", parsed.values);
  }
  revalidateWholeSite();
  redirect(adminListUrl(PAGE, "Saved settings."));
}

/**
 * Deletes one setting's row so the code default (lib/settings.ts) applies again. Bound
 * to its key by the form (`resetSetting.bind(null, key)`), which submits it from a
 * button inside the settings form; the form data itself is not needed.
 */
export async function resetSetting(key: string): Promise<void> {
  await requireAdmin();
  if (!isSettingKey(key)) redirect(PAGE);

  try {
    await prisma.siteSetting.deleteMany({ where: { key } });
  } catch (error) {
    console.error(`[admin] could not reset setting ${key}`, error);
    redirect(adminListUrl(PAGE, "That setting could not be reset. Please try again."));
  }
  revalidateWholeSite();
  redirect(adminListUrl(PAGE, `Reset “${SETTING_FIELDS[key].label}” to its default.`));
}
