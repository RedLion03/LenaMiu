"use client";

import type { Recipient } from "@/lib/supabase/database.types";

type Props = {
  defaultValue?: Recipient;
  label?: string;
};

const OPTIONS: { value: Recipient; label: string; accent: string }[] = [
  { value: "lena", label: "lena", accent: "accent-sky-deep" },
  { value: "miu", label: "miu", accent: "accent-pink-deep" },
  { value: "both", label: "both", accent: "accent-ink" },
];

/**
 * Plain native radio group asking who the submission is for. No pill
 * styling — the goal is to look like a quick, conventional choice instead
 * of competing with the other buttons on the page.
 */
export function RecipientField({
  defaultValue = "both",
  label = "for whom",
}: Props) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-xs uppercase tracking-widest text-ink-2">
        {label}
      </legend>
      <div className="flex flex-wrap items-center gap-5 pt-1">
        {OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2 text-sm text-ink hover:text-ink-2"
          >
            <input
              type="radio"
              name="recipient"
              value={opt.value}
              defaultChecked={defaultValue === opt.value}
              className={`size-4 ${opt.accent}`}
            />
            {opt.label?.toUpperCase()}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
