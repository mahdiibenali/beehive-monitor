"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Eye, EyeOff, Lock, User as UserIcon } from "@/lib/icons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { Confirmation } from "@/components/ui/Modal";
import {
  PhoneInput,
  DEFAULT_COUNTRIES,
  splitPhone,
  joinPhone,
  type Country,
} from "@/components/ui/PhoneInput";
import { useCurrentUser, type CurrentUser } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/cn";

interface UserProfilePopoverProps {
  open: boolean;
  onClose: () => void;
}

interface ProfilePayload {
  name?: string;
  phone?: string;
  password?: string;
  oldPassword?: string;
  avatarSrc?: string;
}

/**
 * Floating profile editor anchored to the bottom-left of the screen
 * (just to the right of the sidebar's user card). Click outside or
 * press Escape to dismiss.
 *
 * Closely matches the Figma popover: avatar with edit badge, read-only
 * email + phone, editable name + password, full-width save button.
 *
 * When the user changes their password we require the current one and
 * surface a confirmation modal before patching the account.
 */
export function UserProfilePopover({ open, onClose }: UserProfilePopoverProps) {
  const { user, refresh } = useCurrentUser();
  const cardRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState(user.name);
  const initialSplit = splitPhone(user.phone);
  const [country, setCountry] = useState<Country>(initialSplit.country);
  const [phoneNumber, setPhoneNumber] = useState(initialSplit.number);
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Pending payload waiting for confirmation when a password change is requested.
  const [pendingPayload, setPendingPayload] = useState<ProfilePayload | null>(
    null
  );

  function resetFields() {
    setName(user.name);
    const split = splitPhone(user.phone);
    setCountry(split.country);
    setPhoneNumber(split.number);
    setOldPassword("");
    setPassword("");
    setShowOld(false);
    setShowNew(false);
    setError(null);
  }

  // Reset form fields whenever the popover opens or the user changes.
  useEffect(() => {
    if (open) resetFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user.name, user.phone]);

  // Escape to close (only when no confirmation modal is in front).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pendingPayload) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, pendingPayload]);

  async function submitPayload(
    payload: ProfilePayload,
    options?: { closeOnSuccess?: boolean; successMessage?: string }
  ): Promise<{ ok: boolean; error?: string }> {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        user?: CurrentUser;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la mise à jour.");
        setPendingPayload(null);
        return { ok: false, error: data.error };
      }
      await refresh();
      setToast(
        options?.successMessage ??
          (payload.password
            ? "Mot de passe modifié avec succès !"
            : "Profil mis à jour !")
      );
      setOldPassword("");
      setPassword("");
      setPendingPayload(null);
      const shouldClose = options?.closeOnSuccess ?? true;
      window.setTimeout(() => {
        setToast(null);
        if (shouldClose) onClose();
      }, 1200);
      return { ok: true };
    } catch {
      setError("Erreur réseau. Réessayez.");
      setPendingPayload(null);
      return { ok: false, error: "network" };
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAvatarChange(next: string) {
    await submitPayload(
      { avatarSrc: next },
      {
        closeOnSuccess: false,
        successMessage: next ? "Photo mise à jour !" : "Photo supprimée.",
      }
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const trimmedName = name.trim();
    const nextPhone = joinPhone(country, phoneNumber);
    const currentPhone = user.phone ?? "";
    const wantsPasswordChange = password.length > 0;

    const payload: ProfilePayload = {};
    if (trimmedName !== user.name) payload.name = trimmedName;
    if (nextPhone !== currentPhone) payload.phone = nextPhone;
    if (wantsPasswordChange) {
      payload.password = password;
      payload.oldPassword = oldPassword;
    }

    if (Object.keys(payload).length === 0) {
      setToast("Aucune modification.");
      window.setTimeout(() => setToast(null), 2000);
      return;
    }

    if (wantsPasswordChange) {
      if (!oldPassword) {
        setError("Veuillez saisir votre mot de passe actuel.");
        return;
      }
      if (password.length < 6) {
        setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
        return;
      }
      if (oldPassword === password) {
        setError("Le nouveau mot de passe doit être différent de l'ancien.");
        return;
      }
      // Defer to confirmation modal.
      setError(null);
      setPendingPayload(payload);
      return;
    }

    void submitPayload(payload);
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop — click anywhere outside to dismiss */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden
      />

      {/* Popover card. Two responsive layouts:
          • Mobile (< lg): pinned to the bottom of the viewport, full-width
            (minus a 16px gutter) — behaves like a bottom sheet.
          • Desktop (≥ lg): floating card anchored just past the sidebar
            (~ p-5 + sidebar width 220px + a small gap). */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mon profil"
        className={cn(
          "animate-fade-in-up fixed z-50 rounded-[24px] bg-white p-6 shadow-pop",
          // Mobile placement & sizing
          "inset-x-4 bottom-4 max-h-[calc(100vh-2rem)] overflow-y-auto",
          // Desktop placement & sizing
          "lg:inset-x-auto lg:bottom-24 lg:left-[260px] lg:right-auto lg:max-h-none lg:w-[360px] lg:overflow-visible"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Avatar — clicking the pencil opens the OS file picker and
              persists the new photo immediately. */}
          <AvatarUpload
            value={
              user.avatarSrc && user.avatarSrc !== "/brand/avatar-sample.svg"
                ? user.avatarSrc
                : ""
            }
            name={user.name}
            size="lg"
            disabled={submitting}
            onChange={handleAvatarChange}
            onError={(msg) => setError(msg)}
          />

          {/* Email (read-only — change requires an admin) */}
          <div className="mt-4">
            <p className="text-xs text-ink-500">Email</p>
            <p className="text-sm font-semibold text-ink-900">{user.email}</p>
          </div>

          {/* Name input */}
          <div className="mt-4 space-y-1.5">
            <label
              htmlFor="profile-name"
              className="block text-sm font-semibold text-ink-800"
            >
              Nom et prénom
            </label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<UserIcon />}
              placeholder="Nom complet"
              autoComplete="name"
            />
          </div>

          {/* Phone input — flag picker + national number */}
          <div className="mt-3">
            <PhoneInput
              label="Numéro de téléphone"
              country={country}
              onCountryChange={setCountry}
              value={phoneNumber}
              onChange={setPhoneNumber}
              countries={DEFAULT_COUNTRIES}
              disabled={submitting}
            />
          </div>

          {/* New password input */}
          <div className="mt-3 space-y-1.5">
            <label
              htmlFor="profile-password"
              className="block text-sm font-semibold text-ink-800"
            >
              Mot de passe
            </label>
            <Input
              id="profile-password"
              type={showNew ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock />}
              placeholder="Nouveau mot de passe"
              autoComplete="new-password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={
                    showNew
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  className="flex h-4 w-4 items-center justify-center text-ink-400 transition-colors hover:text-brand-purple"
                >
                  {showNew ? <EyeOff /> : <Eye />}
                </button>
              }
            />
          </div>

          {/* Old password input — shown only once user starts typing a new one */}
          {password.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <label
                htmlFor="profile-old-password"
                className="block text-sm font-semibold text-ink-800"
              >
                Ancien mot de passe
              </label>
              <Input
                id="profile-old-password"
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                leftIcon={<Lock />}
                placeholder="Mot de passe actuel"
                autoComplete="current-password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowOld((v) => !v)}
                    aria-label={
                      showOld
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    className="flex h-4 w-4 items-center justify-center text-ink-400 transition-colors hover:text-brand-purple"
                  >
                    {showOld ? <EyeOff /> : <Eye />}
                  </button>
                }
              />
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs font-medium text-brand-orange">
              {error}
            </p>
          )}

          {/* Save */}
          <div className="mt-5">
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              fullWidth
              disabled={submitting}
            >
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </div>

      {/* Confirmation modal — only when changing the password */}
      <Confirmation
        open={!!pendingPayload}
        onClose={() => !submitting && setPendingPayload(null)}
        variant="danger"
        icon={<Lock className="h-5 w-5" />}
        title="Modifier le mot de passe ?"
        description="Votre mot de passe sera remplacé immédiatement. Utilisez le nouveau mot de passe à votre prochaine connexion."
        secondaryLabel="Annuler"
        primaryLabel={submitting ? "Mise à jour…" : "Modifier"}
        loading={submitting}
        onPrimary={() => pendingPayload && submitPayload(pendingPayload)}
      />

      {/* Toast — bottom-right, same style as the login page */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] animate-fade-in-up">
          <Alert
            variant="success"
            title={toast}
            compact
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </>
  );
}
