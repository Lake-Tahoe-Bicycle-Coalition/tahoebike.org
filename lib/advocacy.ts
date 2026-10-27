/*
  LTBC advocacy efforts and their comment letters, listed on /advocacy.

  An effort is one project or plan we have weighed in on; it holds every letter we wrote about it.
  The letter PDFs themselves stay in the public "Comment letters" Google Drive folder
  (COMMENT_LETTERS_FOLDER_URL); this file only describes them and links to them.

  To add a letter to an existing effort, append an entry to that effort's `letters`:
  - `date` is the date on the letter, as YYYY-MM-DD (e.g. "2026-09-10"). Order does not matter;
    the page sorts letters oldest first and efforts by their newest letter.
  - `driveId` is the long id in the PDF's Google Drive "Get link" URL, the part between
    `/file/d/` and `/view` in https://drive.google.com/file/d/<driveId>/view. The file must be
    shared as "Anyone with the link".
  - `file` is the PDF's name in the Drive folder, so it can be found again.

  To add a new effort, copy an existing entry and give it a new, unique `slug` (lowercase words
  joined by hyphens; it becomes the /advocacy#<slug> link, so do not change it later). `status`
  is optional: only set it when a letter states an outcome. `related` lists the slugs of other
  efforts in this file; the page refuses to render if one does not exist, so a typo shows up on
  the pull request's preview build rather than as a broken link.

  The `//` comments above some entries are editor notes about the source letters. They are not
  shown on the site.
*/

/** Where an effort is, for the area filter on /advocacy. */
export type AdvocacyArea =
  | "South Shore"
  | "North Shore"
  | "West Shore"
  | "East Shore"
  | "Truckee"
  | "Lake-wide";

/** Where we stand on an effort or in a letter. */
export type AdvocacyPosition = "Support" | "Comment" | "Opposition" | "Mixed";

/** One comment letter, stored as a PDF in the comment letters Drive folder. */
export type AdvocacyLetter = {
  /** The PDF's name in the Drive folder. */
  file: string;
  /** Date on the letter, YYYY-MM-DD. */
  date: string;
  /** Who the letter is addressed to. */
  to: string;
  subject: string;
  position: AdvocacyPosition;
  /** One or two sentences on what the letter says. */
  summary: string;
  /** The id in the file's Drive "Get link" URL. */
  driveId: string;
};

/** A project or plan we have written to agencies about, with every letter on it. */
export type AdvocacyEffort = {
  /** Unique, stable id; also the /advocacy#<slug> anchor. */
  slug: string;
  title: string;
  area: AdvocacyArea;
  /** The bodies we wrote to. */
  agencies: string[];
  position: AdvocacyPosition;
  /** An outcome stated in one of the letters, if any. */
  status?: string;
  /** Two to four sentences on the project and our part in it. */
  summary: string;
  /** What we asked for. */
  asks: string[];
  /** Slugs of related efforts in this file. */
  related: string[];
  letters: AdvocacyLetter[];
};

/** A letter as the page lists it: with its Drive link resolved. */
export type ListedAdvocacyLetter = AdvocacyLetter & { url: string };

/** An effort as the page lists it: letters oldest first, plus the date of the newest one. */
export type ListedAdvocacyEffort = Omit<AdvocacyEffort, "letters"> & {
  letters: ListedAdvocacyLetter[];
  /** Date of the newest letter, YYYY-MM-DD. */
  latest: string;
};

/** The public Google Drive folder holding every comment letter PDF. */
export const COMMENT_LETTERS_FOLDER_ID = "1bmu9wsRb_B1E4iSSVS1JgPft7eRCUrx6";
export const COMMENT_LETTERS_FOLDER_URL =
  `https://drive.google.com/drive/folders/${COMMENT_LETTERS_FOLDER_ID}`;

/** The Google Drive viewer URL for a letter's PDF. */
export function letterUrl(letter: Pick<AdvocacyLetter, "driveId">): string {
  return `https://drive.google.com/file/d/${letter.driveId}/view`;
}

