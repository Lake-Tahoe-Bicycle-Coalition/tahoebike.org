import type { Program } from "@/lib/generated/prisma/enums";

/**
 * Labels and option lists for the event form, shared by the client component
 * (components/admin/event-form.tsx) and the server schema (./schema.ts). Zod-free.
 */

export const programValues = ["BIKE_KITCHEN", "BIKE_VALET", "OTHER"] as const satisfies readonly Program[];

export const programLabels: Record<Program, string> = {
  BIKE_KITCHEN: "Bike Kitchen",
  BIKE_VALET: "Bike Valet",
  OTHER: "Other",
};

export const programOptions = programValues.map((value) => ({ value, label: programLabels[value] }));

export const eventFieldNames = [
  "title",
  "program",
  "startDate",
  "startTime",
  "endDate",
  "endTime",
  "locationName",
  "address",
  "description",
  "registrationUrl",
] as const;

export type EventFieldName = (typeof eventFieldNames)[number];

/** The form's string values (what the inputs hold), as opposed to the database row. */
export type EventFormValues = Record<EventFieldName, string>;

export const emptyEventFormValues: EventFormValues = {
  title: "",
  program: "BIKE_KITCHEN",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  locationName: "",
  address: "",
  description: "",
  registrationUrl: "",
};
