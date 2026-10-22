"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

type Props = Omit<ComponentProps<"button">, "type"> & {
  /** Shown in place of the label while the action runs, e.g. "Moving…". */
  pendingLabel?: string;
};

/**
 * The submit button for a one-click server-action form in the admin (move, activate,
 * archive, delete, …). It disables itself while its form's action runs, so a double-click
 * cannot run the action twice (a second "Move up" would move the row two places), and it
 * says what is happening. Must be rendered inside the <form> (or ConfirmForm) it submits.
 */
export function ActionButton({ children, pendingLabel, disabled, className, ...rest }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      {...rest}
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`${className ?? ""} disabled:cursor-not-allowed disabled:opacity-40`.trim()}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
