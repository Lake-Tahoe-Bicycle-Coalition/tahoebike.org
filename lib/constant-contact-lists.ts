/**
 * The Constant Contact email lists a visitor can join from the signup form
 * (components/forms/newsletter-form.tsx). Zod-free and secret-free, so client
 * components import it too.
 *
 * `listId` is the list's V3 UUID, from https://app.constantcontact.com/contacts/lists
 * (open a list; the id is in the address bar). List ids are not secrets: they only work
 * together with the API tokens stored in `ApiConnection`. `name` is the list's name in
 * the Constant Contact account, which /admin/settings checks against the account's
 * lists; `label` is what visitors see on the form (the "Newsletter Topics" group, in this
 * order) and in its success message.
 *
 * Renaming a list in Constant Contact keeps its id, so nothing here needs to change
 * (the admin panel just shows the new name). Deleting one breaks signups to it: the
 * admin panel then shows "not found in Constant Contact" and the API call fails, which
 * sends the visitor to the hosted opt-in page.
 */
export const SIGNUP_LISTS = {
  general: {
    listId: "33badb06-c694-11ec-bed1-fa163eeaf818",
    name: "General Newsletter",
    label: "General Info",
  },
  advocacy_south: {
    listId: "7298e34a-d198-11f1-897d-02420a320002",
    name: "Advocacy Interest - South Lake",
    label: "Projects in South Lake Tahoe",
  },
  advocacy_north: {
    listId: "814bee46-d198-11f1-867d-02420a320002",
    name: "Advocacy Interest - North Lake",
    label: "Projects in North Lake Tahoe",
  },
  advocacy_truckee: {
    listId: "8b05aec2-d198-11f1-a9d1-02420a320002",
    name: "Advocacy Interest - Truckee",
    label: "Projects in Truckee",
  },
  volunteers: {
    listId: "eb146776-d252-11ec-96e2-fa163e37a129",
    name: "Volunteers",
    label: "Volunteer opportunities",
  },
} as const;

export type SignupListKey = keyof typeof SIGNUP_LISTS;

export const signupListKeys = Object.keys(SIGNUP_LISTS) as SignupListKey[];
