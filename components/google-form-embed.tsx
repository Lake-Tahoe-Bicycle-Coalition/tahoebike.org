type Props = {
  /** The form's plain `viewform` URL (see `GOOGLE_FORM_URLS` in `lib/feature-flags.ts`). */
  url: string;
  /** Accessible name for the iframe, e.g. "Bike valet request form". */
  title: string;
  /**
   * Fixed height in CSS pixels, overriding the responsive default. A Google Form does not
   * resize its frame, so this must fit the whole form or visitors scroll inside the iframe.
   */
  height?: number;
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * An embedded Google Form, full width. The link to the form itself comes first, for anyone
 * whose browser blocks third-party frames (or who would rather not fill in a form inside a
 * form), and a skip link after the frame lets keyboard users jump past it.
 */
export function GoogleFormEmbed({ url, title, height }: Props) {
  const embedUrl = new URL(url);
  embedUrl.searchParams.set("embedded", "true");
  const afterId = `after-${slugify(title)}`;

  return (
    <div>
      <p className="text-sm">This form is hosted on Google Forms.</p>
      <p className="mt-3">
        <a href={url} target="_blank" rel="noopener" className="btn btn-secondary">
          Open the form in a new tab
        </a>{" "}
        <a href={`#${afterId}`} className="ml-2 text-sm">
          Skip the form
        </a>
      </p>
      <iframe
        src={embedUrl.toString()}
        title={title}
        loading="lazy"
        style={height ? { height } : undefined}
        className={`mt-4 w-full rounded border-0 bg-neutral-50 ${height ? "" : "h-[2600px] sm:h-[2200px] lg:h-[2000px]"}`}
      />
      <p id={afterId} className="mt-2 text-sm">
        End of the embedded form.
      </p>
    </div>
  );
}
