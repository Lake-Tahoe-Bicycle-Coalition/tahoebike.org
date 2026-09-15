import Link from "next/link";
import { SmartLink } from "@/components/smart-link";
import { formatEventDate, formatEventTimeRange, type Event } from "@/lib/events";
import { Markdown } from "@/lib/markdown";

/** Upcoming events as cards. Pages fetch with getUpcomingEvents() and pass the rows in. */
export function EventList({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <p>
        No upcoming events are scheduled. Check back soon or{" "}
        <Link href="/join">subscribe to our newsletter</Link> for announcements.
      </p>
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2">
      {events.map((event) => (
        <li key={event.id} className="flex flex-col gap-3 rounded-lg border border-asphalt/15 p-5">
          <h3>{event.title}</h3>
          <p>
            <time dateTime={event.startsAt.toISOString()}>
              {formatEventDate(event.startsAt)}
              <br />
              {formatEventTimeRange(event.startsAt, event.endsAt)}
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
          {event.registrationUrl ? (
            <p className="mt-auto pt-2">
              <SmartLink href={event.registrationUrl} className="btn btn-primary">
                Sign up
              </SmartLink>
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
