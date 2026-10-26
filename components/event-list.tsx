import type { ReactNode } from "react";
import { JsonLd } from "@/components/json-ld";
import { SmartLink } from "@/components/smart-link";
import { formatEventDate, formatEventTimeRange, googleCalendarUrl, type Event } from "@/lib/events";
import { Markdown } from "@/lib/markdown";

function registrationHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

/**
 * Upcoming events as cards. Pages fetch with getUpcomingEvents() (lib/content.ts) and pass the rows in.
 * `emptyState` replaces the default message shown when there are no events.
 */
export function EventList({ events, emptyState }: { events: Event[]; emptyState?: ReactNode }) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-asphalt/20 p-6">
        {emptyState ?? (
          <p>
            No upcoming events are scheduled. Check back soon or{" "}
            <SmartLink href="/newsletter">subscribe to our newsletter</SmartLink> for announcements.
          </p>
        )}
      </div>
    );
  }

  // SEO-1: Event structured data, one entry per upcoming event.
  const eventData = {
    "@context": "https://schema.org",
    "@graph": events.map((event) => ({
      "@type": "Event",
      name: event.title,
      startDate: event.startsAt.toISOString(),
      endDate: event.endsAt.toISOString(),
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      ...(event.locationName || event.address
        ? {
            location: {
              "@type": "Place",
              ...(event.locationName ? { name: event.locationName } : {}),
              ...(event.address ? { address: event.address } : {}),
            },
          }
        : {}),
      ...(event.description.trim() ? { description: event.description } : {}),
      ...(event.registrationUrl ? { url: event.registrationUrl } : {}),
      organizer: { "@type": "Organization", name: "Lake Tahoe Bicycle Coalition", url: "https://tahoebike.org" },
    })),
  };

  return (
    <>
    <JsonLd data={eventData} />
    <ul className="grid gap-6 sm:grid-cols-2">
      {events.map((event) => (
        <li key={event.id} className="flex flex-col gap-3 rounded-lg border border-asphalt/15 p-5">
          <h3>{event.title}</h3>
          <p>
            <time dateTime={event.startsAt.toISOString()}>
              {formatEventDate(event.startsAt)}
              <br />
              {formatEventTimeRange(event.startsAt, event.endsAt)} PT
            </time>
          </p>
          {event.locationName || event.address ? (
            <p>
              {event.locationName ? <span className="font-semibold">{event.locationName}</span> : null}
              {event.locationName && event.address ? <br /> : null}
              {event.address ? (
                <SmartLink
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`}
                >
                  {event.address}
                </SmartLink>
              ) : null}
            </p>
          ) : null}
          {event.description.trim() ? (
            <div className="space-y-2">
              <Markdown source={event.description} />
            </div>
          ) : null}
          <p className="text-sm">
            <SmartLink href={googleCalendarUrl(event)}>
              Add to Google Calendar
              <span className="sr-only">: {event.title}</span>
            </SmartLink>
          </p>
          {event.registrationUrl ? (
            <p className="mt-auto pt-2">
              <SmartLink href={event.registrationUrl} className="btn btn-primary">
                {registrationHost(event.registrationUrl).includes("pointapp.org") ? "Sign up on POINT" : "Sign up"}
                <span className="sr-only"> for {event.title}</span>
              </SmartLink>
            </p>
          ) : null}
        </li>
      ))}
    </ul>
    </>
  );
}
