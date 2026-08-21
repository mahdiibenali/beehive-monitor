import Image from "next/image";
import { ChevronDown } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { LandingFeatureTags } from "./_components/LandingFeatureTags";
import { PourquoiNahoul } from "./_components/PourquoiNahoul";
import { LandingContactCta } from "./_components/LandingContactCta";
import { LandingFooter } from "./_components/LandingFooter";
import { LandingNavbar } from "./_components/LandingNavbar";

/**
 * Public landing page (acceuil).
 */
export default async function LandingPage() {
  return (
    <main className="min-h-screen bg-surface">
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative isolate w-full overflow-hidden"
        aria-label="Hero"
      >
        {/* Background photo. Full-bleed, full viewport height. */}
        <div className="relative h-screen min-h-[640px] w-full">
          <Image
            src="/landing/hero-photo.png"
            alt="Apiculteur tenant un cadre de ruche"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          {/* Darkening overlay — boosts contrast for the title / CTA on top.
              Soft vertical gradient keeps the photo from looking muddy. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/55"
          />

          {/* Orange arc wrapping the top-left corner. */}
          <Image
            src="/landing/hero-shape-left.png"
            alt=""
            width={520}
            height={520}
            aria-hidden
            className="pointer-events-none absolute -left-10 -top-10 w-[180px] select-none md:-left-14 md:-top-14 md:w-[260px] lg:w-[320px]"
          />

          {/* Orange loop on the bottom-right — flush with the right edge. */}
          <Image
            src="/landing/hero-shape-right.png"
            alt=""
            width={520}
            height={520}
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-0 w-[220px] select-none md:w-[320px] lg:w-[400px]"
          />

          {/* Navbar overlay (logo + auth pills on the hero photo). */}
          <LandingNavbar tone="overlay" contactHref="/contact" />

          {/* Centered hero content. */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
            <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] md:text-5xl lg:text-6xl">
              Simplifiez votre apiculture
            </h1>
            <p className="mt-3 max-w-xl text-base font-medium drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)] md:text-lg">
              En préservant la santé de vos abeilles
            </p>
            <a
              href="#contact"
              className="mt-6 inline-flex items-center rounded-pill bg-brand-orange px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(255,163,60,0.45)] transition-colors hover:bg-brand-orange-hover md:text-base"
            >
              Rejoignez-nous !
            </a>
          </div>

          {/* Scroll indicator (purple circle w/ chevron). */}
          <a
            href="#pitch"
            aria-label="Faire défiler vers le bas"
            className="absolute bottom-6 left-1/2 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-brand-purple text-white shadow-[0_6px_16px_rgba(108,92,231,0.5)] transition-transform hover:translate-y-[2px]"
          >
            <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
          </a>
        </div>
      </section>

      {/* ─── Pitch + feature — one lavender → white gradient (Figma) ─── */}
      <div
        className={cn(
          "bg-gradient-to-b from-[#ABB3EF] to-[#F8F9FE]",
          "px-4 pb-16 pt-10 md:px-8 md:pb-24 md:pt-14"
        )}
      >
        <section
          id="pitch"
          aria-label="Notre promesse"
          className="mx-auto max-w-6xl"
        >
          <div
            className={cn(
              "rounded-[28px] px-6 py-10 text-center text-white",
              "bg-gradient-to-r from-primary-500 via-brand-purple to-primary-600",
              "shadow-[0_20px_50px_-25px_rgba(93,79,236,0.45)]",
              "md:px-12 md:py-12"
            )}
          >
            <p className="text-xl font-semibold md:text-2xl">
              Récoltez votre venin en toute confiance.
            </p>
            <p className="mt-3 text-sm text-white/90 md:text-base">
              Un œil protecteur sur la santé de vos ruches, sans jamais les
              déranger
            </p>
          </div>
        </section>

        <section
          aria-label="L'allié des abeilles et des apiculteurs"
          className="mx-auto mt-12 max-w-6xl md:mt-16"
        >
        <div className="grid items-stretch gap-10 md:grid-cols-2 md:gap-16">
          {/* Left column — pitch text & CTA. Stretches to the image's height
              so the heading aligns with the top of the card and the footnote
              aligns with the bottom (`mt-auto` on the divider block). */}
          <div className="flex flex-col">
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-[#454C72] md:text-5xl">
              L&apos;allié des abeilles
              <br />
              et des apiculteurs
            </h2>
            <p className="mt-6 text-lg font-medium text-dark-blue-400 md:text-xl">
              Pour{" "}
              <span className="text-blue-400">surveiller vos ruches</span>
            </p>

            <a
              href="#contact"
              className="mt-6 inline-flex w-fit rounded-pill bg-brand-purple px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(93,79,236,0.55)] transition-colors hover:bg-brand-purple-hover md:text-base"
            >
              Demander un devis
            </a>

            <p className="mt-5 text-sm text-dark-blue-200">
              Disponible sur iOS, Android &amp; Web
            </p>

            {/* Divider + footnote pinned to the bottom of the column so it
                lines up with the bottom edge of the showcase image card. */}
            <div className="mt-auto hidden border-t border-[#454C72]/20 pt-6 md:block">
              <p className="text-sm text-dark-blue-200">
                Récolte non létale. Zéro stress pour vos abeilles.
              </p>
            </div>
          </div>

          {/* Right column — app showcase wrapped in a soft lavender card so
              the rounded corners read clearly against the gradient bg. */}
          <div className="relative">
            <div
              className={cn(
                "relative aspect-[889/734] w-full overflow-hidden rounded-[28px]",
                "bg-blue-50 ring-1 ring-blue-100",
                "shadow-[0_24px_60px_-30px_rgba(45,51,88,0.35)]"
              )}
            >
              <Image
                src="/landing/app-showcase.png"
                alt="Aperçu de l'application Nahoul avec alertes et historique de collecte de venin"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Mobile-only footnote (kept under the image for narrow screens). */}
          <p className="text-center text-sm text-[#454C72] md:hidden">
            Récolte non létale. Zéro stress pour vos abeilles.
          </p>
        </div>
        </section>
      </div>

      {/* ─── Feature tags marquee ───────────────────────────────────── */}
      <LandingFeatureTags />

      {/* ─── Notre impact ────────────────────────────────────────────── */}
      <section
        id="impact"
        aria-label="Notre impact"
        className="bg-[#F8F9FE] px-4 pb-16 pt-12 md:px-8 md:pb-24 md:pt-20"
      >
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-medium text-[#7F88BF] md:text-base">
            Notre impact
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-[#454C72] md:text-5xl">
            Une nouvelle génération d&apos;apiculture
            <br className="hidden md:block" /> intelligente
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-[#7F88BF] md:text-base">
            Nahoul révolutionne la récolte de venin et la surveillance des
            ruches grâce à une technologie pensée pour les abeilles et les
            apiculteurs
          </p>

          {/* Dashboard preview composite. `unoptimized` so Next.js doesn't
              re-encode the PNG (which was flattening the transparent gaps
              between panels to black). */}
          <div className="relative mt-12 md:mt-16">
            <div className="relative aspect-[1024/406] w-full">
              <Image
                src="/landing/dashboard-preview.png"
                alt="Aperçu du tableau de bord Nahoul : production de venin, planification du collecteur, conditions internes des ruches"
                fill
                unoptimized
                sizes="(min-width: 768px) 1024px, 100vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pourquoi Nahoul ? ──────────────────────────────────────── */}
      <PourquoiNahoul />

      {/* ─── Contact CTA ───────────────────────────────────────────── */}
      <LandingContactCta />

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <LandingFooter />
    </main>
  );
}
