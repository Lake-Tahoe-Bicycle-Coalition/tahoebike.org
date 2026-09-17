/**
 * Field list for the board member form, shared by the client component
 * (components/admin/board-member-form.tsx) and the server schema (./schema.ts). Zod-free.
 */

export const boardMemberFieldNames = ["name", "role", "bio", "photoUrl", "isAdvisor", "isActive"] as const;

export type BoardMemberFieldName = (typeof boardMemberFieldNames)[number];

/** The form's string values (what the inputs hold); checkboxes are "on" or "". */
export type BoardMemberFormValues = Record<BoardMemberFieldName, string>;

export const emptyBoardMemberFormValues: BoardMemberFormValues = {
  name: "",
  role: "",
  bio: "",
  photoUrl: "",
  isAdvisor: "",
  isActive: "on",
};
