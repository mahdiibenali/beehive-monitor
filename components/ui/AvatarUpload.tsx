"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Pencil, Trash2 } from "@/lib/icons";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/cn";
import { AvatarError, fileToAvatarDataUrl } from "@/lib/image";

interface AvatarUploadProps {
  /** Current avatar source: data URI, absolute URL, or `/public` path. Empty string = no image. */
  value: string;
  /** Receives the resized data URI (or "" when the user clears). */
  onChange: (next: string) => void | Promise<void>;
  /** Used for initials fallback when no image is set. */
  name?: string;
  size?: "md" | "lg";
  disabled?: boolean;
  className?: string;
  /** Optional callback to surface processing errors to the parent's UI. */
  onError?: (message: string) => void;
}

/**
 * Avatar with a pencil edit-badge in the corner. Clicking the badge opens
 * the OS file picker; the picked image is resized client-side to a square
 * data URI and passed back via `onChange`. The parent decides whether to
 * persist immediately or stage it (e.g. inside a form).
 */
export function AvatarUpload({
  value,
  onChange,
  name = "",
  size = "lg",
  disabled = false,
  className,
  onError,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file || disabled) return;
    setProcessing(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      await onChange(dataUrl);
    } catch (err) {
      const msg =
        err instanceof AvatarError
          ? err.message
          : "Impossible de charger l'image.";
      onError?.(msg);
    } finally {
      setProcessing(false);
    }
  }

  function handleClear() {
    if (disabled || processing) return;
    void onChange("");
  }

  const showRemove = !!value && !value.startsWith("/brand/avatar-sample");

  return (
    <div className={cn("relative inline-flex", className)}>
      <Avatar
        initials={initials || "?"}
        src={value || undefined}
        size={size}
        className={cn(processing && "opacity-60")}
      />

      {processing && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-white/40">
          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-brand-purple border-r-transparent" />
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
        disabled={disabled || processing}
      />

      <button
        type="button"
        aria-label="Changer la photo"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || processing}
        className={cn(
          "absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-orange text-white shadow-card transition-colors",
          "hover:bg-brand-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
      </button>

      {showRemove && (
        <button
          type="button"
          aria-label="Supprimer la photo"
          onClick={handleClear}
          disabled={disabled || processing}
          className={cn(
            "absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink-500 shadow-card transition-colors",
            "hover:text-brand-orange disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          <Trash2 className="h-3 w-3" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
