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
import { Layers, MapPin, Plus, TriangleAlert, Wheat } from "@/lib/icons";

export interface RucheFormValues {
  name: string;
  serial: string;
  status: "alerte" | "normale";
  /** Optional override; when left empty we auto-jitter around the ferme. */
  lat: number | null;
  lng: number | null;
}

interface RucheFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Used for the helper text + lat/lng hints. */
  fermeName: string;
  /** Auto-generated suggestion for the next ruche's display name. */
  suggestedName: string;
  onSubmit: (
    values: RucheFormValues
  ) => Promise<{ ok: boolean; error?: string }>;
}

function emptyValues(suggestedName: string): RucheFormValues {
  return {
    name: suggestedName,
    serial: "",
    status: "normale",
    lat: null,
    lng: null,
  };
}

export function RucheFormModal({
  open,
  onClose,
  fermeName,
  suggestedName,
  onSubmit,
}: RucheFormModalProps) {
  const [values, setValues] = useState<RucheFormValues>(() =>
    emptyValues(suggestedName)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValues(emptyValues(suggestedName));
    setError(null);
    setSubmitting(false);
  }, [open, suggestedName]);

  function set<K extends keyof RucheFormValues>(key: K, v: RucheFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (values.name.trim().length < 1) {
      setError("Le nom de la ruche est requis.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await onSubmit({
        ...values,
        name: values.name.trim(),
        serial: values.serial.trim(),
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

  return (
    <Modal open={open} onClose={onClose} size="md" dismissable={!submitting}>
      <ModalHeader icon={<Wheat className="h-4 w-4" />} onClose={onClose}>
        Nouvelle ruche
      </ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          <p className="text-xs text-ink-500">
            Cette ruche sera ajoutée à{" "}
            <span className="font-medium text-ink-800">{fermeName}</span>.
          </p>

          <Input
            label="Nom de la ruche"
            placeholder="ex : Ruche A1"
            leftIcon={<Layers />}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />

          <Input
            label="Numéro de série (optionnel)"
            placeholder="ex : NH-0421-A"
            value={values.serial}
            onChange={(e) => set("serial", e.target.value)}
          />

          {/* Initial status */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">
              Statut initial
            </label>
            <div className="flex gap-2">
              <StatusOption
                label="Normale"
                active={values.status === "normale"}
                tone="purple"
                onClick={() => set("status", "normale")}
              />
              <StatusOption
                label="Alerte"
                active={values.status === "alerte"}
                tone="orange"
                onClick={() => set("status", "alerte")}
              />
            </div>
          </div>

          {/* Optional position */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">
              Position (optionnel)
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label=""
                type="number"
                step="any"
                placeholder="Latitude"
                leftIcon={<MapPin />}
                value={values.lat === null ? "" : String(values.lat)}
                onChange={(e) =>
                  set(
                    "lat",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
              <Input
                label=""
                type="number"
                step="any"
                placeholder="Longitude"
                leftIcon={<MapPin />}
                value={values.lng === null ? "" : String(values.lng)}
                onChange={(e) =>
                  set(
                    "lng",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              />
            </div>
            <p className="mt-1.5 text-[11px] text-ink-400">
              Laissez vide pour positionner automatiquement autour de la ferme.
            </p>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-brand-orange">
              <TriangleAlert className="h-3.5 w-3.5" />
              {error}
            </p>
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
            leftIcon={<Plus className="h-4 w-4" />}
          >
            {submitting ? "Ajout…" : "Ajouter la ruche"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function StatusOption({
  label,
  active,
  tone,
  onClick,
}: {
  label: string;
  active: boolean;
  tone: "purple" | "orange";
  onClick: () => void;
}) {
  const activeCls =
    tone === "orange"
      ? "border-brand-orange bg-accent-50 text-[#9B5A1F]"
      : "border-brand-purple bg-primary-50 text-brand-purple";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-pill border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? activeCls
          : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          tone === "orange" ? "bg-brand-orange" : "bg-brand-purple"
        }`}
      />
      {label}
    </button>
  );
}
