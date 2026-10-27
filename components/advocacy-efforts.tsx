"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { SmartLink } from "@/components/smart-link";
import type { AdvocacyArea, AdvocacyPosition, ListedAdvocacyEffort } from "@/lib/advocacy";

/** Filter chip order; only areas with at least one effort get a chip. */
const AREA_ORDER: AdvocacyArea[] = [
  "South Shore",
  "North Shore",
  "East Shore",
  "West Shore",
  "Truckee",
  "Lake-wide",
];

const POSITION_CHIP: Record<AdvocacyPosition, string> = {
  Support: "bg-tahoe/15 text-tahoe-deep",
  Comment: "bg-neutral-200 text-asphalt",
  Opposition: "bg-safety text-asphalt",
  Mixed: "bg-neutral-200 text-asphalt",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-10" → "Sep 10, 2026". Plain string work, so the server and every browser agree. */
function formatDay(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${MONTHS[Number(month) - 1]} ${Number(day)}, ${year}`;
}

/** "2026-09-10" → "Sep 2026". */
function formatMonth(iso: string): string {
  const [year, month] = iso.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

type Filter = AdvocacyArea | "All";

/**
 * The /advocacy list of efforts: area filter chips, then one expandable card per effort with
 * its summary, asks and letters. The cards are native `<details>`, so they open and close
 * without JavaScript; with it, the chips filter the list and `/advocacy#<slug>` (including
 * the "Related" links) opens and scrolls to that effort.
 */
export function AdvocacyEfforts({ efforts }: { efforts: ListedAdvocacyEffort[] }) {
  const [filter, setFilter] = useState<Filter>("All");

  const sorted = [...efforts].sort((a, b) => b.latest.localeCompare(a.latest));
  const titles = new Map(efforts.map((effort) => [effort.slug, effort.title]));
  const areas = AREA_ORDER.map((area) => ({
    area,
    count: efforts.filter((effort) => effort.area === area).length,
  })).filter(({ count }) => count > 0);
  const shown = filter === "All" ? sorted : sorted.filter((effort) => effort.area === filter);

  useEffect(() => {
    /** Opens and scrolls to the effort named in the URL hash, clearing the filter if it hides it. */
    const revealHash = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1));
      const effort = efforts.find((candidate) => candidate.slug === slug);
      if (!effort) return;
      // Render the target first if the current filter hides it.
      if (!document.getElementById(slug)) flushSync(() => setFilter("All"));
      const details = document.getElementById(slug);
      if (!(details instanceof HTMLDetailsElement)) return;
      details.open = true;
      // Follows the CSS scroll-behavior (smooth unless reduced motion) and scroll-padding-top.
      details.scrollIntoView({ block: "start" });
    };

    revealHash();
    window.addEventListener("hashchange", revealHash);
    return () => window.removeEventListener("hashchange", revealHash);
  }, [efforts]);

  // Clicking a "Related" link whose target is already the hash fires no hashchange.
  const onRelatedClick = (event: MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (window.location.hash !== `#${slug}`) return;
    event.preventDefault();
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  return (
    <div>
      <div role="group" aria-label="Filter by area" className="flex flex-wrap gap-2">
        {[{ area: "All" as const, count: efforts.length }, ...areas].map(({ area, count }) => {
          const selected = filter === area;
          return (
            <button
              key={area}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(area)}
              className={`rounded-full border px-4 py-1.5 text-sm font-bold transition-colors ${
                selected
                  ? "border-asphalt bg-asphalt text-white"
                  : "border-asphalt/30 bg-white text-asphalt hover:border-asphalt"
              }`}
            >
              {area}{" "}
              <span className={`font-normal ${selected ? "text-white/80" : "text-asphalt/60"}`}>{count}</span>
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {filter === "All"
          ? `Showing all ${shown.length} efforts`
          : `Showing ${shown.length} ${filter} ${shown.length === 1 ? "effort" : "efforts"}`}
      </p>

      <ul className="mt-6 space-y-4">
        {shown.map((effort) => {
          const [firstAgency, ...otherAgencies] = effort.agencies;
          const letterCount = effort.letters.length;
          return (
            <li key={effort.slug}>
              <details
                id={effort.slug}
                className="group rounded-lg border border-asphalt/10 bg-white open:border-tahoe/40 open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0">
                    <h3 className="text-lg">{effort.title}</h3>
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <span className={`badge ${POSITION_CHIP[effort.position]}`}>{effort.position}</span>
                      <span className="badge border border-asphalt/20 bg-white">{effort.area}</span>
                      {firstAgency ? (
                        <span className="text-asphalt/70">
                          {firstAgency}
                          {otherAgencies.length > 0 ? ` +${otherAgencies.length} more` : null}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-4 text-sm text-asphalt/70 sm:justify-end">
                    <p className="sm:text-right">
                      <span className="block">Latest letter {formatMonth(effort.latest)}</span>
                      <span className="block">
                        {letterCount} {letterCount === 1 ? "letter" : "letters"}
                      </span>
                    </p>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      className="h-5 w-5 shrink-0 text-asphalt group-open:rotate-180 motion-safe:transition-transform"
                    >
                      <path
                        d="M5 7.5l5 5 5-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </summary>

                <div className="space-y-5 border-t border-asphalt/10 px-5 pt-5 pb-5">
                  <p className="text-lg">{effort.summary}</p>

                  <div>
                    <h4 className="text-base">What we asked for</h4>
                    <ul className="mt-2 list-disc space-y-1 pl-6">
                      {effort.asks.map((ask) => (
                        <li key={ask}>{ask}</li>
                      ))}
                    </ul>
                  </div>

                  {effort.status ? (
                    <p className="rounded-md bg-tahoe/10 px-4 py-3">
                      <strong>Where it stands:</strong> {effort.status}
                    </p>
                  ) : null}

                  <div>
                    <h4 className="text-base">Our letters</h4>
                    <ul className="mt-2 divide-y divide-asphalt/10">
                      {effort.letters.map((letter) => (
                        <li key={letter.driveId} className="py-3">
                          <p className="text-sm font-bold text-asphalt/70">
                            <time dateTime={letter.date}>{formatDay(letter.date)}</time>
                            {letter.position !== effort.position ? (
                              <span className={`badge ml-2 ${POSITION_CHIP[letter.position]}`}>
                                {letter.position}
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-1 font-semibold">
                            <SmartLink href={letter.url}>
                              {letter.subject}
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 16 16"
                                className="ml-1 inline-block h-3.5 w-3.5 align-baseline"
                              >
                                <path
                                  d="M9 3h4v4M13 3L7 9M11 9.5V13H3V5h3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </SmartLink>
                          </p>
                          <p className="text-sm text-asphalt/70">To {letter.to}</p>
                          <p className="mt-1">{letter.summary}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {effort.related.length > 0 ? (
                    <p className="text-sm">
                      <span className="font-bold">Related:</span>{" "}
                      {effort.related.map((slug, index) => (
                        <span key={slug}>
                          {index > 0 ? " · " : null}
                          <a href={`#${slug}`} onClick={(event) => onRelatedClick(event, slug)}>
                            {titles.get(slug) ?? slug}
                          </a>
                        </span>
                      ))}
                    </p>
                  ) : null}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
