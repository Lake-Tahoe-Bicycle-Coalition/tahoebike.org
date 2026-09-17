import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";

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

export default async function AdminHome() {
  await requireAdmin();

  let tiles: Tile[];
  try {
    tiles = await loadTiles();
  } catch (error) {
    console.error("Could not load admin dashboard counts.", error);
    tiles = [];
  }

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
