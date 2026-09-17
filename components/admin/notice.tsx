/**
 * One-line confirmation after a redirect (`?notice=Saved…`), see adminListUrl() in
 * lib/admin/form.ts. Pages pass the raw search param; React escapes it.
 */
export function Notice({ notice }: { notice: string | string[] | undefined }) {
  if (typeof notice !== "string" || notice === "") return null;
  return (
    <p role="status" className="rounded border border-tahoe bg-tahoe/10 px-4 py-3 font-semibold">
      {notice}
    </p>
  );
}
