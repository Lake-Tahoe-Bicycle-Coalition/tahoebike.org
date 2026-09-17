"use client";

import type { ReactNode } from "react";

/**
 * A form whose submission first asks for confirmation (delete, remove, …). Pass a
 * server action as `action`; hidden inputs and the submit button go in `children`.
 */
export function ConfirmForm({
  action,
  message,
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
