/**
 * Canonical list of the 24 Tunisian governorates.
 *
 * Used as the source of truth for any "Région" picker (apiculteur form,
 * admin form, filters, …) so values stay consistent across the app.
 *
 * Names mirror the spelling used by `scripts/seed-fake.ts` so the seeded
 * dataset and the picker always agree.
 */
export const TUNISIA_REGIONS = [
  "Ariana",
  "Béja",
  "Ben Arous",
  "Bizerte",
  "Gabès",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kébili",
  "Kef",
  "Mahdia",
  "Manouba",
  "Médenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
] as const;

export type TunisiaRegion = (typeof TUNISIA_REGIONS)[number];

/** `<Select>`-ready option list. */
export const TUNISIA_REGION_OPTIONS = TUNISIA_REGIONS.map((r) => ({
  value: r,
  label: r,
}));
