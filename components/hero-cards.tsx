import Image from "next/image";
import { SmartLink } from "@/components/smart-link";
import type { HomepageCard } from "@/lib/generated/prisma/client";
import { isOptimizableImageUrl } from "@/lib/urls";

type Card = Pick<HomepageCard, "id" | "title" | "blurb" | "ctaLabel" | "ctaUrl" | "imageUrl">;

/**
 * The homepage hero callout cards (admin-managed `HomepageCard` rows).
 * Renders nothing when there are no active cards.
 */
export function HeroCards({ cards }: { cards: Card[] }) {
  if (cards.length === 0) return null;

  return (
    <section aria-label="Highlights">
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(15rem,1fr))]">
        {cards.map((card) => (
          <li
            key={card.id}
            className="flex flex-col overflow-hidden rounded-lg border border-asphalt/10 bg-white"
          >
            {card.imageUrl ? (
              <div className="relative aspect-[4/3] w-full bg-tahoe/10">
                <Image
                  src={card.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                  unoptimized={!isOptimizableImageUrl(card.imageUrl)}
                />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col gap-3 p-5">
              <h2 className="text-xl sm:text-xl">{card.title}</h2>
              <p className="flex-1">{card.blurb}</p>
              <p>
                <SmartLink href={card.ctaUrl} className="btn btn-primary">
                  {card.ctaLabel}
                </SmartLink>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
