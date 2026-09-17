import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { HomepageCardForm } from "@/components/admin/homepage-card-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/auth";
import { blobConfigured } from "@/lib/admin/blob";
import { deleteHomepageCard, updateHomepageCard } from "@/lib/admin/cards/actions";
import { homepageCardToFormValues } from "@/lib/admin/cards/schema";
import { prisma } from "@/lib/db";

export default async function EditHomepageCardPage({ params }: PageProps<"/admin/cards/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const card = await prisma.homepageCard.findUnique({ where: { id } });
  if (!card) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit card"
        description={card.title}
        action={
          <Link href="/admin/cards" className="btn btn-secondary">
            Back to cards
          </Link>
        }
      />
      <HomepageCardForm
        action={updateHomepageCard.bind(null, card.id)}
        defaults={homepageCardToFormValues(card)}
        submitLabel="Save card"
        uploadEnabled={blobConfigured}
      />

      <section className="border-t border-asphalt/15 pt-6">
        <h2 className="text-lg sm:text-lg">Delete this card</h2>
        <p className="mt-1 text-sm text-asphalt/80">
          Removes it from the home page immediately, along with any uploaded image. This cannot be undone. To
          hide a card temporarily, untick “Active” instead.
        </p>
        <ConfirmForm
          action={deleteHomepageCard}
          message={`Delete “${card.title}”? This cannot be undone.`}
          className="mt-3"
        >
          <input type="hidden" name="id" value={card.id} />
          <button type="submit" className="btn btn-secondary border-red-700 text-red-700 hover:bg-red-700 hover:text-white">
            Delete card
          </button>
        </ConfirmForm>
      </section>
    </div>
  );
}
