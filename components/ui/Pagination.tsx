"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** e.g. "1-9 sur 90" — when provided, shown on the left */
  summary?: string;
  /** Wrap in a white card with shadow (standalone Web-Pagination style) */
  card?: boolean;
  size?: "sm" | "md";
  className?: string;
}

function PageButton({
  n,
  active,
  onClick,
  size,
}: {
  n: number | string;
  active?: boolean;
  onClick?: () => void;
  size: "sm" | "md";
}) {
  if (n === "...") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center text-ink-400",
          size === "sm" ? "h-7 px-1 text-xs" : "h-8 px-2 text-sm"
        )}
      >
        ...
      </span>
    );
  }

  const formatted = String(n).padStart(2, "0");

  if (active) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-current="page"
        className={cn(
          "inline-flex items-center justify-center rounded-lg bg-brand-purple font-semibold text-white",
          size === "sm" ? "h-7 min-w-[1.75rem] px-2 text-xs" : "h-8 min-w-[2rem] px-2.5 text-sm"
        )}
      >
        {formatted}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center font-medium text-ink-700 transition-colors hover:text-brand-purple",
        size === "sm" ? "h-7 min-w-[1.75rem] px-1 text-xs" : "h-8 min-w-[2rem] px-2 text-sm"
      )}
    >
      {formatted}
    </button>
  );
}

function buildPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  ) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  summary,
  card,
  size = "md",
  className,
}: PaginationProps) {
  const pages = buildPages(page, totalPages);

  const nav = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-ink-700 transition-colors hover:text-brand-purple disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-ink-700"
      >
        <ChevronLeft className="h-4 w-4" />
        Précédent
      </button>
      {pages.map((p, i) => (
        <PageButton
          key={`${p}-${i}`}
          n={p}
          active={p === page}
          onClick={() => typeof p === "number" && onPageChange(p)}
          size={size}
        />
      ))}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-ink-700 transition-colors hover:text-brand-purple disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-ink-700"
      >
        Suivant
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  if (size === "sm" && !summary && !card) return nav;

  const inner = (
    <div
      className={cn(
        "flex flex-wrap items-center gap-6",
        summary && "justify-between",
        className
      )}
    >
      {summary && <span className="text-sm text-ink-600">{summary}</span>}
      {nav}
    </div>
  );

  if (card) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-white px-5 py-3 shadow-card">
        {inner}
      </div>
    );
  }

  return inner;
}
