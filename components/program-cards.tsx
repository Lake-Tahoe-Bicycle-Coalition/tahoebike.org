import { SmartLink } from "@/components/smart-link";

export type ProgramCard = {
  title: string;
  blurb: string;
  /** Site path or external URL (external ones open in a new tab). */
  href: string;
  /** Button text; the program title is appended for screen readers. */
  linkLabel?: string;
};

/** Grid of program summary cards for the /programs index. */
export function ProgramCards({ programs }: { programs: ProgramCard[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {programs.map((program) => {
        const label = program.linkLabel ?? "Learn more";
        return (
          <li
            key={program.href}
            className="flex flex-col rounded-lg border border-asphalt/10 bg-white p-5"
          >
            <h2 className="text-xl sm:text-xl">{program.title}</h2>
            <p className="mt-3 flex-1">{program.blurb}</p>
            <p className="mt-5">
              <SmartLink href={program.href} className="btn btn-secondary">
                {label}
                <span className="sr-only">: {program.title}</span>
              </SmartLink>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
