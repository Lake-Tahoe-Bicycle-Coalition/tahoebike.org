import type { Metadata } from "next";
import Link from "next/link";
import { BikeIcon } from "@/components/icons";
import { SmartLink } from "@/components/smart-link";

export const metadata: Metadata = { title: "Page not found" };

const topTasks = [
  { label: "Interactive Bike Map", href: "https://map.tahoebike.org/" },
  { label: "Join or donate", href: "/join" },
  { label: "Volunteer", href: "/volunteer" },
  { label: "Bike Kitchen", href: "/bike-kitchen" },
  { label: "Bike Valet", href: "/bike-valet" },
  { label: "Contact", href: "/contact" },
];

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="flex items-center gap-3">
        <BikeIcon className="h-10 w-14 shrink-0 text-tahoe-deep" />
        Wrong turn?
      </h1>
      <p className="mt-4">
        We couldn’t find that page. It may have moved when we rebuilt the site. Here are the places
        people look for most:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6">
        {topTasks.map((task) => (
          <li key={task.href}>
            <SmartLink href={task.href}>{task.label}</SmartLink>
          </li>
        ))}
      </ul>
      <p className="mt-6">
        <Link href="/contact">Tell us what you were looking for</Link> and we’ll point you in the
        right direction.
      </p>
    </div>
  );
}
