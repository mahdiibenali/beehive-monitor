import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/cn";
import { getCurrentUser } from "@/lib/auth/current-user";
import { LogoutButton } from "./LogoutButton";

interface LandingNavbarProps {
  /**
   * Visual tone:
   *   • `overlay` — sits on top of the hero photo (white logo + frosted band)
   *   • `light`   — solid page header on lavender / cream backgrounds
   */
  tone?: "overlay" | "light";
  /** Where the "Contact" pill should jump to (anchor on landing, route elsewhere). */
  contactHref?: string;
  /** Optional className for the wrapper (positioning, z-index, etc.). */
  className?: string;
}

const PILL_LAVENDER = cn(
  "inline-flex h-10 items-center justify-center rounded-pill px-4 text-sm font-semibold text-white md:px-5",
  "bg-primary-300 shadow-[0_4px_14px_rgba(140,127,237,0.35)]",
  "transition-colors hover:bg-primary-400"
);

const PILL_PRIMARY = cn(
  "inline-flex h-10 items-center justify-center rounded-pill px-4 text-sm font-semibold text-white md:px-5",
  "bg-brand-orange shadow-[0_4px_14px_rgba(255,163,60,0.45)]",
  "transition-colors hover:bg-brand-orange-hover"
);

export async function LandingNavbar({
  tone = "overlay",
  contactHref = "/contact",
  className,
}: LandingNavbarProps) {
  const session = await getCurrentUser();
  const isAuthenticated = Boolean(session);

  const isOverlay = tone === "overlay";

  return (
    <header
      className={cn(
        "z-20 flex items-center justify-between px-5 py-5 md:px-8 md:py-6",
        isOverlay
          ? "absolute inset-x-0 top-0 border-b border-white/10 bg-white/5 backdrop-blur-sm"
          : "relative bg-transparent",
        className
      )}
    >
      <Logo
        href="/"
        variant={isOverlay ? "white" : "full"}
        width={70}
        height={18}
        className={cn(
          isOverlay
            ? "drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]"
            : undefined
        )}
      />
      <nav
        className="flex items-center gap-2 md:gap-3"
        aria-label="Navigation principale"
      >
        {isAuthenticated ? (
          <>
            <Link href={contactHref} className={PILL_LAVENDER}>
              Contact
            </Link>
            <Link href="/dashboard" className={PILL_PRIMARY}>
              Accueil
            </Link>
            <LogoutButton className={PILL_LAVENDER} redirectTo="/" />
          </>
        ) : (
          <>
            <Link href={contactHref} className={PILL_LAVENDER}>
              Contact
            </Link>
            <Link href="/login" className={PILL_PRIMARY}>
              Se connecter
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
