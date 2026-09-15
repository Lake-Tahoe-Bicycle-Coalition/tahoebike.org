import Image from "next/image";
import type { BoardMember } from "@/lib/generated/prisma/client";
import { Markdown } from "@/lib/markdown";
import { isOptimizableImageUrl } from "@/lib/urls";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

/** Grid of board member cards. Pages fetch the rows and pass them in. */
export function BoardRoster({ members }: { members: BoardMember[] }) {
  if (members.length === 0) {
    return <p>Our board roster is being updated.</p>;
  }

  return (
    <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <li key={member.id} className="flex flex-col gap-2">
          <div className="relative mb-2 aspect-square w-36 overflow-hidden rounded-lg bg-bluebird/30">
            {member.photoUrl ? (
              <Image
                src={member.photoUrl}
                alt={member.name}
                fill
                sizes="144px"
                className="object-cover"
                unoptimized={!isOptimizableImageUrl(member.photoUrl)}
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-full w-full items-center justify-center text-4xl font-extrabold text-tahoe-deep"
              >
                {initials(member.name)}
              </div>
            )}
          </div>
          <h3>{member.name}</h3>
          {member.role ? <p className="font-semibold text-tahoe-deep">{member.role}</p> : null}
          {member.bio.trim() ? (
            <div className="space-y-2">
              <Markdown source={member.bio} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