const advocacyEfforts: AdvocacyEffort[] = [
  // All six letters concern one trail system: the South Tahoe Greenway (also called the Dennis T. Machida
  // Memorial Greenway; the 2023 letter uses that name). The 2017 letter covers a different segment (Phase 2,
  // segments 1b and 2, with the Trout Creek boardwalk near LTCC) and the 2023 letter covers a proposed
  // eastern extension study, but both are the same trail. Date mismatches: '2022.02.12' file is dated
  // February 16, 2022 on the letter; '2024.09.19' file is dated September 25, 2024. The May 2024 letter's
  // subject says ATP Cycle 7 but its closing says 'Cycle 6' (likely a typo in the original). The 2022 letter
  // references a Figure 1 map of the proposed Sierra Boulevard crossing that is not in the text extraction.
  // Status line is drawn from the May 2024 letter; no letter states the outcome of any grant.
  {
    slug: "south-tahoe-greenway",
    title: "South Tahoe Greenway and Johnson Meadow Bridge",
    area: "South Shore",
    agencies: ["El Dorado County", "California Tahoe Conservancy", "Lake Tahoe Community College"],
    position: "Support",
    status:
      "The Sierra Tract to Bijou link and the Sierra Boulevard path are built. The Johnson Meadow bridge connector was still closing its final funding gap as of our September 2026 letter.",
    summary:
      "The South Tahoe Greenway is a paved bike and walking path running across South Lake Tahoe, south of Highway 50, linking neighborhoods, Lake Tahoe Community College, schools, and parks. We have backed it since 2017, from the boardwalk over Trout Creek to a new trail and bridge across the Upper Truckee River through Johnson Meadow. That roughly 1.2-mile connector would link the Sierra Tract neighborhood to the Barton Memorial Hospital area and the Y. We also support studying an eastern extension toward Ski Run and Van Sickle Bi-State Park.",
    asks: [
      "Fund and build the Upper Truckee River bridge at Johnson Meadow to restore a lost river crossing and close a key gap in the Greenway.",
      "Line up the new trail's entrance with the existing Greenway across Sierra Boulevard so riders can cross straight through.",
      "Add reflectors or lighting at trail entrances like Sierra Tract and Winnemucca, while keeping the meadow and forest unlit.",
      "Plan for winter maintenance, including snow removal, so the trail is usable year-round.",
      "Keep extending the Greenway, including east through the Ski Run neighborhood to Van Sickle Bi-State Park.",
    ],
    related: [
      "bijou-park-connector-trail",
      "lake-tahoe-airport-master-plan",
      "trpa-active-transportation-plan-2024",
    ],
    letters: [
      {
        file: "2017.12.08 Greenway Support.pdf",
        date: "2017-12-08",
        to: "Lake Tahoe Community College (LTCC) Board of Trustees",
        subject: "Letter of Support - The South Tahoe Greenway Project",
        position: "Support",
        summary:
          "We urged LTCC trustees to approve a land exchange that would let the college contribute $700,000 to Greenway Phase 2, which includes a boardwalk and bridge over Trout Creek. Without it, we warned, the project could stall due to a funding shortage.",
        driveId: "12YeYfzea3CNM5t0edb13mJXtoHbyLjEU",
      },
      {
        file: "2022.02.12 Johnson Meadow Upper Truckee Bridge Support.pdf",
        date: "2022-02-16",
        to: "El Dorado County Department of Transportation",
        subject:
          "Letter of Support for the South Tahoe Greenway - Upper Truckee River Bridge at Johnson Meadow Project",
        position: "Support",
        summary:
          "We supported extending the Greenway from the Sierra Tract neighborhood to the Y with a new Upper Truckee River bridge. We asked the county to line up trail entrances across Sierra Boulevard so riders can cross straight, or else use the Alternative 3 trailhead.",
        driveId: "1heJq2KzccjxZuHT-7NX0DcOti21DccFk",
      },
      {
        file: "2023.12.13 Greenway Extension Support.pdf",
        date: "2023-12-13",
        to: "California Tahoe Conservancy Board",
        subject: "Agenda Item 8: Dennis T. Machida Memorial Greenway Grant",
        position: "Support",
        summary:
          "We supported a Conservancy grant to the City of South Lake Tahoe to study extending the Greenway east through the Ski Run neighborhood to Van Sickle Bi-State Park.",
        driveId: "12pSU6SbbscjtwTfpao4Ldeo8_lJgJr8E",
      },
      {
        file: "2024.05.22 EDC ATP Greenway Upper Truckee Bridge Support.pdf",
        date: "2024-05-22",
        to: "El Dorado County Department of Transportation",
        subject:
          "Letter of Support for the South Tahoe Greenway - Upper Truckee River Bridge at Johnson Meadow Project Applications for Active Transportation Program (ATP) Cycle 7",
        position: "Support",
        summary:
          "We backed the county's state Active Transportation Program grant application for the Johnson Meadow bridge. We noted the old bridge is gone and people now wade the river on erosion-prone social trails, and that the project serves many lower-income, car-dependent households.",
        driveId: "1iUkHAAwqpcPTc-8WV3kk3119O18DGO9N",
      },
      {
        file: "2024.09.19 Johnson Meadow Upper Truckee Bridge Support.pdf",
        date: "2024-09-25",
        to: "El Dorado County Department of Transportation",
        subject: "South Tahoe Greenway - Upper Truckee River Bridge at Johnson Meadow",
        position: "Support",
        summary:
          "Commenting on the project report, we supported leaving the meadow and forest unlit but asked for reflectors or lighting at the Sierra Tract and Winnemucca access points. We also asked whether regular snow removal is planned.",
        driveId: "1BJNw7b6L5eUddp1qgN2udUcmasL_Pj7G",
      },
      {
        file: "2026.09.10 LTBC Support for Johnson Meadow Greenway Connector Implementation Grant.pdf",
        date: "2026-09-10",
        to: "California Tahoe Conservancy Board of Directors",
        subject: "Johnson Meadow Greenway Connector Implementation Grant",
        position: "Support",
        summary:
          "We strongly supported a proposed $2 million Conservancy grant to El Dorado County to fill the final funding gap for the Johnson Meadow Greenway Connector. The roughly 1.2-mile trail would link Sierra Tract to the Barton Memorial Hospital area and restore a river crossing.",
        driveId: "16hDTUS7Fo3yKG89LYo2cQUfM9R-Vk7eu",
      },
    ],
  },
  // Merged from four efforts (Highway 50 Safety Project, speed limit increase, Trout Creek to Stateline
  // repaving, US 50/89 corridor plan). The May 2026 corridor plan letter says it attached our March 31, 2021
  // letter on the Highway 50 Safety Project; that attachment is not in the text extraction, so check whether
  // it is in the PDF or a separate file. The 2021 letter is addressed to Caltrans (Environmental Management,
  // Marysville) and comments on the Initial Study and Negative Declaration; its pages 4-14 are a detailed
  // LTBC addendum (intersection-by-intersection suggestions, lighting, signage, signal timing), and the
  // project limits (the Y to Pioneer Trail) are inferred from its intersection list. The 2023 speed limit
  // letter agrees with City staff's criticism of the Caltrans Engineering and Traffic Survey. The repaving
  // letter is dated February 8, 2024 (filename says 2024.02.06); it does not expand CAPM ('Capital Preventive
  // Maintenance' is the standard Caltrans meaning) and cites the Caltrans District 3 Active Transportation
  // Plan (2020), which calls this area a 'Main Street'. No letter states an outcome.
  {
    slug: "caltrans-highways-south-lake-tahoe",
    title: "Caltrans Highway Improvements Through South Lake Tahoe",
    area: "South Shore",
    agencies: ["California Department of Transportation (Caltrans)", "City of South Lake Tahoe"],
    position: "Comment",
    summary:
      "Caltrans owns US Highway 50 and State Route 89 through South Lake Tahoe, so the busiest streets in town are state highways. Since 2021 we have weighed in on each Caltrans and City decision about them: the Highway 50 Safety Project from the Y to Pioneer Trail, a proposed speed limit increase, a repaving project from Trout Creek to Stateline, and the City's US 50/89 Multimodal Mainstreet Corridor Plan. Our message has stayed the same: slower traffic, full-width bike lanes, and safer crossings and connections.",
    asks: [
      "Slow traffic with narrower lanes, signals timed below the speed limit, and lower posted limits, especially at South Tahoe Middle School and Heavenly Village.",
      "Add full-width bike lanes on both sides of the highway, buffered or protected where the road width allows, with bike-safe drain grates and well-maintained green paint.",
      "Connect the highway bike lanes to side-street bikeways at the Y, Tahoe Keys, Sierra, Al Tahoe, Ski Run, and Pioneer Trail with turn boxes, paint, and crosswalks.",
      "Shrink the oversized Y intersection by removing slip lanes and extra through lanes, and bring SR 89 near the Y down to two lanes with protected bike lanes.",
      "Oppose speed limit increases, and use the City's authority under Assembly Bill 43 to set lower limits and add traffic calming.",
    ],
    related: [],
    letters: [
      {
        file: "2021.03.31 SLT Safety Project Comment.pdf",
        date: "2021-03-31",
        to: "California Department of Transportation (Caltrans), Environmental Management M-3 Branch",
        subject: "South Lake Tahoe Safety Project Comments",
        position: "Support",
        summary:
          "Comments on the Initial Study and Negative Declaration for the Highway 50 safety project. We welcomed the green bike lanes, lighting, and crossings, and attached a detailed addendum asking for buffered bike lanes, better intersection connections, a middle school zone, and early delivery of key pieces.",
        driveId: "1KVN78YzZops-qyyJZE-U9gey902hG7OQ",
      },
      {
        file: "2023.06.19 US 50 Speed Limit Opposition.pdf",
        date: "2023-06-19",
        to: "City of South Lake Tahoe Mayor and City Council",
        subject:
          "Agenda Item 15, Public Hearing for Caltrans' Proposed Speed Limit Increase on Sections of US 50, US 89, and US 50/89",
        position: "Opposition",
        summary:
          "Written for the Council's public hearing on Caltrans' proposed speed limit increase. We supported staff's recommendation to oppose it and urged lower limits, traffic calming, and a corridor plan for SR 89 at the Y.",
        driveId: "14Pkd9yI40i9PAOh5DuYcOGVUBwWwKyvD",
      },
      {
        file: "2024.02.06 Caltrans HWY50 Pavement Project Comment.pdf",
        date: "2024-02-08",
        to: "Caltrans North Region Environmental, District 3",
        subject:
          "South Lake Tahoe CAPM Project: Trout Creek Bridge to Stateline, Nevada on US Highway 50 in El Dorado County, Initial Study with Proposed Negative Declaration",
        position: "Comment",
        summary:
          "Responds to the environmental Initial Study for the US 50 repaving project. We asked for four-foot bike lanes on both sides, made room by narrowing travel lanes.",
        driveId: "1_RdvPalK0us0qhCf_klV3xF-OfdJ7N5T",
      },
      {
        file: "2026.05.30 US 50 89 Multimodal Mainstreet Corridor Plan Comment.pdf",
        date: "2026-05-30",
        to: "City of South Lake Tahoe",
        subject: "US 50/89 Multimodal Mainstreet Corridor Plan",
        position: "Support",
        summary:
          "Thanks the City for starting the corridor plan and lists our priorities: slowing cars, a calmer gateway on Highway 89, a smaller Y intersection, better bike lanes, and other fixes. It also asks the City to revisit our 2021 Safety Project recommendations, many still not built.",
        driveId: "17sjIuA0WKoNa7uG275403HimZk3jc-RK",
      },
    ],
  },
  // The program would acquire about 50 existing e-bikes and 100 stations; the letter does not say who owns
  // them now. TIRCP Cycle 8. No individual signer, just the Board of Directors.
  {
    slug: "truckee-e-bike-share-tircp",
    title: "Truckee E-Bike Share Expansion",
    area: "Truckee",
    agencies: ["California State Transportation Agency (CalSTA)", "Town of Truckee"],
    position: "Support",
    summary:
      "The Town of Truckee applied for a state Transit and Intercity Rail Capital Program (TIRCP) grant for its Keep Truckee Moving Phase 2 projects. A key piece would buy and expand the Truckee E-Bike Share, adding stations in neighborhoods and busy areas, a zero-emission van to rebalance bikes, safety education, and bike racks and signs at bus stops. We wrote to support the application, especially the e-bike share.",
    asks: [
      "Fund the Town of Truckee's TIRCP application for Keep Truckee Moving Phase 2.",
      "Expand the Truckee E-Bike Share into neighborhoods and key activity centers.",
      "Add bike racks, charging racks, and better rider signs at bus stops to link biking with transit.",
      "Include safety education and safety gear for eligible e-bike share riders.",
    ],
    related: ["truckee-river-legacy-trail-phase-4b"],
    letters: [
      {
        file: "2026.05.04 Truckee TIRCP Support.pdf",
        date: "2026-05-04",
        to: "California State Transportation Agency (CalSTA), Secretary of Transportation",
        subject:
          "RE: Letter of Support for Town of Truckee TIRCP Cycle 8 Application - Keep Truckee Moving Phase 2: Multimodal Operations and Active Connections",
        position: "Support",
        summary:
          "We supported the Town of Truckee's Cycle 8 TIRCP grant application. We focused on the plan to grow the Truckee E-Bike Share and improve first-mile and last-mile connections to transit.",
        driveId: "1Qzb-idtIQY-iB1kYqyLa05M3m3Tz-b2N",
      },
    ],
  },
  // The document is a 7-page guide titled 'South Tahoe Bike Routes: A Guide for Short Term Prioritization',
  // dated only 'September 2025' (filename says 2025-09-01, used as the date). Co-authored with the South Lake
  // Tahoe Recreation JPA Bicycle Advisory Committee; JPA is not expanded in the letter (likely Joint Powers
  // Authority). It overlaps with the May 2025 road rehabilitation letter on Eloise, Johnson, and Palmira. The
  // letter mentions map.tahoebike.org for existing bike routes.
  {
    slug: "south-tahoe-bike-routes-prioritization",
    title: "South Tahoe Bike Routes Short-Term Priorities",
    area: "South Shore",
    agencies: ["City of South Lake Tahoe City Council", "Tahoe Regional Planning Agency (TRPA)"],
    position: "Comment",
    summary:
      "South Lake Tahoe's bike network is a patchwork of off-street paths linked by city streets marked as bike routes. Together with the South Lake Tahoe Recreation Joint Powers Authority (JPA) Bicycle Advisory Committee, we sent the City Council a guide for quick, low-cost fixes to those streets. It lists bike routes that need repaving, spot fixes like green sharrows and crosswalks, new streets to sign as bike routes, and confusing routes to drop.",
    asks: [
      "Give designated bike route streets priority for repaving and snow removal, with a 15 mph speed limit.",
      "Include 15 key bike streets, led by Eloise Ave, Dunlap Dr, and Johnson Blvd, in a five-year repaving plan.",
      "Repaint lines, sharrows, and crosswalks on bike routes every year, especially near major intersections.",
      "Sign new bike routes that close gaps, such as Dunlap Dr, Barton Ave, Palmira Ave, and Spruce Ave.",
      "Remove bike route signs from redundant or misleading streets, such as Oakland Ave and Helen Ave.",
    ],
    related: ["slt-2026-road-rehabilitation-priorities"],
    letters: [
      {
        file: "2025.09.01 South Tahoe Bike Routes Prioritization Comment.pdf",
        date: "2025-09-01",
        to: "City of South Lake Tahoe City Council",
        subject: "South Tahoe Bike Routes: A Guide for Short Term Prioritization",
        position: "Comment",
        summary:
          "A joint guide asking the City to treat Class III bike route streets as priorities for maintenance, safety, and wayfinding. It lists streets to repave, specific intersection fixes, new routes to designate, and obsolete routes to remove.",
        driveId: "1kp5SOIIUmr1HcMoDr6xu_1TECY86aHlQ",
      },
    ],
  },
  // Letter is dated May 31, 2025 but refers to agenda item 15 for a 'June 13' City Council meeting; we did
  // not verify that meeting date. The September 2025 bike routes letter repeats these same street priorities
  // as part of a broader request; kept as a separate effort per instructions, but the editor could merge
  // them.
  {
    slug: "slt-2026-road-rehabilitation-priorities",
    title: "South Lake Tahoe 2026 Road Repaving Priorities",
    area: "South Shore",
    agencies: ["City of South Lake Tahoe City Council"],
    position: "Comment",
    summary:
      "Each year the City of South Lake Tahoe repaves a set of streets through its Capital Improvement Plan (CIP). For the 2026 list, we asked the City Council to put three busy bike streets first: Johnson Blvd, Eloise Ave, and Palmira Ave. We also asked for small add-ons during repaving, like protecting the Johnson Blvd bike lane and extending the work a block or two to reach key intersections.",
    asks: [
      "Prioritize Johnson Blvd, Eloise Ave, and Palmira Ave for 2026 repaving because they are major bike connections.",
      "Add seasonally removable bollards along the Johnson Blvd bike lane to protect riders on the newly paved road.",
      "Extend the Eloise Ave work one block onto Dunlap Ave, with painted bike lanes, to reach the Y intersection.",
      "Extend the Palmira Ave work one block onto Lodi Ave and Carson Ave to reach the US 50 traffic lights.",
      "Delay repaving of Heavenly Village Way, Montreal Ave, and Pioneer Trail to line up with future Park Ave complete streets work.",
    ],
    related: ["south-tahoe-bike-routes-prioritization"],
    letters: [
      {
        file: "2025.05.31 SLT Road Rehabilitation Comment.pdf",
        date: "2025-05-31",
        to: "City of South Lake Tahoe Mayor and City Council",
        subject: "Agenda Item 15 - Capital Improvement Plan",
        position: "Support",
        summary:
          "Responds to the Public Works list of streets proposed for 2026 road rehabilitation. We thanked the City for its active transportation investments and asked that Johnson Blvd, Eloise Ave, and Palmira Ave be prioritized, with small bike-friendly additions.",
        driveId: "17AejVBUsIQtmOJ7E1Ael3x3xxxTR1IqU",
      },
    ],
  },
  // Letter is dated May 12, 2025; filename says 2025.05.10. Letter does not name the exact location of Phase
  // 1A beyond Nevada and the South Demonstration section, so area is set to Lake-wide per the task grouping;
  // the editor may prefer East Shore if that is where the project sits.
  {
    slug: "ttd-south-demonstration-phase-1a-path",
    title: "Stateline-to-Stateline Bikeway, South Demonstration Phase 1A",
    area: "South Shore",
    agencies: ["Tahoe Transportation District (TTD)", "U.S. Department of Transportation (USDOT)"],
    position: "Support",
    summary:
      "The Tahoe Transportation District (TTD) applied for a federal Safe Streets and Roads for All grant to build Phase 1A of the South Demonstration section of the Nevada Stateline-to-Stateline Bikeway. This phase is a shared walking and biking path plus sidewalk. It would link lodging and neighborhoods to popular beaches and recreation areas. We wrote to the U.S. Department of Transportation in full support.",
    asks: [
      "Fund the Phase 1A path and sidewalk through the fiscal year 2025 Safe Streets and Roads for All grant program.",
      "Build this path as a key, safe, car-free link in the region's bike and walking network.",
    ],
    related: [],
    letters: [
      {
        file: "2025.05.10 TTD Safe Streets and Roads for All Support.pdf",
        date: "2025-05-12",
        to: "U.S. Department of Transportation, Secretary of Transportation",
        subject:
          "FY 25 Safe Streets and Roads for All Grant Application for the Tahoe Transportation District South Demonstration Phase 1A Multimodal Path and Sidewalk",
        position: "Support",
        summary:
          "Support letter for the Tahoe Transportation District's federal grant application. We said the path would give residents and visitors a safe car-free option, ease traffic, and connect lodging and neighborhoods to beaches.",
        driveId: "1-pLw_z1O4PtD_1YxxNjMLksdXPchpenU",
      },
    ],
  },
  // The letter refers to both 'Tahoe Valley Airport' and 'Lake Tahoe Airport Master Plan'; the airport is
  // Lake Tahoe Airport. Route 50 is a Tahoe Transportation District (TTD) bus route. The PDF attaches maps of
  // the proposed alignment (not reviewed in detail; text describes it). Addressed to a named City staff
  // member, role not stated.
  {
    slug: "lake-tahoe-airport-master-plan",
    title: "Lake Tahoe Airport Master Plan",
    area: "South Shore",
    agencies: ["City of South Lake Tahoe"],
    position: "Comment",
    summary:
      "The City of South Lake Tahoe's Airport Master Plan sets the long-term plan for Lake Tahoe Airport, which also houses City Hall offices. The plan considers bike access to the site. We thanked the City and suggested a scenic, low-cost bike path route using existing airport pavement, plus a quick fix on Airport Road and a bus stop at the airport.",
    asks: [
      "Paint one lane of one-way Airport Road as a two-way bike lane now, as a quick and cheap safety fix.",
      "Route a bike path from the end of Melba Drive along existing airport pavement, moving the fence to keep riders safe.",
      "Connect the path to the Greenway across Johnson Meadow and avoid costly crossings of the nearby stream zone.",
      "Keep the old air traffic control tower and restore it as a viewpoint and attraction.",
      "Plan a bus stop at the airport, with route 50 ending there, and consider a park-and-ride for an Emerald Bay shuttle.",
    ],
    related: ["south-tahoe-greenway"],
    letters: [
      {
        file: "2024.06.21 Tahoe Airport Master Plan Comment.pdf",
        date: "2024-06-21",
        to: "City of South Lake Tahoe, Airport Master Plan staff",
        subject: "Airport Master Plan",
        position: "Comment",
        summary:
          "Comments on the draft Airport Master Plan. We welcomed planned bike access and proposed a path on existing pavement, a two-way bike lane on Airport Road, saving the old control tower, and a bus stop at the airport.",
        driveId: "1oudxhtvBesBYOKqmIcfwT3jRiRRkT3dj",
      },
    ],
  },
  // Letter is long and includes many street-level map corrections and project-by-project comments (mostly
  // South Lake Tahoe and Meyers) not captured in the asks. Other asks: require bike valet at large events,
  // guidance for bike-share and scooter corrals, lighted path crossings of Highway 89 between Tahoma and
  // Tahoe City, and prioritizing the Zephyr Cove to South Shore link on US 50. Letter text misspells 'Barbara
  // Ave' as 'Barabra' and 'Sand Harbor' as 'San Harbor'.
  {
    slug: "trpa-active-transportation-plan-2024",
    title: "Tahoe Regional Active Transportation Plan",
    area: "Lake-wide",
    agencies: ["Tahoe Regional Planning Agency (TRPA)"],
    position: "Comment",
    summary:
      "The Tahoe Regional Planning Agency (TRPA) updated its Active Transportation Plan in 2024. The plan sets the lake-wide list and priorities for bike paths, bike lanes, sidewalks and related programs. We welcomed its focus on safety and on town centers, where short trips make biking practical. We asked for bolder goals, better neighborhood bike routes, fixes to the stress maps, and changes to which projects come first.",
    asks: [
      "Set much more ambitious goals than the proposed 2% gain in walking and biking and 1% cut in vehicle miles traveled.",
      "Prioritize projects in town centers, and safer bike lanes for long rides, over a complete paved path ring around the lake.",
      "Define strong standards for quiet-street bike routes, including 15 mph speeds, traffic calming, smooth pavement, lighting and priority snow removal.",
      "Add the South Lake Tahoe Greenway extension from Herbert Ave to Ski Run Blvd and on to Van Sickle Bi-State Park, a top priority for us.",
      "Propose buffered and protected bike lanes on busy roads like US 50 and Pioneer Trail, and correct bike stress maps that miss real conditions.",
    ],
    related: ["south-tahoe-greenway"],
    letters: [
      {
        file: "2024.03.24 TRPA ATP Comment.pdf",
        date: "2024-03-24",
        to: "Tahoe Regional Planning Agency (TRPA) planning staff",
        subject: "Tahoe Regional Planning Agency 2024 Active Transportation Plan",
        position: "Comment",
        summary:
          "Detailed comments on the draft 2024 Active Transportation Plan. We supported its safety and town center focus and asked for bolder goals, stronger bike route standards, map corrections and reordered project priorities.",
        driveId: "11a8llStacRA20TrXorE5G1h0UtIKou3p",
      },
    ],
  },
  // The letter says Phase 4B is a short section "within Placer County"; that seems odd for a Town of Truckee
  // project, so the summary does not repeat it. The letter does not name which grant program the funding
  // request was for.
  {
    slug: "truckee-river-legacy-trail-phase-4b",
    title: "Truckee River Legacy Trail Phase 4B",
    area: "Truckee",
    agencies: ["Town of Truckee"],
    position: "Support",
    summary:
      "The Truckee River Legacy Trail is a paved path, separate from car traffic, running across Truckee from the Glenshire area in the east to Donner Lake in the west. Phase 4B fills the last major east-west gap, linking downtown and eastern Truckee with schools, the hospital, grocery stores, and jobs on the west end. It also ties into trails toward Placer County, Lake Tahoe, and Reno. We supported the Town of Truckee's funding request to build it.",
    asks: [
      "Fund and build Phase 4B to close the last major east-west gap in Truckee's bike and walking network.",
      "Give people a way to cross town by bike or on foot, separated from cars.",
      "Connect the Legacy Trail to the Truckee River Trail, Martis Trail, and Tahoe Pyramid Bikeway for regional travel.",
      "Cut traffic, driving miles, and greenhouse gas emissions by making biking and walking easy.",
    ],
    related: ["truckee-e-bike-share-tircp"],
    letters: [
      {
        file: "2024.03.12 Truckee River Legacy Trail Phase 4B Support.pdf",
        date: "2024-03-12",
        to: "Town of Truckee, Town Manager",
        subject: "RE: Truckee River Legacy Trail Phase 4B",
        position: "Support",
        summary:
          "We supported the Town of Truckee's funding request for Phase 4B, the last unbuilt section of the Legacy Trail. We highlighted its car-free crosstown route, links to regional trails, and access to parks and open space.",
        driveId: "12IMcxEEdAzLAFAghl09k_frS5nkt3mC7",
      },
    ],
  },
  // The letter is dated February 7, 2024; the filename says 2024.02.06. The letter says we had no preference
  // between southern segments A or B, or on the northern alignment. Page 2 includes a schematic from the
  // City's project survey.
  {
    slug: "bijou-park-connector-trail",
    title: "Bijou Park Multi-Use Connector Trail",
    area: "South Shore",
    agencies: ["City of South Lake Tahoe"],
    position: "Support",
    summary:
      "The City of South Lake Tahoe is planning a paved multi-use trail through Bijou Park to fill a gap between existing bike paths. It would link the Dennis T. Machida Memorial Greenway with the Al Tahoe Boulevard and future Johnson Boulevard paths, serving several nearby neighborhoods. We support the project and asked the City to build the full connection, including a section along Al Tahoe Boulevard that was not yet funded.",
    asks: [
      "Include the unfunded connector section along Al Tahoe Boulevard and look for more funding to finish it soon.",
      "Plow the trail in winter so it can be used year-round, and leave room for snow storage between path and road.",
      "Design the southern route to connect well with the Greenway to the east.",
      "Space the trail and disc golf baskets with good sight lines to avoid conflicts.",
      "Keep the new crosswalk and flashing beacon between Lake Tahoe Community College and the park entrance.",
    ],
    related: ["south-tahoe-greenway"],
    letters: [
      {
        file: "2024.02.06 Bijou Park Connector Multi-Use Trail Comment.pdf",
        date: "2024-02-07",
        to: "City of South Lake Tahoe, project staff",
        subject: "Bijou Park Multi-Use Connector Trail",
        position: "Support",
        summary:
          "Responds to the City's trail design options. We supported the project, urged including the unfunded Al Tahoe Boulevard section, and asked for winter snow removal, snow storage, and safe spacing from disc golf.",
        driveId: "1XrbCkJUX0t7Nz8LathxQ002h5E-7XNM9",
      },
    ],
  },
  // The folder also contains "2019.4.1 Dollar Creek Crossing Support.pdf", a byte-identical duplicate of the
  // 2019.04.01 file; only the 2019.04.01 file is listed. The applicant is named as the Related California
  // Team, for the 2018-19 Tourism Master Plan Grant.
  {
    slug: "dollar-creek-crossing",
    title: "Dollar Creek Crossing Trails and Wayfinding",
    area: "North Shore",
    agencies: ["Placer County Capital Projects Advisory Committee"],
    position: "Support",
    summary:
      "Dollar Creek Crossing is a housing development near Tahoe City with a planned village center. The plan includes trail links, signs, and wayfinding to connect the Dollar Hill area with the village center and Tahoe City, plus walking and biking along the highway. We supported the developer's application for a Placer County Tourism Master Plan grant to fund these pieces.",
    asks: [
      "Fund the trail connections, signage, and wayfinding in the Dollar Creek Crossing grant application.",
      "Connect the Dollar Hill area to the Dollar Creek Village Center and Tahoe City by trail.",
      "Give residents, working families, and visitors easy ways to walk and bike around the development and along the highway.",
    ],
    related: [],
    letters: [
      {
        file: "2019.04.01 Dollar Creek Crossing Support.pdf",
        date: "2019-04-01",
        to: "Placer County Capital Projects Advisory Committee",
        subject: "Letter of Support for Dollar Creek Crossing's Tourism Master Plan Grant Proposal",
        position: "Support",
        summary:
          "We supported the Related California Team's 2018-19 Tourism Master Plan grant application for Dollar Creek Crossing. Our support focused on the project's trail connections, signage, and wayfinding.",
        driveId: "1s9_017pPX31OEuKLbHnf9StfZYUmZO-u",
      },
    ],
  },
  // Assigned to the caller as North Shore/Truckee, but the letter places this trail on the South Shore
  // (reached via the Van Sickle Trail from South Lake Tahoe); area set to South Shore. Letter is addressed to
  // Nevada Division of State Parks and the RTP Advisory Committee. Grant was submitted by TAMBA and USFS, not
  // LTBC.
  {
    slug: "panorama-trail",
    title: "Panorama Trail near Van Sickle Bi-State Park",
    area: "South Shore",
    agencies: ["Nevada Division of State Parks"],
    position: "Support",
    summary:
      "The Panorama Trail is a planned trail for hiking and biking with wide views of Lake Tahoe. It connects to the Van Sickle Trail, so riders can reach it straight from the town of South Lake Tahoe. TAMBA and the US Forest Service (USFS) asked Nevada State Parks for a Recreational Trails Program grant to build it, and we backed their request.",
    asks: [
      "Fund the TAMBA and USFS grant request to build the Panorama Trail.",
      "Add more riding options for locals and visitors that start right from town via the Van Sickle Trail.",
    ],
    related: [],
    letters: [
      {
        file: "2016.04.27 Panorama Trail Support.pdf",
        date: "2016-04-27",
        to: "Nevada Division of State Parks, Recreational Trails Program (RTP) Advisory Committee",
        subject:
          "Support for TAMBA and USFS Panorama Trail funding request (Nevada State Parks Recreational Trails Program grant)",
        position: "Support",
        summary:
          "As a partner of TAMBA and the USFS, we wrote in support of their Recreational Trails Program grant request for the Panorama Trail. We strongly recommended the grant be funded.",
        driveId: "1KG31n9O974_ywplDybmxnOewPXjPl5SQ",
      },
    ],
  },
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Catches editing mistakes in the list above: duplicate slugs, `related` slugs that do not
 * exist, efforts without letters, and dates not written as YYYY-MM-DD. Throws, so the page
 * (and the preview build) fails with a message saying what to fix.
 */
function checkAdvocacyEfforts(efforts: AdvocacyEffort[]) {
  const slugs = new Set<string>();
  const problems: string[] = [];
  for (const effort of efforts) {
    if (slugs.has(effort.slug)) problems.push(`duplicate slug "${effort.slug}"`);
    slugs.add(effort.slug);
  }
  for (const effort of efforts) {
    if (effort.letters.length === 0) problems.push(`"${effort.slug}" has no letters`);
    for (const slug of effort.related) {
      if (!slugs.has(slug)) problems.push(`"${effort.slug}" lists unknown related slug "${slug}"`);
    }
    for (const letter of effort.letters) {
      if (!ISO_DATE.test(letter.date)) {
        problems.push(`"${effort.slug}": letter date "${letter.date}" is not YYYY-MM-DD`);
      }
    }
  }
  if (problems.length > 0) throw new Error(`lib/advocacy.ts: ${problems.join("; ")}`);
}

/** Every effort, newest letter first, with each effort's letters oldest first. */
export function getAdvocacyEfforts(): ListedAdvocacyEffort[] {
  checkAdvocacyEfforts(advocacyEfforts);
  return advocacyEfforts
    .map((effort) => {
      // YYYY-MM-DD strings sort the same as the dates they name.
      const letters = [...effort.letters]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((letter) => ({ ...letter, url: letterUrl(letter) }));
      // checkAdvocacyEfforts guarantees at least one letter.
      return { ...effort, letters, latest: letters.at(-1)?.date ?? "" };
    })
    .sort((a, b) => b.latest.localeCompare(a.latest));
}
