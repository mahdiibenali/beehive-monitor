"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { MapPin, X } from "@/lib/icons";
import { formatFR } from "@/lib/calendar";
import { cn } from "@/lib/cn";

/**
 * Same Leaflet wrapper used by the apiculteur drawer, lazy-loaded so it
 * never runs during SSR. Import indirectly to avoid pulling Leaflet into
 * the modal's static bundle.
 */
const FermesMap = dynamic(
  () =>
    import("@/app/(app)/apiculteurs/_components/FermesMap").then(
      (m) => m.FermesMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[2/1] w-full items-center justify-center rounded-2xl bg-ink-50 text-xs text-ink-400">
        Chargement de la carte…
      </div>
    ),
  }
);

interface PreviewFerme {
  id: string;
  name: string;
  rucheCount: number;
  address: string;
  plusCode: string;
  lat: number | null;
  lng: number | null;
}

export interface UserProfilePreview {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarSrc: string;
  phone: string;
  region: string;
  isActive: boolean;
  memberSince: string | null;
  /** Only present for apiculteurs. */
  rucheCount?: number;
  fermeCount?: number;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  fermes?: PreviewFerme[];
}

interface UserProfilePreviewModalProps {
  open: boolean;
  userId: string | null;
  /** Author info from the surrounding context (reply / row) — shown as a
   *  fast initial paint while the full profile loads from the API. */
  fallback?: {
    name?: string;
    role?: string;
    avatarSrc?: string;
  };
  onClose: () => void;
}

