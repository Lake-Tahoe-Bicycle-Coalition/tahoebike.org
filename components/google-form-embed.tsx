type Props = {
  /** The form's plain `viewform` URL (see `GOOGLE_FORM_URLS` in `lib/feature-flags.ts`). */
  url: string;
  /** Accessible name for the iframe, e.g. "Bike valet request form". */
  title: string;
  /**
   * Height in CSS pixels. A Google Form does not resize its frame, so this must fit
   * the whole form or visitors scroll inside the iframe; the old site used 3250.
   */
  height?: number;
};

/**
 * An embedded Google Form, full width, with a link to the form itself for anyone whose
 * browser blocks third-party frames (or who would rather not fill in a form inside a form).
 */
export function GoogleFormEmbed({ url, title, height = 3250 }: Props) {
  const embedUrl = new URL(url);
  embedUrl.searchParams.set("embedded", "true");

  return (
    <div>
      <p className="text-sm">
        This form is hosted on Google Forms. If it does not appear below,{" "}
        <a href={url} target="_blank" rel="noopener">
          open the form in a new tab
        </a>
        .
      </p>
      <iframe
        src={embedUrl.toString()}
        title={title}
        loading="lazy"
        style={{ height }}
        className="mt-4 w-full rounded border-0 bg-neutral-50"
      />
    </div>
  );
}
