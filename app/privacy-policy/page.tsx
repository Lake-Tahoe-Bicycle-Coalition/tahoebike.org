import Link from "next/link";
import { SmartLink } from "@/components/smart-link";
import { nativeFormEnabled } from "@/lib/feature-flags";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "What information the Lake Tahoe Bicycle Coalition website collects, which other services are involved, and how to ask us to correct or delete what you have sent us.",
  path: "/privacy-policy",
});

/**
 * The policy lives in code and changes with a code change (docs/OPEN_QUESTIONS.md Q15).
 * Every claim below was checked against the code it describes; when the site starts or
 * stops doing something (a new form, an analytics script, a new embed), update the text
 * and this date together.
 */
const LAST_UPDATED = { iso: "2026-09-17", label: "September 17, 2026" };

/** Privacy policies of the services this site loads in the browser or hands visitors to. */
const POLICY_URLS = {
  cloudflare: "https://www.cloudflare.com/privacypolicy/",
  constantContact: "https://www.constantcontact.com/legal/privacy-notice",
  google: "https://policies.google.com/privacy",
  memberful: "https://memberful.com/privacy-policy",
  point: "https://www.pointapp.org/privacy-policy",
  resend: "https://resend.com/legal/privacy-policy",
  vercel: "https://vercel.com/legal/privacy-policy",
} as const;

