import { z } from "zod";
import { fromZonedParts, toZonedParts } from "@/lib/admin/datetime";
import { emptyToNull, optionalLine, optionalLink, optionalText, requiredLine } from "@/lib/forms/validators";
import type { Event } from "@/lib/generated/prisma/client";
import { type EventFormValues, programValues } from "./fields";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIME = /^\d{2}:\d{2}$/;

/** Both halves present and well-formed (each half reports its own error otherwise). */
function isCompleteInstant(date: string, time: string): boolean {
  return ISO_DATE.test(date) && ISO_TIME.test(time);
}

/**
 * Validates the event form and produces the columns to write. Server-only.
 * The cross-field rule is a refine (zod runs those alongside field errors) rather than
 * part of the transform (which runs only once every field is valid), so a form with
 * several problems reports them all at once.
 */
export const eventSchema = z
  .object({
    title: requiredLine("Title", 200),
    program: z.enum(programValues, "Choose a program."),
    startDate: z.iso.date("Enter the start date."),
    startTime: z.iso.time({ precision: -1, error: "Enter the start time." }),
    endDate: z.iso.date("Enter the end date."),
    endTime: z.iso.time({ precision: -1, error: "Enter the end time." }),
    locationName: optionalLine("Location name", 200),
    address: optionalLine("Address", 300),
    description: optionalText("Description", 5000),
    registrationUrl: optionalLink("Sign-up link"),
  })
  .refine(
    (data) =>
      !isCompleteInstant(data.startDate, data.startTime) ||
      !isCompleteInstant(data.endDate, data.endTime) ||
      fromZonedParts(data.endDate, data.endTime) > fromZonedParts(data.startDate, data.startTime),
    { error: "The end must be after the start.", path: ["endTime"] },
  )
  .transform((data) => {
    return {
      title: data.title,
      program: data.program,
      startsAt: fromZonedParts(data.startDate, data.startTime),
      endsAt: fromZonedParts(data.endDate, data.endTime),
      locationName: emptyToNull(data.locationName),
      address: emptyToNull(data.address),
      description: data.description,
      registrationUrl: emptyToNull(data.registrationUrl),
    };
  });

export type EventData = z.output<typeof eventSchema>;

/** A stored event as form values (for the edit page and "duplicate"). */
export function eventToFormValues(event: Event): EventFormValues {
  const start = toZonedParts(event.startsAt);
  const end = toZonedParts(event.endsAt);
  return {
    title: event.title,
    program: event.program,
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    locationName: event.locationName ?? "",
    address: event.address ?? "",
    description: event.description,
    registrationUrl: event.registrationUrl ?? "",
  };
}
