"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { isExternalUrl, isOptimizableImageUrl, isSitePath } from "@/lib/urls";

/** Mirrors lib/admin/blob.ts (which is server-only because it imports the Blob SDK). */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,image/avif";

/**
 * Image URL field with an optional upload button. The submitted value is always the
 * text input named `name`: a path under /public (`/images/…`), an https URL, or, after
 * an upload, the Vercel Blob URL. Uploads go straight from the browser to Blob using a
 * token from /api/admin/upload, so `uploadEnabled` should reflect `blobConfigured`.
 */
export function ImageField({
  label,
  name,
  defaultValue = "",
  uploadEnabled,
  folder,
  errors,
  help,
  aspect = "square",
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  uploadEnabled: boolean;
  /** Blob folder under uploads/, e.g. "board" or "cards". */
  folder: string;
  errors?: string[];
  help?: string;
  aspect?: "square" | "landscape";
  className?: string;
}) {
  const id = useId();
  const inputId = `${id}-${name}`;
  const fileId = `${inputId}-file`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  const fileInput = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fieldErrors = [...(errors ?? []), ...(uploadError ? [uploadError] : [])];
  const hasErrors = fieldErrors.length > 0;
  const previewable = url !== "" && (isSitePath(url) || isExternalUrl(url));

  async function handleFile(file: File) {
    setUploadError(null);
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
      setUploadError("Choose a JPEG, PNG, WebP, GIF, or AVIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit is 10 MB.`);
      return;
    }
    const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
    setProgress(0);
    try {
      const blob = await upload(`uploads/${folder}/${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        onUploadProgress: (event) => setProgress(event.percentage),
      });
      setUrl(blob.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setProgress(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className={className}>
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
      <div className="flex flex-wrap items-start gap-4">
        <div
          className={`relative shrink-0 overflow-hidden rounded border border-asphalt/20 bg-neutral-100 ${
            aspect === "square" ? "h-32 w-32" : "h-24 w-32"
          }`}
        >
          {previewable ? (
            <Image
              src={url}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
              unoptimized={!isOptimizableImageUrl(url)}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-asphalt/60">
              {url ? "No preview" : "No image"}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            id={inputId}
            name={name}
            type="text"
            inputMode="url"
            className="field-input"
            placeholder="/images/… or https://…"
            value={url}
            onChange={(event) => setUrl(event.target.value.trim())}
            aria-invalid={hasErrors ? true : undefined}
            aria-describedby={hasErrors ? `${errorId} ${helpId}` : helpId}
          />
          <div className="flex flex-wrap items-center gap-3">
            {uploadEnabled ? (
              <>
                <label
                  htmlFor={fileId}
                  className="btn btn-secondary cursor-pointer px-3 py-1.5 text-sm tracking-wider"
                >
                  {progress === null ? "Upload image" : `Uploading… ${progress.toFixed(0)}%`}
                </label>
                <input
                  ref={fileInput}
                  id={fileId}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  className="sr-only"
                  disabled={progress !== null}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleFile(file);
                  }}
                />
              </>
            ) : null}
            {url ? (
              <button
                type="button"
                className="text-sm font-semibold text-red-700 underline"
                onClick={() => {
                  setUrl("");
                  setUploadError(null);
                }}
              >
                Remove image
              </button>
            ) : null}
          </div>
          <p id={helpId} className="text-sm text-asphalt/70">
            {help ??
              (uploadEnabled
                ? "Upload a JPEG, PNG, or WebP up to 10 MB, or paste an image address."
                : "Paste an image address. Uploads are unavailable until BLOB_READ_WRITE_TOKEN is set.")}
          </p>
          {hasErrors ? (
            <p id={errorId} className="text-sm font-semibold text-red-700">
              {fieldErrors.join(" ")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