export default async function PrivacyPolicyPage() {
  const settings = await getSettings();
  const contactEmail = settings.contact_email;
  const contactLink = <a href={`mailto:${contactEmail}`}>{contactEmail}</a>;
  // Q16/Q17: each of these is either the site's own form or an embedded Google Form,
  // chosen by NATIVE_FORMS. Describe whichever is live so the policy stays accurate.
  const nativeValet = nativeFormEnabled("valet");
  const nativeRacks = nativeFormEnabled("racks");
  const googleForms = [
    ...(nativeValet
      ? []
      : [{ label: "Bike Valet request form", href: "/programs/bike-valet", page: "Bike Valet" }]),
    ...(nativeRacks ? [] : [{ label: "bike rack application", href: "/bike-racks", page: "Bike Racks" }]),
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1>Privacy Policy</h1>
      <p className="mt-4">
        Last updated <time dateTime={LAST_UPDATED.iso}>{LAST_UPDATED.label}</time>
      </p>

      <div className="prose-ltbc mt-6 max-w-3xl">
        <p>
          The Lake Tahoe Bicycle Coalition is an all-volunteer nonprofit, and this is a simple
          website. Most of it can be read without telling us anything about yourself. This page
          explains what information the site does collect, what we do with it, and which other
          services are involved. It covers the pages served at tahoebike.org.
        </p>

        <h2>Information you send us</h2>
        <p>
          The only personal information this site collects is what you type into one of its own
          forms:
        </p>
        <ul>
          <li>
            The <Link href="/contact">contact form</Link>: your first and last name, email
            address, phone number (optional), and message.
          </li>
          {nativeValet ? (
            <li>
              The <Link href="/programs/bike-valet">Bike Valet request form</Link>: your name,
              organization, email address, and phone number; the event name, date, times,
              location, expected attendance, and expected number of bikes; whether you are a
              nonprofit or a Business Member; and any notes.
            </li>
          ) : null}
          {nativeRacks ? (
            <li>
              The <Link href="/bike-racks">bike rack application</Link>: the business name and
              address, your name, email address, and phone number; the number and style of racks
              requested; whether you can provide matching funds; the expected use and community
              benefit; and any notes.
            </li>
          ) : null}
        </ul>
        <p>
          When you submit one of these forms, the site saves your answers in its database and
          emails them to the Coalition at {contactLink}
          {nativeValet ? (
            <>
              {" "}
              (Bike Valet requests go to{" "}
              <a href={`mailto:${settings.bike_valet_email}`}>{settings.bike_valet_email}</a>)
            </>
          ) : null}
          . The database copy means your message is not lost if an email goes astray. We use
          what you send us to reply to you and to run the program you asked about, and for
          nothing else. Submitting a form does not sign you up for our newsletter.
        </p>
        {googleForms.length > 0 ? (
          <p>
            The{" "}
            {googleForms.map((form, index) => (
              <span key={form.href}>
                {index > 0 ? " and the " : ""}
                <Link href={form.href}>{form.label}</Link>
              </span>
            ))}{" "}
            {googleForms.length > 1 ? "are Google Forms" : "is a Google Form"} embedded on{" "}
            {googleForms.length > 1 ? "those pages" : "that page"}. What you enter there goes to
            Google and is kept in the Coalition&apos;s Google account, not in this site&apos;s
            database; <SmartLink href={POLICY_URLS.google}>Google&apos;s privacy policy</SmartLink>{" "}
            covers the form itself, and the Coalition uses your answers only to run that program.
          </p>
        ) : null}
        <p>
          Those notification emails are delivered by{" "}
          <SmartLink href={POLICY_URLS.resend}>Resend</SmartLink>, an email service, so the
          contents of your submission pass through Resend on the way to our inbox.
        </p>

        <h2>Spam protection</h2>
        <p>
          Each form includes a Cloudflare Turnstile check, which tells people apart from
          automated spam. Turnstile loads a small script from Cloudflare in your browser, and
          when you submit a form the site sends the result of that check, together with your IP
          address, to Cloudflare to confirm it. The site does not keep your IP address with your
          submission.{" "}
          <SmartLink href={POLICY_URLS.cloudflare}>Cloudflare&apos;s privacy policy</SmartLink>{" "}
          describes what Cloudflare does with that information.
        </p>

        <h2>Newsletter and email lists</h2>
        <p>
          Our newsletter and volunteer email list are run through Constant Contact. The
          Subscribe box on the <Link href="/join#newsletter">Join</Link> and{" "}
          <Link href="/newsletter">Newsletter</Link> pages sends you to Constant Contact&apos;s
          signup page, where you finish signing up. The email address you type into the box is
          passed along to that page; this website does not receive or keep it. The volunteer
          email list link works the same way. Constant Contact holds the lists, and you can
          leave at any time with the unsubscribe link at the bottom of any email we send. The
          past issues on the Newsletter page are hosted by Constant Contact too.{" "}
          <SmartLink href={POLICY_URLS.constantContact}>
            Constant Contact&apos;s privacy notice
          </SmartLink>{" "}
          applies to the information you give it.
        </p>

        <h2>Membership and donations</h2>
        <p>
          Memberships and donations are handled by Memberful, a separate service. The Join and
          Donate buttons on the <Link href="/join">Join page</Link> take you to
          tahoebike.memberful.com, and the &ldquo;choose what you pay&rdquo; donation boxes send
          the amount you enter to Memberful&apos;s checkout page. Your name, email address, and
          payment details are entered on Memberful&apos;s pages and processed there; this website
          never sees your card number.{" "}
          <SmartLink href={POLICY_URLS.memberful}>Memberful&apos;s privacy policy</SmartLink>{" "}
          covers what you enter there.
        </p>

        <h2>Volunteer shifts</h2>
        <p>
          Volunteer shifts are scheduled through POINT. The{" "}
          <Link href="/volunteer">Volunteer page</Link> embeds POINT&apos;s calendar of upcoming
          shifts (a frame and a small script loaded from pointapp.org). To sign up for a shift
          you create a POINT account; the information you give POINT is collected by POINT
          under <SmartLink href={POLICY_URLS.point}>its privacy policy</SmartLink>, and POINT
          shows the Coalition who has signed up so that we can plan each shift.
        </p>

        <h2>Videos and other embedded content</h2>
        <p>
          A few pages include content served by other companies. Loading it works much like
          visiting their websites: they may set their own cookies and collect information about
          your visit, whether or not you have an account with them.
        </p>
        <ul>
          <li>
            The <Link href="/bike-safety">Bike Safety page</Link> plays YouTube videos through
            YouTube&apos;s privacy-enhanced player (youtube-nocookie.com), which YouTube says
            does not store information about you unless you play a video.
          </li>
          <li>
            The <Link href="/advocacy">Advocacy page</Link> embeds a Google Drive folder of our
            comment letters.
          </li>
          {googleForms.length > 0 ? (
            <li>
              The {googleForms.map((form) => form.page).join(" and ")}{" "}
              {googleForms.length > 1 ? "pages embed Google Forms" : "page embeds a Google Form"},
              described above.
            </li>
          ) : null}
          <li>The Volunteer page embeds POINT&apos;s calendar, described above.</li>
          <li>The forms load the Cloudflare Turnstile check, described above.</li>
        </ul>
        <p>
          YouTube, Google Drive, and Google Forms are covered by{" "}
          <SmartLink href={POLICY_URLS.google}>Google&apos;s privacy policy</SmartLink>. Links
          to other websites, such as Tahoe Bike Month, our interactive bike map at
          map.tahoebike.org, the print map PDFs on Google Drive, and Google Maps directions for
          event locations, take you to sites with their own privacy policies.
        </p>

        <h2>Cookies and analytics</h2>
        <p>
          This site does not use analytics, advertising, or tracking cookies, and it does not
          run any analytics service. tahoebike.org sets no cookies at all for ordinary visitors;
          the only cookies it sets belong to the admin sign-in described below. Embedded content
          from other services may set its own cookies, as described above.
        </p>

        <h2>Admin sign-in</h2>
        <p>
          Coalition board members and staff edit parts of this site through a private admin
          console. They sign in with a Google account that is on a short list kept by the
          Coalition. Google tells the site the account&apos;s name and email address, and the
          site checks the address against that list. Signing in sets a session cookie that keeps
          the administrator signed in. Visitors cannot create accounts on this site.
        </p>

        <h2>Hosting and server logs</h2>
        <p>
          The site runs on <SmartLink href={POLICY_URLS.vercel}>Vercel</SmartLink>, and its
          database is provided through Vercel. Like any web host, Vercel keeps server logs of
          requests, which include your IP address, the page requested, and your browser, and
          which are used to keep the site running and secure.
        </p>

        <h2>Who we share information with</h2>
        <p>
          We do not sell your information. We share it only with the services named on this
          page, which we use to run the site and its programs, and if the law requires it.
          Within the Coalition, form submissions are read by the board members and volunteers
          who answer them.
        </p>

        <h2>Your choices</h2>
        <p>
          If you would like to see, correct, or delete anything you have sent us through this
          site, email {contactLink} and we will take care of it. To stop receiving the
          newsletter or volunteer emails, use the unsubscribe link in any message from us, or
          email us. For information you have given Memberful, POINT, or Constant Contact
          directly, those services let you manage your own account, and we are happy to help.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If the way this site handles information changes, we will update this page and the
          date at the top.
        </p>

        <h2>Contact</h2>
        <p>
          Lake Tahoe Bicycle Coalition
          <br />
          {settings.mailing_address}
          <br />
          {contactLink}
        </p>
      </div>
    </div>
  );
}