function initialsOf(name: string) {
  return (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function roleLabel(role: string): string {
  switch (role) {
    case "super-admin":
      return "Super administrateur";
    case "admin":
      return "Administrateur";
    case "apiculteur":
      return "Apiculteur";
    default:
      return role || "Utilisateur";
  }
}

/**
 * Read-only profile drawer opened by clicking on a sender's avatar in
 * the maintenance reply thread.
 *
 * Layout mirrors the management drawer (`ApiculteurDetailDrawer`):
 *   • hero header
 *   • Ruches / Fermes / Inscription stat row (apiculteur only)
 *   • map of fermes (apiculteur only)
 *   • email + phone summary
 *   • read-only fermes table (apiculteur only)
 *
 * Strictly read-only: no status pill, no edit/delete actions on fermes,
 * just a single "Fermer" button in the footer. Admins see a compact
 * variant without the apiculteur-specific sections.
 */
export function UserProfilePreviewModal({
  open,
  userId,
  fallback,
  onClose,
}: UserProfilePreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfilePreview | null>(null);

  // Fetch the profile each time we open with a new user id.
  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProfile(null);

    fetch(`/api/users/${userId}/profile-preview`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          profile?: UserProfilePreview;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.profile) {
          setError(data.error ?? "Profil indisponible.");
          return;
        }
        setProfile(data.profile);
      })
      .catch(() => {
        if (!cancelled) setError("Erreur réseau.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Resolve display fields, preferring the fetched profile but falling
  // back to whatever we were handed (so the drawer feels instant).
  const displayName = profile?.name || fallback?.name || "Utilisateur";
  const displayRole = profile?.role || fallback?.role || "";
  const displayAvatar = profile?.avatarSrc || fallback?.avatarSrc || "";
  const isApiculteur = displayRole === "apiculteur";

  return (
    <div
      className={cn(
        // Sits above the maintenance drawer (z-50) so the preview lands on top.
        "fixed inset-0 z-[60]",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink-900/40 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Sliding panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Profil de ${displayName}`}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Hero header — sandy gradient, identical to apiculteur drawer */}
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F5EFE0] via-[#F8F6EF] to-white" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-ink-600 transition-colors hover:bg-white hover:text-brand-purple"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative flex items-center gap-3 px-6 pb-5 pt-12">
            <Avatar
              initials={initialsOf(displayName)}
              src={
                displayAvatar && displayAvatar !== "/brand/avatar-sample.svg"
                  ? displayAvatar
                  : undefined
              }
              alt={displayName}
              size="lg"
            />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-ink-900">
                {displayName}
              </h2>
              {displayRole && (
                <span
                  className={cn(
                    "mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    displayRole === "super-admin"
                      ? "bg-primary-50 text-brand-purple"
                      : displayRole === "admin"
                      ? "bg-accent-50 text-[#9B5A1F]"
                      : "bg-white/80 text-ink-700"
                  )}
                >
                  {roleLabel(displayRole)}
                </span>
              )}
              {profile && !profile.isActive && (
                <span className="ml-1 inline-flex items-center rounded-full bg-brand-orange/10 px-2 py-0.5 text-[11px] font-medium text-brand-orange">
                  Compte désactivé
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Initial loading & error states */}
          {loading && !profile && (
            <p className="mt-6 text-center text-xs text-ink-400">
              Chargement du profil…
            </p>
          )}
          {error && !loading && (
            <p className="mt-6 text-center text-xs font-medium text-brand-orange">
              {error}
            </p>
          )}

          {profile && (
            <>
              {/* Apiculteur-specific rich view */}
              {isApiculteur ? (
                <>
                  {/* Stats row */}
                  <div className="-mt-2 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-ink-100">
                    <StatCell
                      label="Ruches"
                      value={String(profile.rucheCount ?? 0).padStart(2, "0")}
                    />
                    <StatCell
                      label="Fermes"
                      value={String(profile.fermeCount ?? 0).padStart(2, "0")}
                    />
                    <StatCell
                      label="Inscription"
                      value={
                        profile.memberSince
                          ? formatFR(new Date(profile.memberSince))
                          : "—"
                      }
                    />
                  </div>

                  {/* Map */}
                  <section className="mt-6">
                    <header className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-ink-900">
                        Répartitions géographique
                      </h3>
                      {(profile.region || profile.address) && (
                        <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                          <MapPin className="h-3.5 w-3.5" />
                          {profile.region || profile.address}
                        </span>
                      )}
                    </header>
                    <FermesMap
                      fermes={profile.fermes ?? []}
                      fallbackLat={profile.lat ?? null}
                      fallbackLng={profile.lng ?? null}
                      className="aspect-[2/1]"
                    />
                  </section>

                  {/* Email + phone */}
                  <section className="mt-6 grid grid-cols-2 gap-4">
                    <ContactCell label="Email" value={profile.email} />
                    <ContactCell
                      label="Numéro de téléphone"
                      value={profile.phone || "—"}
                    />
                  </section>

                  {/* Fermes table — strictly read-only */}
                  {profile.fermes && profile.fermes.length > 0 && (
                    <section className="mt-6">
                      <h3 className="mb-3 text-sm font-semibold text-ink-900">
                        Fermes
                      </h3>
                      <div className="overflow-hidden rounded-2xl border border-ink-100">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-ink-50 text-[11px] uppercase tracking-wide text-ink-400">
                              <th className="px-4 py-2 text-left font-semibold">
                                Ferme
                              </th>
                              <th className="px-4 py-2 text-left font-semibold">
                                Ruches
                              </th>
                              <th className="px-4 py-2 text-left font-semibold">
                                Localisation
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ink-100">
                            {profile.fermes.map((f) => (
                              <tr key={f.id || f.name}>
                                <td className="px-4 py-2.5 font-medium text-ink-800">
                                  {f.name || "—"}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-brand-purple">
                                    {String(f.rucheCount ?? 0).padStart(2, "0")}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-ink-600">
                                  {f.plusCode || f.address || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                </>
              ) : (
                // Admin / super-admin: simple two-column contact card.
                <section className="mt-2 grid grid-cols-2 gap-4">
                  {profile.email && (
                    <ContactCell label="Email" value={profile.email} />
                  )}
                  {profile.phone && (
                    <ContactCell
                      label="Numéro de téléphone"
                      value={profile.phone}
                    />
                  )}
                  {profile.region && (
                    <ContactCell label="Région" value={profile.region} />
                  )}
                  {profile.memberSince && (
                    <ContactCell
                      label="Membre depuis"
                      value={formatFR(new Date(profile.memberSince))}
                    />
                  )}
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer — read-only: a single Close button. */}
        <footer className="border-t border-ink-100 bg-white px-6 py-4">
          <Button variant="ghost" size="md" onClick={onClose} fullWidth>
            Fermer
          </Button>
        </footer>
      </aside>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-ink-900">{value}</p>
    </div>
  );
}

function ContactCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.06em] text-ink-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-ink-800">{value}</p>
    </div>
  );
}
