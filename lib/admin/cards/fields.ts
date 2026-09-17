/**
 * Field list for the homepage card form, shared by the client component
 * (components/admin/homepage-card-form.tsx) and the server schema (./schema.ts). Zod-free.
 */

export const homepageCardFieldNames = ["title", "blurb", "ctaLabel", "ctaUrl", "imageUrl", "isActive"] as const;

export type HomepageCardFieldName = (typeof homepageCardFieldNames)[number];

/** The form's string values (what the inputs hold); the checkbox is "on" or "". */
export type HomepageCardFormValues = Record<HomepageCardFieldName, string>;

export const emptyHomepageCardFormValues: HomepageCardFormValues = {
  title: "",
  blurb: "",
  ctaLabel: "",
  ctaUrl: "",
  imageUrl: "",
  isActive: "on",
};
