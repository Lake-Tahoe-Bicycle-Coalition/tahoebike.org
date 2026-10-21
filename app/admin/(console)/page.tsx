import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { isProductionDeployment } from "@/lib/deployment";
import { enabledNativeForms } from "@/lib/feature-flags";

type Tile = { href: string; label: string; count: number | null; detail: string };

async function loadTiles(): Promise<Tile[]> {
  const now = new Date();
  const [events, board, cards, announcements, submissions, admins] = await Promise.all([
    prisma.event.count({ where: { endsAt: { gte: now } } }),
    prisma.boardMember.count({ where: { isActive: true } }),
    prisma.homepageCard.count({ where: { isActive: true } }),
    prisma.announcement.count({ where: { endsAt: { gte: now } } }),
    prisma.formSubmission.count({ where: { status: "NEW" } }),
    prisma.adminUser.count(),
  ]);
  return [
    { href: "/admin/events", label: "Events", count: events, detail: "upcoming" },
    { href: "/admin/board", label: "Board", count: board, detail: "active members and advisors" },
    { href: "/admin/cards", label: "Homepage cards", count: cards, detail: "active" },
    { href: "/admin/announcements", label: "Announcements", count: announcements, detail: "current or scheduled" },
    { href: "/admin/submissions", label: "Submissions", count: submissions, detail: "new" },
    { href: "/admin/users", label: "Admins", count: admins, detail: "allowlisted accounts" },
  ];
}

type ConfigRow = { label: string; configured: boolean; detail: string; hint: string };

const isSet = (name: string) => (process.env[name] ?? "").trim() !== "";

/** Whether each integration has its environment variables. Reports presence only, never values. */
function configurationRows(): ConfigRow[] {
  const email = isSet("RESEND_API_KEY");
  const turnstileSite = isSet("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
  const turnstileSecret = isSet("TURNSTILE_SECRET_KEY");
  const turnstileMismatch = turnstileSite !== turnstileSecret;
  const nativeForms = [...enabledNativeForms()];
  // The production deployment fails closed without these keys (lib/turnstile.ts, lib/email/index.ts).
  const production = isProductionDeployment();
  return [
    {
      label: "Email delivery",
      configured: email,
      detail: email
        ? isSet("EMAIL_FROM")
          ? "Resend key and sender address set."
          : "Resend key set; sending from the default no-reply@tahoebike.org address."
        : "Needs RESEND_API_KEY (and EMAIL_FROM for the sender address).",
      hint: production
        ? "Form submissions are stored in the inbox, but every notification email fails."
        : "Form submissions are stored in the inbox; notification emails are only logged.",
    },
    {
      label: "Spam protection",
      configured: turnstileSite && turnstileSecret,
      detail: turnstileMismatch
        ? `Mismatch: only the ${turnstileSite ? "site key" : "secret key"} is set. Set both or neither.`
        : turnstileSite
          ? "Turnstile site key and secret key set."
          : "Needs NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY.",
      hint: turnstileSecret
        ? "Every form submission is refused: without the site key the check never renders."
        : production
          ? "Every contact, valet and rack form submission is refused until both keys are set."
          : "Forms are not protected by Turnstile, so bots can submit them.",
    },
    {
      label: "Image uploads",
      configured: isSet("BLOB_READ_WRITE_TOKEN"),
      detail: isSet("BLOB_READ_WRITE_TOKEN") ? "Blob token set." : "Needs BLOB_READ_WRITE_TOKEN.",
      hint: "Admin forms cannot upload images; only images already on the site (/images/…) can be used.",
    },
    {
      label: "Google sign-in",
      configured: isSet("AUTH_GOOGLE_ID") && isSet("AUTH_GOOGLE_SECRET"),
      detail:
        isSet("AUTH_GOOGLE_ID") && isSet("AUTH_GOOGLE_SECRET")
          ? "Google client ID and secret set."
          : "Needs AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.",
      hint: "Admins cannot sign in to this console.",
    },
    {
      label: "Native forms",
      configured: nativeForms.length > 0,
      detail: nativeForms.length > 0 ? `Enabled: ${nativeForms.join(", ")}.` : "NATIVE_FORMS is unset or none.",
      hint: "Bike Valet and Bike Racks show the Google Forms instead of the site's own forms.",
    },
  ];
}

async function recentSubmissionCount(): Promise<number | null> {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return await prisma.formSubmission.count({ where: { submittedAt: { gte: since } } });
  } catch (error) {
    console.error("Could not count recent form submissions.", error);
    return null;
  }
}

export default async function AdminHome() {
  await requireAdmin();

  let tiles: Tile[];
  try {
    tiles = await loadTiles();
  } catch (error) {
    console.error("Could not load admin dashboard counts.", error);
    tiles = [];
  }

  const configuration = configurationRows();
  const recentSubmissions = await recentSubmissionCount();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin"
        description="Edit the content that changes often: events, the board roster, homepage cards, announcements, and site settings. Everything else on the site is code; ask for a change and it arrives as a pull request."
      />

      {tiles.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <li key={tile.href}>
              <Link
                href={tile.href}
                className="block rounded-lg border border-asphalt/15 p-5 no-underline hover:border-tahoe"
              >
                <span className="block text-3xl font-extrabold text-asphalt">{tile.count}</span>
                <span className="block font-heading font-extrabold uppercase tracking-widest text-asphalt">
                  {tile.label}
                </span>
                <span className="block text-sm text-asphalt/70">{tile.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p role="alert" className="rounded border border-red-700 bg-red-50 px-4 py-3 text-red-900">
          The database could not be reached. Try again in a moment.
        </p>
      )}

      <section className="space-y-3" aria-labelledby="configuration-heading">
        <h2 id="configuration-heading" className="text-xl sm:text-xl">
          Configuration
        </h2>
        <ul className="divide-y divide-asphalt/10 rounded-lg border border-asphalt/15">
          {configuration.map((row) => (
            <li key={row.label} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
              <span className="w-40 font-semibold">{row.label}</span>
              <span className={row.configured ? "badge badge-active" : "badge badge-warn"}>
                {row.configured ? "Configured" : "Not configured"}
              </span>
              <span className="text-sm text-asphalt/80">
                {row.configured ? row.detail : `${row.hint} ${row.detail}`}
              </span>
            </li>
          ))}
        </ul>
        {recentSubmissions !== null ? (
          <p className="text-sm text-asphalt/80">
            <Link href="/admin/submissions">{recentSubmissions} form submissions</Link> received in the last 30
            days.
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-xl">Good to know</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Events disappear from the site on their own once they end; announcements once they expire.</li>
          <li>
            Public pages refresh within a few seconds of a save. If a change does not show, reload the page
            without cache (Shift+Reload).
          </li>
          <li>
            Bios and event descriptions accept simple formatting: blank line between paragraphs, **bold**,
            *italic*, [links](https://…), and “- ” bullets.
          </li>
        </ul>
      </section>
    </div>
  );
}
