import type { SettingKey } from "@/lib/settings";

/**
 * How each site setting is presented and validated in /admin/settings, shared by the
 * client component (components/admin/settings-form.tsx) and the server schema
 * (./schema.ts). Zod-free. The keys and code defaults live in lib/settings.ts; the
 * `satisfies` clause makes a new key there a type error here until it gets a field.
 */

export const SETTING_GROUPS = [
  "Membership and donations",
  "Contact",
  "Newsletter and volunteers",
  "Other properties and social",
  "Programs",
] as const;

export type SettingGroup = (typeof SETTING_GROUPS)[number];

export type SettingFieldKind = "text" | "email" | "url" | "number" | "boolean" | "textarea";

export type SettingField = {
  label: string;
  group: SettingGroup;
  kind: SettingFieldKind;
  /** Short hint shown under the control. */
  help?: string;
  /** Upper bound for "number" fields (default 1,000,000). */
  max?: number;
};

const PLAN_HELP = "The numeric plan id from Memberful. It must match the plan in the matching checkout link above.";

export const SETTING_FIELDS = {
  // Membership and donations (Memberful)
  membership_price_individual: {
    label: "Individual membership price",
    group: "Membership and donations",
    kind: "number",
    help: "Whole dollars per year, shown on the Join page.",
  },
  membership_price_family: {
    label: "Family membership price",
    group: "Membership and donations",
    kind: "number",
    help: "Whole dollars per year, shown on the Join page.",
  },
  membership_price_business: {
    label: "Business membership price",
    group: "Membership and donations",
    kind: "number",
    help: "Whole dollars per year, shown on the Join page.",
  },
  memberful_individual_url: {
    label: "Individual membership checkout link",
    group: "Membership and donations",
    kind: "url",
    help: "Where the “Join” button for an individual membership goes.",
  },
  memberful_family_url: {
    label: "Family membership checkout link",
    group: "Membership and donations",
    kind: "url",
    help: "Where the “Join” button for a family membership goes.",
  },
  memberful_business_url: {
    label: "Business membership checkout link",
    group: "Membership and donations",
    kind: "url",
    help: "Where the “Join” button for a business membership goes.",
  },
  memberful_one_time_donation_url: {
    label: "One-time donation link",
    group: "Membership and donations",
    kind: "url",
    help: "Where the “Donate” button for a one-time gift goes.",
  },
  memberful_recurring_donation_url: {
    label: "Recurring donation link",
    group: "Membership and donations",
    kind: "url",
    help: "Where the “Donate” button for a monthly gift goes.",
  },
  memberful_checkout_url: {
    label: "Memberful checkout address",
    group: "Membership and donations",
    kind: "url",
    help: "The “choose your amount” donation forms on the Join page send people here with a plan and a price.",
  },
  memberful_one_time_donation_plan: {
    label: "One-time donation plan id",
    group: "Membership and donations",
    kind: "number",
    max: 999_999_999,
    help: PLAN_HELP,
  },
  memberful_recurring_donation_plan: {
    label: "Recurring donation plan id",
    group: "Membership and donations",
    kind: "number",
    max: 999_999_999,
    help: PLAN_HELP,
  },

  // Contact
  contact_email: {
    label: "General contact email",
    group: "Contact",
    kind: "email",
    help: "Shown in the footer and on the Contact page; receives contact-form messages and bike rack applications.",
  },
  bike_kitchen_email: {
    label: "Bike Kitchen email",
    group: "Contact",
    kind: "email",
    help: "Shown on the Bike Kitchen page.",
  },
  bike_valet_email: {
    label: "Bike Valet email",
    group: "Contact",
    kind: "email",
    help: "Shown on the Bike Valet page; receives bike valet requests.",
  },
  mailing_address: {
    label: "Mailing address",
    group: "Contact",
    kind: "text",
    help: "One line, shown in the footer and on the Contact page.",
  },

  // Newsletter and volunteer lists (Constant Contact), volunteer shifts (POINT)
  constant_contact_signup_url: {
    label: "Newsletter sign-up link",
    group: "Newsletter and volunteers",
    kind: "url",
    help: "The Constant Contact opt-in page the newsletter sign-up forms post to.",
  },
  constant_contact_volunteer_url: {
    label: "Volunteer email list link",
    group: "Newsletter and volunteers",
    kind: "url",
    help: "The Constant Contact sign-up page for the volunteer list, linked from Join, Volunteer and Contact.",
  },
  constant_contact_account_id: {
    label: "Constant Contact account id",
    group: "Newsletter and volunteers",
    kind: "text",
    help: "Used to load past newsletters on the Newsletter page and the Join page.",
  },
  point_org_url: {
    label: "POINT organization page",
    group: "Newsletter and volunteers",
    kind: "url",
    help: "The “see all shifts” link on the Volunteer and Bike Kitchen pages.",
  },
  point_embed_url: {
    label: "POINT widget address",
    group: "Newsletter and volunteers",
    kind: "url",
    help: "The embed address of the POINT shift widget shown on the Volunteer page. Copy it from POINT’s embed code.",
  },

  // Other properties and social
  map_url: {
    label: "Bike map link",
    group: "Other properties and social",
    kind: "url",
    help: "The online bike map, linked from the homepage and the Programs page.",
  },
  bike_month_url: {
    label: "Bike Month site",
    group: "Other properties and social",
    kind: "url",
    help: "Linked from the Programs page.",
  },
  facebook_url: {
    label: "Facebook page",
    group: "Other properties and social",
    kind: "url",
  },
  instagram_url: {
    label: "Instagram profile",
    group: "Other properties and social",
    kind: "url",
  },

  // Programs
  bike_valet_daily_rate: {
    label: "Bike Valet starting rate per day",
    group: "Programs",
    kind: "number",
    help: "Whole dollars. The Bike Valet page says rates start at this amount.",
  },
  rack_program_open: {
    label: "Accepting bike rack applications",
    group: "Programs",
    kind: "boolean",
    help: "The application form on the Bike Racks page is shown only while this is on. Turn it off when the round closes.",
  },
} satisfies Record<SettingKey, SettingField>;

export const settingFieldNames = Object.keys(SETTING_FIELDS) as SettingKey[];

/** The keys of every group, in display order (groups without keys are left out). */
export function settingGroups(): [SettingGroup, SettingKey[]][] {
  return SETTING_GROUPS.map(
    (group): [SettingGroup, SettingKey[]] => [
      group,
      settingFieldNames.filter((key) => SETTING_FIELDS[key].group === group),
    ],
  ).filter(([, keys]) => keys.length > 0);
}
