"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";

type AvatarSize = "sm" | "md" | "lg";

const sizes: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

interface AvatarProps {
  /** Initials shown when no image (e.g. "ON") */
  initials?: string;
  src?: string;
  alt?: string;
  size?: AvatarSize;
  badge?: ReactNode;
  className?: string;
}

/**
 * Profile avatar. Renders a plain `<img>` so it natively supports data URIs
 * (uploaded photos) in addition to URLs and `/public/` paths.
 */
export function Avatar({
  initials,
  src,
  alt = "",
  size = "md",
  badge,
  className,
}: AvatarProps) {
  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-full bg-brand-purple font-semibold text-white",
          sizes[size]
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          initials
        )}
      </div>
      {badge && (
        <span className="absolute -bottom-0.5 -right-0.5">{badge}</span>
      )}
    </div>
  );
}
