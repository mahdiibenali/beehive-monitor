"use client";

import {
  ReactNode,
  useEffect,
  useRef,
  MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ModalSize = "sm" | "md" | "lg";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  children: ReactNode;
  className?: string;
  /** Disable closing on overlay click */
  dismissable?: boolean;
}

const sizes: Record<ModalSize, string> = {
  sm: "w-[420px]",
  md: "w-[480px]",
  lg: "w-[560px]",
};

export function Modal({
  open,
  onClose,
  size = "md",
  children,
  className,
  dismissable = true,
}: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && dismissable) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, dismissable]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  function handleOverlay(e: ReactMouseEvent<HTMLDivElement>) {
    if (!dismissable) return;
    if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
      onClose();
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={handleOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-[2px]"
    >
      <div
        ref={cardRef}
        className={cn(
          "flex max-h-[90vh] flex-col overflow-hidden rounded-[20px] bg-white shadow-pop",
          sizes[size],
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

interface ModalHeaderProps {
  children?: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
  align?: "start" | "center";
  className?: string;
  separator?: boolean;
}

export function ModalHeader({
  children,
  icon,
  onClose,
  align = "start",
  className,
  separator = true,
}: ModalHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-6 py-4",
        align === "center" && "justify-center text-center",
        separator && "border-b border-ink-100",
        className
      )}
    >
      {icon && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-brand-purple">
          {icon}
        </span>
      )}
      <h3
        className={cn(
          "flex-1 text-base font-semibold text-ink-900",
          align === "center" && "text-center"
        )}
      >
        {children}
      </h3>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto px-6 py-5",
        className
      )}
    >
      {children}
    </div>
  );
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
  separator?: boolean;
}

export function ModalFooter({
  children,
  className,
  separator = true,
}: ModalFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-6 py-4",
        separator && "border-t border-ink-100",
        className
      )}
    >
      {children}
    </div>
  );
}

export type ConfirmationVariant = "default" | "danger";

interface ConfirmationProps {
  open: boolean;
  onClose: () => void;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  primaryIcon?: ReactNode;
  /**
   * Visual tone:
   *   • "default" (purple icon + primary button) for confirmations.
   *   • "danger"  (orange icon + primary button) for destructive actions
   *     like sign-out, account deletion or password change.
   */
  variant?: ConfirmationVariant;
  /** Disable the primary button (useful when a parent is mid-submit). */
  loading?: boolean;
}

/**
 * Confirmation dialog matching the Nahoul kit:
 *   • Rounded-square icon (40×40) in purple or orange
 *   • Title + description, close button top-right
 *   • Separator before the footer
 *   • "Annuler" (soft lavender) + primary action button (colored)
 */
export function Confirmation({
  open,
  onClose,
  icon,
  title,
  description,
  primaryLabel = "Confirmer",
  secondaryLabel = "Annuler",
  onPrimary,
  onSecondary,
  primaryIcon,
  variant = "default",
  loading = false,
}: ConfirmationProps) {
  const tone = TONE[variant];

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="flex items-start gap-4 px-6 pt-6 pb-5">
        {icon && (
          <span
            className={cn(
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-white",
              tone.iconBg
            )}
          >
            {icon}
          </span>
        )}
        <div className="flex-1 pt-0.5">
          <h3 className="text-base font-semibold text-ink-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm leading-snug text-ink-500">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-ink-100 px-6 py-4">
        <button
          type="button"
          onClick={onSecondary ?? onClose}
          className="inline-flex h-10 items-center rounded-full bg-primary-50 px-5 text-sm font-medium text-ink-500 transition-colors hover:bg-primary-100 hover:text-ink-700"
        >
          {secondaryLabel}
        </button>
        <button
          type="button"
          onClick={onPrimary}
          disabled={loading}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70",
            tone.primary
          )}
        >
          {primaryIcon}
          {primaryLabel}
        </button>
      </div>
    </Modal>
  );
}

const TONE: Record<
  ConfirmationVariant,
  { iconBg: string; primary: string }
> = {
  default: {
    iconBg: "bg-brand-purple",
    primary:
      "bg-brand-purple hover:bg-brand-purple-hover active:bg-brand-purple-pressed",
  },
  danger: {
    iconBg: "bg-brand-orange",
    primary:
      "bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-pressed",
  },
};
