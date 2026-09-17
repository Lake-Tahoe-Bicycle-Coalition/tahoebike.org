import type { ReactNode } from "react";

/** Title row of an admin page, with an optional primary action (e.g. "New event") on the right. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <h1>{title}</h1>
        {description ? <p className="max-w-2xl text-asphalt/80">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
