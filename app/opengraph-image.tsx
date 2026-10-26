import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * Default Open Graph / Twitter card image for every page that does not set
 * its own `openGraph.images`. Generated at build time by next/og.
 */
export const alt = "Lake Tahoe Bicycle Coalition. Helping Tahoe become more bicycle friendly.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SAFETY_YELLOW = "#FFDF00";
const ASPHALT = "#201800";

// The emblem and fonts never change between requests, so read them once at module scope.
const emblemSrc = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public/images/brand/ltbc-emblem-512.png"),
).toString("base64")}`;

// Libre Franklin, the site's stand-in for the brand's Franklin Gothic ATF (OFL; see app/fonts/OFL.txt).
// next/og bundles no heavy weights, so the header weight must be supplied here.
const font = (weight: 400 | 800) =>
  readFileSync(join(process.cwd(), `app/fonts/libre-franklin-latin-${weight}-normal.woff`));
const fonts = [
  { name: "Libre Franklin", data: font(400), weight: 400 as const, style: "normal" as const },
  { name: "Libre Franklin", data: font(800), weight: 800 as const, style: "normal" as const },
];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: SAFETY_YELLOW,
          color: ASPHALT,
          fontFamily: "Libre Franklin",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            padding: "0 72px",
          }}
        >
          <img src={emblemSrc} width={380} height={380} alt="" />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: 64,
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                lineHeight: 1.1,
                textTransform: "uppercase",
                // Brand header tracking 100 (0.1em), as in globals.css.
                letterSpacing: "0.1em",
              }}
            >
              Lake Tahoe Bicycle Coalition
            </div>
            <div style={{ marginTop: 28, fontSize: 34, lineHeight: 1.25, letterSpacing: "0.025em" }}>
              Helping Tahoe become more bicycle friendly.
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            height: 88,
            padding: "0 72px",
            background: ASPHALT,
            color: SAFETY_YELLOW,
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          tahoebike.org
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
