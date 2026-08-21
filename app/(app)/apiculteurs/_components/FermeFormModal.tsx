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
import { Layers, MapPin, Plus, Wheat } from "@/lib/icons";
import type { FermeItem } from "@/lib/apiculteurs/serializer";

export type FermeFormValues = {
  name: string;
  rucheCount: number;
  address: string;
  plusCode: string;
  lat: number | null;
  lng: number | null;
};

interface FermeFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  /** Pre-filled values when editing an existing ferme. */
  initial?: Partial<FermeFormValues>;
  /** Coordinates used as a default when adding a new ferme. */
  defaultLat?: number | null;
  defaultLng?: number | null;
  onSubmit: (
    values: FermeFormValues
  ) => Promise<{ ok: boolean; error?: string }>;
}

const EMPTY: FermeFormValues = {
  name: "",
  rucheCount: 0,
  address: "",
  plusCode: "",
  lat: null,
  lng: null,
};

/**
 * Compact modal to add or edit a single ferme on an apiculteur.
 * Submitting calls back to the parent which persists the whole fermes array.
 */
export function FermeFormModal({
  open,
  onClose,
  mode,
  initial,
  defaultLat,
  defaultLng,
  onSubmit,
}: FermeFormModalProps) {
  const [values, setValues] = useState<FermeFormValues>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const base: FermeFormValues = {
      ...EMPTY,
      lat: defaultLat ?? null,
      lng: defaultLng ?? null,
      ...initial,
    };
    setValues(base);
    setError(null);
    setSubmitting(false);
  }, [open, initial, defaultLat, defaultLng]);

  function set<K extends keyof FermeFormValues>(key: K, v: FermeFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (values.name.trim().length < 1) {
      setError("Le nom est requis.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await onSubmit({
        ...values,
        name: values.name.trim(),
        address: values.address.trim(),
        plusCode: values.plusCode.trim(),
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
      <ModalHeader
        icon={<Layers className="h-4 w-4" />}
        onClose={onClose}
      >
        {mode === "create" ? "Nouvelle ferme" : "Modifier la ferme"}
      </ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          <Input
            label="Nom de la ferme"
            placeholder="ex : Ferme El Amel"
            leftIcon={<Layers />}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre de ruches"
              type="number"
              min={0}
              leftIcon={<Wheat />}
              value={String(values.rucheCount)}
              onChange={(e) =>
                set("rucheCount", Math.max(0, Number(e.target.value) || 0))
              }
            />
            <Input
              label="Plus Code"
              placeholder="ex : J9W6+VM"
              leftIcon={<MapPin />}
              value={values.plusCode}
              onChange={(e) => set("plusCode", e.target.value)}
            />
          </div>

          <Input
            label="Adresse"
            placeholder="ex : Route de Tunis, Sfax"
            leftIcon={<MapPin />}
            value={values.address}
            onChange={(e) => set("address", e.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Latitude"
              type="number"
              step="any"
              placeholder="ex : 36.81"
              value={values.lat === null ? "" : String(values.lat)}
              onChange={(e) =>
                set(
                  "lat",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              placeholder="ex : 10.18"
              value={values.lng === null ? "" : String(values.lng)}
              onChange={(e) =>
                set(
                  "lng",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
            />
          </div>

          <p className="text-xs text-ink-400">
            Astuce : ouvrez{" "}
            <a
              href="https://www.openstreetmap.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-purple hover:underline"
            >
              OpenStreetMap
            </a>{" "}
            et faites un clic droit sur le point exact pour copier sa
            latitude / longitude.
          </p>

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

/** Convert a `FermeItem` (from the API) to form values. */
export function fermeItemToValues(f: FermeItem): FermeFormValues {
  return {
    name: f.name,
    rucheCount: f.rucheCount,
    address: f.address,
    plusCode: f.plusCode,
    lat: f.lat,
    lng: f.lng,
  };
}
