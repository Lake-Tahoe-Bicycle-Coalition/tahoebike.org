import Image from "next/image";
import type { ReactNode } from "react";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata({
  title: "Bike Safety",
  description:
    "If you're biking roadways or bike paths in Lake Tahoe, we just want you to be safe: watch the Bike Safe Lake Tahoe videos and read ten tips for biking in Tahoe.",
  path: "/bike-safety",
  image: {
    url: "/images/2022/05/BSmeets_141113_90004-4.jpg",
    alt: "A road cyclist in a yellow jersey riding the highway above Emerald Bay",
  },
});

const tips: { tip: ReactNode; explanation?: string }[] = [
  {
    tip: "Keep your bike properly maintained.",
    explanation:
      "Before the beginning of your ride make certain your brakes and gears work properly and your tires are inflated. Carry along a spare tire tube and patch kit, know how to use it, and have an air pump in the event of a flat tire.",
  },
  {
    tip: "Wear a helmet.",
    explanation:
      "It’s a great way to stay safe for anyone riding a bicycle, and in California it’s the law for anyone under 18.",
  },
  {
    tip: "Ride in the same direction as traffic flow.",
    explanation:
      "Riding against the traffic direction is not only illegal, it’s highly dangerous. Motorists are less likely to see you in time to avoid a collision, and the higher speed of any collision is more likely to cause you serious or fatal injuries.",
  },
  {
    tip: "Stop at all stop signs and red traffic lights.",
    explanation:
      "You and the bicycle are a vehicle with the same rights and responsibilities as an automobile. Obey all traffic laws.",
  },
  {
    tip: "Use proper hand signals when turning, stopping, or changing lanes.",
    explanation: "This alerts other road users of your intentions.",
  },
  {
    tip: "Ride in a straight line and in a single file.",
    explanation:
      "When we’re riding a bike, we all want drivers to avoid hitting us. Help drivers predict where you will be: ride in a straight line. Many roads do not have enough width to safely ride side by side so ride in single file and be safe.",
  },
  {
    tip: (
      <>
        <strong>Be seen: use lights</strong> (white in front and red in back), reflectors, and reflective
        clothing during darkness.
      </>
    ),
    explanation:
      "Both California and Nevada state law require lights and reflectors while bicycling at night. Be seen and be safe.",
  },
  {
    tip: "Ride to the right if you are moving slower than other traffic,",
    explanation: "unless you are turning left, passing another bicycle or vehicle, or avoiding hazards.",
  },
  {
    tip: "Do not impair your senses.",
    explanation:
      "Wearing headphones on both ears or riding your bike while under the influence of drugs or alcohol puts you and others at risk. People riding bikes are still subject to DUI citations.",
  },
  { tip: "Walk your bike when using a crosswalk." },
];

export default function BikeSafetyPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header>
        <h1>Bike Safety</h1>
        <div className="relative mt-8 aspect-[2/1] w-full overflow-hidden rounded-lg bg-bluebird/20">
          <Image
            src="/images/2022/05/BSmeets_141113_90004-4.jpg"
            alt="A road cyclist in a yellow jersey riding the highway above Emerald Bay"
            fill
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      </header>

      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2>Bike Safe Lake Tahoe</h2>
          <p className="text-lg">
            If you’re biking roadways or bike paths in Lake Tahoe, we just want you to be safe. Watch these
            safety videos on Lake Tahoe TV to brush up on bicycle safety tips!
          </p>
        </div>
        <div className="space-y-6">
          <YouTubeEmbed id="KBi3v6qOXUM" title="Bike Safe Lake Tahoe: spot 2" />
          <YouTubeEmbed id="uZgpssR-SzA" title="Bike Safe Lake Tahoe: spot 1" />
        </div>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2>Ten more tips for biking in Tahoe</h2>
        <ol className="mt-6 list-decimal space-y-4 pl-6 text-lg">
          {tips.map((item, i) => (
            <li key={i}>
              {typeof item.tip === "string" ? <strong>{item.tip}</strong> : item.tip}
              {item.explanation ? <span className="block">{item.explanation}</span> : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
