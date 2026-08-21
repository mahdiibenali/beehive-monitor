import { cn } from "@/lib/cn";

const TAGS = [
  "App mobile",
  "Surveillance",
  "Alertes en temps réel",
  "Récolte non létale",
  "Multi-fermes",
  "Dashboard web",
  "Collecte venin",
  "Historique & alertes",
] as const;

function TagPill({ label }: { label: string }) {
  return (
    <span
      className={cn(
        /* Figma: padding 24×16, radius 48, fill #D5D9F7 @ 18%, text Blue-200 */
        "inline-flex shrink-0 items-center rounded-[48px] px-6 py-4",
        "bg-landing-tag/18 text-sm font-medium text-blue-200",
        "md:text-base"
      )}
    >
      {label}
    </span>
  );
}

/**
 * Horizontally scrolling feature chips (Figma marquee strip).
 * Duplicated track for a seamless infinite loop.
 */
export function LandingFeatureTags() {
  const track = [...TAGS, ...TAGS];

  return (
    <section
      aria-label="Fonctionnalités"
      className="bg-[#F8F9FE] py-8 md:py-10"
    >
      {/* Edge-fade mask + clipped marquee track. The mask gradient hides
          the chips behind the page background near both edges so they
          appear to dissolve instead of being clipped. */}
      <div className="landing-marquee relative overflow-hidden">
        <div className="landing-marquee-track flex min-w-max items-center  gap-3 md:gap-4">
          {track.map((label, i) => (
            <TagPill key={`${label}-${i}`} label={label} />
          ))}
        </div>
        {/* Screen-reader friendly static list. */}
        <ul className="sr-only ">
          {TAGS.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
