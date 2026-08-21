"use client";

import { ReactNode } from "react";
import { ArrowUpDown, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Checkbox } from "./Checkbox";
import { Avatar } from "./Avatar";
import { StatusBadge, type StatusVariant } from "./StatusBadge";

interface TableProps {
  children: ReactNode;
  className?: string;
}

/** Wrapping card. Use with <TableFooter /> for an integrated pagination row. */
export function Table({ children, className }: TableProps) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-[18px] border border-ink-100 bg-white shadow-card",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          {children}
        </table>
      </div>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-ink-100">{children}</tr>
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  selected?: boolean;
  onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
  onDoubleClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
}

export function TableRow({
  children,
  className,
  selected,
  onClick,
  onDoubleClick,
}: TableRowProps) {
  return (
    <tr
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        "border-b border-ink-100 transition-colors last:border-b-0",
        selected ? "bg-primary-50/60" : "hover:bg-ink-50/60",
        className
      )}
    >
      {children}
    </tr>
  );
}

interface ThProps {
  children?: ReactNode;
  sortable?: boolean;
  className?: string;
}

export function Th({ children, sortable, className }: ThProps) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500",
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        {sortable && <ArrowUpDown className="h-3 w-3 text-ink-400" />}
      </span>
    </th>
  );
}

interface TdProps {
  children?: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
  colSpan?: number;
}

export function Td({ children, className, onClick, colSpan }: TdProps) {
  return (
    <td
      onClick={onClick}
      colSpan={colSpan}
      className={cn("whitespace-nowrap px-4 py-3.5 text-sm text-ink-800", className)}
    >
      {children}
    </td>
  );
}

/** Footer row inside the table card — typically holds Pagination + summary */
export function TableFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 px-4 py-3">
      {children}
    </div>
  );
}

/** Table search — pill input with magnifying glass */
export function TableSearch({
  value,
  onChange,
  placeholder = "Placeholder",
  className,
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-9 max-w-xs items-center gap-2 rounded-full border border-ink-200 bg-white px-4",
        className
      )}
    >
      <svg className="h-4 w-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3-3" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
      />
    </div>
  );
}

export function CellText({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <div className="font-semibold text-ink-900">{children}</div>
      {sub && <div className="text-xs text-ink-500">{sub}</div>}
    </div>
  );
}

export function CellCheckbox({
  checked,
  onChange,
  label,
}: {
  checked?: boolean;
  onChange?: (v: boolean) => void;
  label?: string;
}) {
  return (
    <Checkbox
      label={label}
      checked={checked}
      onChange={(e) => onChange?.(e.target.checked)}
    />
  );
}

export function CellAvatar({
  initials = "ON",
  label,
  src,
  /**
   * When provided, the avatar becomes a focusable button. Used to open
   * a profile preview modal without affecting the surrounding row click.
   */
  onAvatarClick,
  avatarTitle,
}: {
  initials?: string;
  label?: string;
  src?: string;
  onAvatarClick?: () => void;
  avatarTitle?: string;
}) {
  const avatar = <Avatar initials={initials} src={src} size="sm" />;
  return (
    <div className="flex items-center gap-3">
      {onAvatarClick ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAvatarClick();
          }}
          title={avatarTitle}
          aria-label={avatarTitle ?? "Voir le profil"}
          className="rounded-full outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2"
        >
          {avatar}
        </button>
      ) : (
        avatar
      )}
      {label && <span className="text-sm font-medium text-ink-800">{label}</span>}
    </div>
  );
}

export function CellStatus({ variant }: { variant: StatusVariant }) {
  return <StatusBadge variant={variant} />;
}

export function CellNumber({ n }: { n: number }) {
  return (
    <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-lg bg-primary-50 px-2 text-xs font-semibold text-brand-purple">
      {String(n).padStart(2, "0")}
    </span>
  );
}

/** Three action icons: edit, delete, restore — all in soft orange */
export function CellActions({
  onEdit,
  onDelete,
  onRestore,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 text-brand-orange">
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit"
        className="transition-opacity hover:opacity-70"
      >
        <Pencil className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete"
        className="transition-opacity hover:opacity-70"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        onClick={onRestore}
        aria-label="Restore"
        className="text-ink-400 transition-opacity hover:opacity-70"
      >
        <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
