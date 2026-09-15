import { prisma } from "@/lib/db";

/**
 * Site settings live in the `SiteSetting` table and are editable in /admin.
 * Every key has a code default so the site renders even with an empty table.
 * The seed script writes these defaults into the database.
 */
export const SETTING_DEFAULTS = {
  // Membership and donations (Memberful)
  membership_price_individual: "20",
  membership_price_family: "40",
  membership_price_business: "100",
  memberful_individual_url: "https://tahoebike.memberful.com/checkout?plan=73137",
  memberful_family_url: "https://tahoebike.memberful.com/checkout?plan=73138",
  memberful_business_url: "https://tahoebike.memberful.com/checkout?plan=78611",
  memberful_one_time_donation_url: "https://tahoebike.memberful.com/gift?plan=84559",
  memberful_recurring_donation_url: "https://tahoebike.memberful.com/checkout?plan=84567",
  memberful_checkout_url: "https://tahoebike.memberful.com/checkout",
  memberful_one_time_donation_plan: "84559",
  memberful_recurring_donation_plan: "84567",

  // Contact
  contact_email: "info@tahoebike.org",
  bike_kitchen_email: "bikekitchen@tahoebike.org",
  bike_valet_email: "bikevalet@tahoebike.org",
  mailing_address: "PO Box 1147, Zephyr Cove, NV 89448",

  // Newsletter and volunteer lists (Constant Contact)
  constant_contact_signup_url:
    "https://visitor.r20.constantcontact.com/manage/optin?v=00102zBK1ZSE4ZhF4LhxVBqPxWpLUk85oGP9B0AgiQrGDbn_fzGitCqoim-BXR7_weZtb-tfl4pxK1qPDJkPx3VfVa9ihdOubDPO3ts5_fkwCsSh_pA9kfzgqCn14fr6c9GKWpiZVZkUGb3Lv1jLpIVeG4cNU8K_rNQ2603LV821pwlYQ9H_1vB0_BxH3XSAWMgoXEItf7kGR4%3D",
  constant_contact_volunteer_url: "https://lp.constantcontactpages.com/su/siO8tF5/volunteer",
  constant_contact_account_id: "a07e270p4wa0",

  // Volunteer shifts (POINT)
  point_org_url: "https://dash.pointapp.org/organizations/6415",
  point_embed_url:
    "https://pointapp.org/embed/0d7542f1-167e-47df-ad69-5256768f9637?size=12&show_search=true&viewOptions=grid&showDayOfWeek=true&showLocation=true&showSpots=true&widgetId=1149",

  // Other properties and social
  map_url: "https://map.tahoebike.org/",
  bike_month_url: "https://www.tahoebikemonth.org/",
  facebook_url: "https://www.facebook.com/laketahoebicyclecoalition",
  instagram_url: "https://www.instagram.com/tahoebike/",

  // Programs
  bike_valet_daily_rate: "150",
  /** "true" while the Regional Bicycle Parking Program accepts applications. */
  rack_program_open: "false",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type Settings = Record<SettingKey, string>;

export function isSettingKey(key: string): key is SettingKey {
  return Object.hasOwn(SETTING_DEFAULTS, key);
}

/** All settings, database values layered over code defaults. */
export async function getSettings(): Promise<Settings> {
  const settings: Settings = { ...SETTING_DEFAULTS };
  try {
    const rows = await prisma.siteSetting.findMany();
    for (const row of rows) {
      if (isSettingKey(row.key)) settings[row.key] = row.value;
    }
  } catch (error) {
    console.error("Could not load site settings; using defaults.", error);
  }
  return settings;
}

export function settingIsTrue(value: string): boolean {
  return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
}
