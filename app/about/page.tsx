import Image from "next/image";
import { BoardRoster } from "@/components/board-roster";
import { getBoard } from "@/lib/content";
import { Markdown } from "@/lib/markdown";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata({
  title: "About Us",
  description:
    "The Lake Tahoe Bicycle Coalition is an all-volunteer organization dedicated to promoting bicycling, bike events, and new bicycle infrastructure throughout the Tahoe region.",
  path: "/about",
  image: {
    url: "/images/2022/05/reichel-slider.jpeg",
    alt: "A child pushes an adult riding a tiny kids' bike along the Lake Tahoe shore",
  },
});

export default async function AboutPage() {
  const { board, advisors } = await getBoard();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header>
        <h1>About Us</h1>
        <p className="mt-4 text-xl">Helping Tahoe to become more bicycle friendly.</p>
        <Image
          src="/images/2022/05/reichel-slider.jpeg"
          alt="A child pushes an adult riding a tiny kids' bike along the Lake Tahoe shore"
          width={1170}
          height={500}
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="mt-8 h-auto w-full rounded-lg"
          priority
        />
      </header>

      <section className="mt-12 grid items-center gap-8 md:grid-cols-2">
        <Image
          src="/images/2022/05/2020.05.07_Biking_Upper-Truckee-Marsh_California-Tahoe-Conservancy_DSC_2193.jpg"
          alt="Two cyclists riding a dirt trail through the Upper Truckee Marsh with snow-capped mountains behind"
          width={2510}
          height={1670}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="hidden h-auto w-full rounded-lg md:block"
        />
        <div className="space-y-4">
          <h2>Lake Tahoe Bicycle Coalition</h2>
          <p>
            The Lake Tahoe Bicycle Coalition is an all-volunteer organization dedicated to promoting bicycling,
            bike events, and new bicycle infrastructure such as bike paths and bike lanes throughout the Tahoe
            region.
          </p>
          <p>
            <strong>Our Mission:</strong> Helping Tahoe To Become More Bicycle Friendly.
          </p>
          <p>
            <strong>Our Vision:</strong> Tahoe being an attractive, safe, and widely known community for
            bicycling.
          </p>
        </div>
      </section>

      <section className="mt-16">
        <h2>Meet the Board of Directors</h2>
        <div className="mt-8">
          <BoardRoster members={board} />
        </div>
      </section>

      {advisors.length > 0 ? (
        <section className="mt-16">
          <h2>Advisors</h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {advisors.map((advisor) => (
              <li key={advisor.id}>
                <h3>{advisor.name}</h3>
                {advisor.role && advisor.role.toLowerCase() !== "advisor" ? (
                  <p className="font-semibold text-asphalt/70">{advisor.role}</p>
                ) : null}
                {advisor.bio.trim() ? (
                  <div className="mt-1 space-y-2">
                    <Markdown source={advisor.bio} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
