"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  /** Text shown alongside the spinner while submitting. */
  pendingLabel?: string;
  /** Pixel size of the spinner. Defaults to 14. */
  spinnerSize?: number;
  /** Fully override the pending render (overrides pendingLabel/spinnerSize). */
  pendingContent?: ReactNode;
};

export function SubmitButton({
  children,
  pendingLabel,
  spinnerSize = 14,
  pendingContent,
  disabled,
  className,
  ...rest
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      className={className}
      {...rest}
    >
      {pending
        ? (pendingContent ?? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 size={spinnerSize} className="animate-spin" aria-hidden />
              {pendingLabel ?? children}
            </span>
          ))
        : children}
    </button>
  );
}
