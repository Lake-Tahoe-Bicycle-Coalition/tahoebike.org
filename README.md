# tahoebike.org

This is the website of the Lake Tahoe Bicycle Coalition (LTBC). It tells visitors about the
coalition's programs: the Bike Kitchen, Bike Valet, the bike rack program, bike safety,
advocacy, and the Lake Tahoe bike map. It also lets people get in touch, volunteer, join, and
sign up for the newsletter.

The site was rebuilt in 2026 to replace the old WordPress site. Until the switch-over is
finished, tahoebike.org still shows the old site, and the new one is at
[tahoebikeorg.vercel.app](https://tahoebikeorg.vercel.app). The links below use the final
tahoebike.org address.

This page is for board members and volunteers who want to know how the site works and how to
keep it up to date. You don't need to be technical to read it. Developers should start with
the [technical documentation](docs/TECHNICAL.md).

## What you can update yourself

Content that changes often is edited in the **admin area** at
[tahoebike.org/admin](https://tahoebike.org/admin). Sign in with your Google account. If it
says you don't have access, ask an existing admin to add your email address.

| In the admin area | What it changes |
|---|---|
| **Events** | Bike Kitchen fix-up sessions, Bike Valet appearances, and other dated events. Each shows on its own page (other events show on the homepage). Past events disappear on their own. |
| **Board** | The board members and advisors shown on the About page: names, roles, bios, photos, and order. |
| **Homepage cards** | The large featured cards at the top of the homepage. |
| **Announcements** | A banner shown across the top of every page between a start and end time you choose. Useful for closures, sign-up deadlines, or big news. |
| **Settings** | Prices, contact email addresses, outside links, and whether the bike rack program is taking applications. |
| **Submissions** | Messages sent through the site's contact and request forms. Each one is also emailed when it arrives. |
| **Admins** | Who is allowed to sign in to the admin area. |

Changes show up on the site within a few seconds of saving. Times are entered in Pacific time.
Longer text fields such as bios accept simple formatting (bold, italics, links, lists), and
there's a preview button to check how it will look.

## What needs a developer

Everything else on the site, such as the wording of the program pages, the menu, and the
page layout, is part of the site's code. To change it, send the new wording to whoever looks
after the website, or open an issue on the
[GitHub repository](https://github.com/Lake-Tahoe-Bicycle-Coalition/tahoebike.org/issues).
Before any change goes live, a private preview copy of the site is built so it can be checked
first.

Some things to know when asking for changes:

- **Photos** stay at their existing file names forever, because other parts of the site point
  to them. To replace a photo, add a new one rather than overwriting the old.
- **Every photo needs a short description** for visitors using screen readers. The full list
  of photos and their descriptions is in [docs/IMAGE_INDEX.md](docs/IMAGE_INDEX.md), which is
  a good place to spot one that's missing or wrong.
- **The Bike Valet request and bike rack application** currently use Google Forms, so their
  responses are collected in Google, not in the admin area.
- **Newsletter and volunteer sign-ups** go to Constant Contact.

## Where the site lives

- The site is hosted on [Vercel](https://vercel.com), and its code is on
  [GitHub](https://github.com/Lake-Tahoe-Bicycle-Coalition/tahoebike.org).
- Old addresses from the previous WordPress site redirect to their new pages, so existing
  links and bookmarks keep working.
- The bike map at map.tahoebike.org is a separate project and isn't affected by changes here.

## Further reading

- [Technical documentation](docs/TECHNICAL.md): setup, deployment, and how the code fits
  together
- [Migration plan](docs/MIGRATION_PLAN.md): why the site was rebuilt and how the move from
  WordPress works
- [Open questions](docs/OPEN_QUESTIONS.md): decisions made and still to be made

## License

The code is public so anyone can read it and suggest improvements, but it is not open
source: see [LICENSE](LICENSE). LTBC's name, logos, and photos may not be reused.
