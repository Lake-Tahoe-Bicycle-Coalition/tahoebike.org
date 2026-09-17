import { z } from "zod";
import { checkbox, emptyToNull, optionalLink, requiredLine, requiredLink, requiredText } from "@/lib/forms/validators";
import type { HomepageCard } from "@/lib/generated/prisma/client";
import type { HomepageCardFormValues } from "./fields";

/** Validates the homepage card form and produces the columns to write. Server-only. */
export const homepageCardSchema = z
  .object({
    title: requiredLine("Title", 120),
    blurb: requiredText("Blurb", 600),
    ctaLabel: requiredLine("Button label", 60),
    ctaUrl: requiredLink("Button link"),
    imageUrl: optionalLink("Image"),
    isActive: checkbox,
  })
  .transform((data) => ({ ...data, imageUrl: emptyToNull(data.imageUrl) }));

export type HomepageCardData = z.output<typeof homepageCardSchema>;

/** A stored card as form values (for the edit page). */
export function homepageCardToFormValues(card: HomepageCard): HomepageCardFormValues {
  return {
    title: card.title,
    blurb: card.blurb,
    ctaLabel: card.ctaLabel,
    ctaUrl: card.ctaUrl,
    imageUrl: card.imageUrl ?? "",
    isActive: card.isActive ? "on" : "",
  };
}
