import { revalidatePath } from "next/cache";

/**
 * Public pages are static and re-render every five minutes (app/layout.tsx). After an
 * admin edit, purge the pages that show the changed content so the edit is visible at
 * once. Announcements and settings render in the root layout, so those purge everything.
 */

/** Bike Kitchen events show on /bike-kitchen, Bike Valet on /bike-valet, Other on the home page. */
export function revalidateEvents() {
  revalidatePath("/bike-kitchen");
  revalidatePath("/bike-valet");
  revalidatePath("/");
}

export function revalidateBoard() {
  revalidatePath("/about");
}

export function revalidateHomepageCards() {
  revalidatePath("/");
}

export function revalidateWholeSite() {
  revalidatePath("/", "layout");
}
