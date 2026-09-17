import Image from "next/image";
import Link from "next/link";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { Notice } from "@/components/admin/notice";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteHomepageCard, moveHomepageCard, toggleHomepageCardActive } from "@/lib/admin/cards/actions";
import { prisma } from "@/lib/db";
import { isOptimizableImageUrl } from "@/lib/urls";

export default async function HomepageCardsPage({ searchParams }: PageProps<"/admin/cards">) {
  await requireAdmin();
  const { notice } = await searchParams;

  const cards = await prisma.homepageCard.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homepage cards"
        description="The home page shows the active cards in this order, under the banner. Inactive cards stay here but are hidden from the site."
        action={
          <Link href="/admin/cards/new" className="btn btn-primary">
            New card
          </Link>
        }
      />
      <Notice notice={notice} />

      {cards.length === 0 ? (
        <p>No cards yet. Add one to show it on the home page.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Image</span>
                </th>
                <th scope="col">Title</th>
                <th scope="col">Button</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card, index) => (
                <tr key={card.id} className={card.isActive ? undefined : "opacity-60"}>
                  <td className="w-20">
                    <div className="relative h-12 w-16 overflow-hidden rounded bg-tahoe/10">
                      {card.imageUrl ? (
                        <Image
                          src={card.imageUrl}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized={!isOptimizableImageUrl(card.imageUrl)}
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs text-asphalt/60">
                          None
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="font-semibold">
                    <Link href={`/admin/cards/${card.id}`}>{card.title}</Link>
                  </td>
                  <td>
                    {card.ctaLabel} <span aria-hidden="true">→</span>{" "}
                    <span className="break-all text-asphalt/70">{card.ctaUrl}</span>
                  </td>
                  <td>
                    <span className={card.isActive ? "badge badge-active" : "badge"}>
                      {card.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <Link href={`/admin/cards/${card.id}`}>Edit</Link>
                      <form action={moveHomepageCard}>
                        <input type="hidden" name="id" value={card.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          disabled={index === 0}
                          className="disabled:opacity-40"
                          aria-label={`Move “${card.title}” up`}
                        >
                          Move up
                        </button>
                      </form>
                      <form action={moveHomepageCard}>
                        <input type="hidden" name="id" value={card.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          disabled={index === cards.length - 1}
                          className="disabled:opacity-40"
                          aria-label={`Move “${card.title}” down`}
                        >
                          Move down
                        </button>
                      </form>
                      <form action={toggleHomepageCardActive}>
                        <input type="hidden" name="id" value={card.id} />
                        <button type="submit">{card.isActive ? "Deactivate" : "Activate"}</button>
                      </form>
                      <ConfirmForm action={deleteHomepageCard} message={`Delete “${card.title}”? This cannot be undone.`}>
                        <input type="hidden" name="id" value={card.id} />
                        <button type="submit" className="danger">
                          Delete
                        </button>
                      </ConfirmForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
