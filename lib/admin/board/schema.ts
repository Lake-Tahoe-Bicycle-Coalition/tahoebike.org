import { z } from "zod";
import { checkbox, emptyToNull, optionalLink, optionalText, requiredLine } from "@/lib/forms/validators";
import type { BoardMember } from "@/lib/generated/prisma/client";
import type { BoardMemberFormValues } from "./fields";

/** Validates the board member form and produces the columns to write. Server-only. */
export const boardMemberSchema = z
  .object({
    name: requiredLine("Name", 100),
    role: requiredLine("Role", 100),
    bio: optionalText("Bio", 5000),
    photoUrl: optionalLink("Photo"),
    isAdvisor: checkbox,
    isActive: checkbox,
  })
  .transform((data) => ({ ...data, photoUrl: emptyToNull(data.photoUrl) }));

export type BoardMemberData = z.output<typeof boardMemberSchema>;

/** A stored board member as form values (for the edit page). */
export function boardMemberToFormValues(member: BoardMember): BoardMemberFormValues {
  return {
    name: member.name,
    role: member.role,
    bio: member.bio,
    photoUrl: member.photoUrl ?? "",
    isAdvisor: member.isAdvisor ? "on" : "",
    isActive: member.isActive ? "on" : "",
  };
}
