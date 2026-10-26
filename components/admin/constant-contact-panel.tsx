import { ActionButton } from "@/components/admin/action-button";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { disconnectConstantContact, saveNewsletterList } from "@/lib/admin/constant-contact/actions";
import { formatAdminDateTime } from "@/lib/admin/datetime";
import {
  type ContactList,
  constantContactConfigured,
  fetchContactLists,
  getConnection,
} from "@/lib/constant-contact-api";

/** A plain <a>, not <Link>: the connect route redirects to Constant Contact. */
const CONNECT_HREF = "/api/constant-contact/connect";

/**
 * Status of the Constant Contact API connection behind the newsletter signup form, with
 * Connect / Reconnect, the newsletter list picker, and Disconnect.
 */
export async function ConstantContactPanel() {
  const configured = constantContactConfigured();
  const connection = configured ? await getConnection() : null;

  let lists: ContactList[] | null = null;
  if (connection) {
    try {
      lists = await fetchContactLists();
    } catch (error) {
      console.error("[admin] could not load Constant Contact lists", error);
    }
  }
  const currentList = lists?.find((list) => list.listId === connection?.listId);
  const live = Boolean(connection?.listId);

  return (
    <section aria-labelledby="constant-contact-heading" className="space-y-4 rounded border border-asphalt/15 p-5">
      <h2 id="constant-contact-heading" className="text-xl sm:text-xl">
        Newsletter signups (Constant Contact)
      </h2>
      <p>
        {live
          ? "The newsletter Subscribe boxes add people straight to the Constant Contact list below."
          : "The newsletter Subscribe boxes send people to Constant Contact’s signup page, where they type their address again. Connect Constant Contact to sign them up in one step."}
      </p>

      {!configured ? (
        <p className="text-asphalt/80">
          Not set up yet: the site needs the <code>CONSTANT_CONTACT_CLIENT_ID</code> and{" "}
          <code>CONSTANT_CONTACT_CLIENT_SECRET</code> environment variables from the Constant
          Contact developer app (see docs/TECHNICAL.md).
        </p>
      ) : !connection ? (
        <>
          <p className="text-asphalt/80">
            Sign in to Constant Contact with the LTBC account first, then connect and approve
            access.
          </p>
          <a href={CONNECT_HREF} className="btn btn-primary">
            Connect Constant Contact
          </a>
        </>
      ) : (
        <>
          <p>
            Connected by {connection.connectedBy} on {formatAdminDateTime(connection.connectedAt)}.
          </p>

          {lists === null ? (
            <p role="alert" className="font-semibold text-red-800">
              Could not load the lists from Constant Contact. If this keeps happening, reconnect.
            </p>
          ) : (
            <form action={saveNewsletterList} className="space-y-2">
              <label htmlFor="constant-contact-list" className="field-label">
                Newsletter list
              </label>
              {!currentList ? (
                <p className="text-sm font-semibold text-red-800">
                  {connection.listId
                    ? "The chosen list no longer exists in Constant Contact. Choose another."
                    : "No list chosen yet, so signups still go through Constant Contact’s signup page."}
                </p>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  id="constant-contact-list"
                  name="listId"
                  required
                  defaultValue={currentList?.listId ?? ""}
                  className="field-input"
                >
                  <option value="" disabled>
                    Choose a list
                  </option>
                  {lists.map((list) => (
                    <option key={list.listId} value={list.listId}>
                      {list.name}
                    </option>
                  ))}
                </select>
                <ActionButton className="btn btn-secondary shrink-0" pendingLabel="Saving…">
                  Save list
                </ActionButton>
              </div>
            </form>
          )}

          <div className="flex flex-wrap gap-3">
            <a href={CONNECT_HREF} className="btn btn-secondary">
              Reconnect
            </a>
            <ConfirmForm
              action={disconnectConstantContact}
              message="Disconnect Constant Contact? Newsletter signups will go through Constant Contact’s signup page until someone connects it again."
            >
              <ActionButton className="btn btn-secondary" pendingLabel="Disconnecting…">
                Disconnect
              </ActionButton>
            </ConfirmForm>
          </div>
        </>
      )}
    </section>
  );
}
