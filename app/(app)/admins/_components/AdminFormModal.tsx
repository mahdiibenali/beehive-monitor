"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import {
  PhoneInput,
  DEFAULT_COUNTRIES,
  splitPhone,
  joinPhone,
  type Country,
} from "@/components/ui/PhoneInput";
import { Eye, EyeOff, Lock, Mail, User as UserIcon, Plus } from "@/lib/icons";

export interface AdminFormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
  avatarSrc: string;
}

interface AdminFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial?: Partial<AdminFormValues>;
  onSubmit: (values: AdminFormValues) => Promise<{ ok: boolean; error?: string }>;
}

const EMPTY: AdminFormValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  isActive: true,
  avatarSrc: "",
};

/**
 * Create / edit admin modal. In edit mode the password is optional —
 * leave it empty to keep the current password.
 */
export function AdminFormModal({
  open,
  onClose,
  mode,
  initial,
  onSubmit,
}: AdminFormModalProps) {
  const [values, setValues] = useState<AdminFormValues>(EMPTY);
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const next = { ...EMPTY, ...initial };
      setValues(next);
      const split = splitPhone(next.phone);
      setCountry(split.country);
      setPhoneNumber(split.number);
      setShowPassword(false);
      setError(null);
    }
  }, [open, initial]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await onSubmit({
        ...values,
        phone: joinPhone(country, phoneNumber),
      });
      if (!res.ok) {
        setError(res.error ?? "Une erreur est survenue.");
        return;
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  function set<K extends keyof AdminFormValues>(key: K, v: AdminFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  return (
    <Modal open={open} onClose={onClose} size="md" dismissable={!submitting}>
      <ModalHeader
        icon={<UserIcon className="h-4 w-4" />}
        onClose={onClose}
      >
        {mode === "create" ? "Nouvel administrateur" : "Modifier l'administrateur"}
      </ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          <div className="flex justify-center">
            <AvatarUpload
              value={values.avatarSrc}
              name={values.name}
              size="lg"
              disabled={submitting}
              onChange={(next) => set("avatarSrc", next)}
              onError={(msg) => setError(msg)}
            />
          </div>

          <Input
            label="Nom et prénom"
            placeholder="Nom complet"
            leftIcon={<UserIcon />}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            autoComplete="name"
            required
          />
          <Input
            label="Adresse Email"
            type="email"
            placeholder="exemple@nahoul.tn"
            leftIcon={<Mail />}
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            autoComplete="email"
            required
          />
          <PhoneInput
            label="Numéro de téléphone"
            country={country}
            onCountryChange={setCountry}
            value={phoneNumber}
            onChange={setPhoneNumber}
            disabled={submitting}
          />
          <Input
            label={
              mode === "edit"
                ? "Mot de passe (laisser vide pour conserver)"
                : "Mot de passe"
            }
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            leftIcon={<Lock />}
            value={values.password}
            onChange={(e) => set("password", e.target.value)}
            autoComplete="new-password"
            required={mode === "create"}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                className="flex h-4 w-4 items-center justify-center text-ink-400 transition-colors hover:text-brand-purple"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            }
          />
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-sm font-medium text-ink-800">Compte actif</p>
              <p className="text-xs text-ink-500">
                Désactivez pour empêcher la connexion sans supprimer le compte.
              </p>
            </div>
            <Switch
              checked={values.isActive}
              onChange={(v) => set("isActive", v)}
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-brand-orange">{error}</p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="!bg-ink-100 !text-ink-700 hover:!bg-ink-200"
          >
            Annuler
          </Button>
          <div className="flex-1" />
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            leftIcon={
              mode === "create" ? <Plus className="h-4 w-4" /> : undefined
            }
          >
            {submitting
              ? "Enregistrement…"
              : mode === "create"
              ? "Ajouter"
              : "Enregistrer"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
