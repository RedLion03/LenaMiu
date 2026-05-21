"use client";

import type { ReactNode } from "react";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  confirm: string;
  className?: string;
  children: ReactNode;
};

/**
 * Tiny wrapper around <form> that fires window.confirm() before submitting.
 * Lives in its own client component so server-rendered admin pages can use
 * it without flipping to client — onSubmit handlers need a client boundary.
 */
export function ConfirmForm({
  action,
  confirm: message,
  className,
  children,
}: Props) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
