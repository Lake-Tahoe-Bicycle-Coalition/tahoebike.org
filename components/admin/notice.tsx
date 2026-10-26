import { readNotice } from "@/lib/admin/notice";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * One-line notice after a redirect, written by adminListUrl() / submissionsListUrl() in
 * lib/admin. Pages pass their whole search params; only notices signed by this server are
 * shown (see lib/admin/notice.ts), and errors are styled as errors. React escapes the text.
 * A signed `view` path adds a "View on site" link to the public page that changed.
 */
export function Notice({ params }: { params: SearchParams }) {
  const notice = readNotice(params);
  if (!notice) return null;
  if (notice.tone === "error") {
    return (
      <p role="alert" className="rounded border border-red-700 bg-red-50 px-4 py-3 font-semibold text-red-800">
        {notice.text}
      </p>
    );
  }
  return (
    <p role="status" className="rounded border border-tahoe bg-tahoe/10 px-4 py-3 font-semibold">
      {notice.text}
      {notice.view ? (
        <>
          {" "}
          <a href={notice.view} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap">
            View on site<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </>
      ) : null}
    </p>
  );
}
