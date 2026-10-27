import { ActionButton } from "@/components/admin/action-button";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { disconnectConstantContact } from "@/lib/admin/constant-contact/actions";
import { formatAdminDateTime } from "@/lib/admin/datetime";
import {
  type ContactList,
  constantContactConfigured,
  fetchContactLists,
  getConnection,
} from "@/lib/constant-contact-api";
import { SIGNUP_LISTS, signupListKeys } from "@/lib/constant-contact-lists";

/** A plain <a>, not <Link>: the connect route redirects to Constant Contact. */
const CONNECT_HREF = "/api/constant-contact/connect";

/**
 * Status of the Constant Contact API connection behind the newsletter signup form, with
 * Connect / Reconnect and Disconnect, plus a read-only check that each list in
 * lib/constant-contact-lists.ts exists in the connected account (the lists are fixed in
 * code; there is nothing to choose here).
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
  const accountLists = new Map(lists?.map((list) => [list.listId, list.name]));

  return (
    <section aria-labelledby="constant-contact-heading" className="space-y-4 rounded border border-asphalt/15 p-5">
      <h2 id="constant-contact-heading" className="text-xl sm:text-xl">
        Newsletter signups (Constant Contact)
      </h2>
      <p>
        {connection
          ? "The newsletter signup forms add people straight to the Constant Contact lists below, the ones each visitor chose."
          : "The newsletter signup forms send people to Constant Contact’s signup page, where they type their address again (and can only join the newsletter). Connect Constant Contact to sign them up in one step, to the lists they choose."}
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
            <div className="space-y-2">
              <h3 className="text-lg sm:text-lg">Email lists</h3>
              <p className="text-sm text-asphalt/80">
                Set in lib/constant-contact-lists.ts. A list marked “not found” must be restored
                in Constant Contact (or its id updated in the code); until then, signups that include it
                fail and fall back to Constant Contact’s signup page.
              </p>
              <ul className="space-y-2">
                {signupListKeys.map((key) => {
                  const list = SIGNUP_LISTS[key];
                  const accountName = accountLists.get(list.listId);
                  return (
                    <li key={key} className="rounded border border-asphalt/10 px-3 py-2">
                      <span className="font-semibold">{list.label}</span>
                      <span className="text-asphalt/80"> (Constant Contact list “{list.name}”)</span>
                      <br />
                      {accountName === undefined ? (
                        <span className="text-sm font-semibold text-red-800">
                          Not found in Constant Contact
                        </span>
                      ) : (
                        <span className="text-sm">
                          Found
                          {accountName !== list.name ? `, now named “${accountName}”` : null}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
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
