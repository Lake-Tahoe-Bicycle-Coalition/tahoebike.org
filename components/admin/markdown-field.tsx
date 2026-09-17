"use client";

import { useId, useState } from "react";
import { Markdown } from "@/lib/markdown";

/**
 * Textarea for the Markdown subset lib/markdown.tsx renders (paragraphs, **bold**,
 * *italic*, [links](https://…), "- " bullets), with a live preview toggle. No WYSIWYG.
 */
export function MarkdownField({
  label,
  name,
  defaultValue = "",
  errors,
  rows = 8,
  maxLength = 5000,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  errors?: string[];
  rows?: number;
  maxLength?: number;
  className?: string;
}) {
  const id = useId();
  const inputId = `${id}-${name}`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  const hasErrors = errors !== undefined && errors.length > 0;

  return (
    <div className={className}>
      <div className="mb-1 flex items-end justify-between gap-4">
        <label htmlFor={inputId} className="field-label mb-0">
          {label}
        </label>
        <button
          type="button"
          className="text-sm font-semibold text-tahoe-deep underline"
          aria-pressed={preview}
          onClick={() => setPreview((current) => !current)}
        >
          {preview ? "Edit" : "Preview"}
        </button>
      </div>
      {preview ? (
        <div
          className="prose-ltbc min-h-24 rounded border border-asphalt/40 bg-neutral-50 px-3 py-2"
          aria-live="polite"
        >
          {value.trim() ? <Markdown source={value} /> : <p className="text-asphalt/60">Nothing to preview yet.</p>}
        </div>
      ) : null}
      {/* The textarea stays mounted while previewing so its value is always submitted. */}
      <textarea
        id={inputId}
        name={name}
        rows={rows}
        maxLength={maxLength}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className={preview ? "sr-only" : "field-input font-mono text-sm"}
        aria-invalid={hasErrors ? true : undefined}
        aria-describedby={hasErrors ? `${errorId} ${helpId}` : helpId}
      />
      <p id={helpId} className="mt-1 text-sm text-asphalt/70">
        Formatting: blank line between paragraphs, **bold**, *italic*, [link text](https://…), and
        lines starting with “- ” for bullets. {value.length.toLocaleString()} / {maxLength.toLocaleString()}{" "}
        characters.
      </p>
      {hasErrors ? (
        <p id={errorId} className="mt-1 text-sm font-semibold text-red-700">
          {errors.join(" ")}
        </p>
      ) : null}
    </div>
  );
}
