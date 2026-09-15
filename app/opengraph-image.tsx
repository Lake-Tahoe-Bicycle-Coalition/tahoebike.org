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

// The emblem never changes between requests, so read it once at module scope.
const emblemSrc = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public/images/brand/ltbc-emblem-512.png"),
).toString("base64")}`;

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
          fontFamily: "sans-serif",
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
                fontSize: 78,
                fontWeight: 900,
                lineHeight: 1,
                textTransform: "uppercase",
                letterSpacing: -2,
                // The bundled font has one weight; a same-colour shadow thickens the strokes.
                textShadow: `2px 0 0 ${ASPHALT}`,
              }}
            >
              Lake Tahoe Bicycle Coalition
            </div>
            <div style={{ marginTop: 28, fontSize: 34, lineHeight: 1.25 }}>
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
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          tahoebike.org
        </div>
      </div>
    ),
    size,
  );
}
