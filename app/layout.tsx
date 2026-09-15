import type { Metadata } from "next";
import { Libre_Franklin } from "next/font/google";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSettings } from "@/lib/settings";
import { SITE_NAME, openGraphDefaults } from "@/lib/site-metadata";
import "./globals.css";

const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-libre-franklin",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tahoebike.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: "Helping Tahoe to become more bicycle friendly.",
  openGraph: openGraphDefaults,
  twitter: { card: "summary_large_image" },
};

/** Re-render at most every 5 minutes so admin edits show up without a deploy. */
export const revalidate = 300;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();

  return (
    <html lang="en" className={`${libreFranklin.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <AnnouncementBanner />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter settings={settings} />
      </body>
    </html>
  );
}
