import { Notice } from "@/components/admin/notice";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/admin/auth";
import { resetSetting, saveSettings } from "@/lib/admin/settings/actions";
import { settingsToFormValues } from "@/lib/admin/settings/schema";
import { getSettings, SETTING_DEFAULTS } from "@/lib/settings";

export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  await requireAdmin();
  const { notice } = await searchParams;
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site settings"
        description="Prices, contact addresses, and the links to Memberful, Constant Contact, POINT and our social accounts. Changes appear across the whole site as soon as you save, and links here open the same way as any other link on the site, so check them before saving."
      />
      <Notice notice={notice} />
      <SettingsForm
        action={saveSettings}
        resetAction={resetSetting}
        values={settingsToFormValues(settings)}
        defaults={SETTING_DEFAULTS}
      />
    </div>
  );
}
