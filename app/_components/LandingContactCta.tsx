import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Orange "Contactez-nous" CTA band — anchors `#contact` for navbar /
 * hero / devis buttons elsewhere on the landing page.
 */
export function LandingContactCta() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="bg-[#F8F9FE] px-4 py-12 md:px-8 md:py-16"
    >
      <div
        className={cn(
          "relative mx-auto max-w-6xl overflow-hidden rounded-[28px]",
          "bg-brand-orange px-6 py-12 text-center text-white md:px-12 md:py-14"
        )}
      >
        {/* Decorative orange swooshes (Figma vectors). */}
        <Image
          src="/landing/contact/shape-left.png"
          alt=""
          width={200}
          height={200}
          aria-hidden
          unoptimized
          className="pointer-events-none absolute -left-4 bottom-0 w-[140px] select-none mix-blend-screen opacity-90 md:w-[180px]"
        />
        <Image
          src="/landing/contact/shape-right.png"
          alt=""
          width={200}
          height={200}
          aria-hidden
          unoptimized
          className="pointer-events-none absolute -right-2 top-0 w-[120px] select-none mix-blend-screen opacity-90 md:w-[160px]"
        />

        <div className="relative z-10 mx-auto max-w-xl">
          <h2
            id="contact-heading"
            className="font-display text-3xl font-semibold md:text-4xl"
          >
            Contactez-nous
          </h2>
          <p className="mt-3 text-sm text-white/90 md:text-base">
            Contactez notre équipe ou demandez un devis personnalisé pour votre
            exploitation&nbsp;!
          </p>
          <Link
            href="/contact"
            className={cn(
              "mt-6 inline-flex items-center justify-center rounded-pill",
              "bg-white px-6 py-3 text-sm font-semibold text-brand-orange",
              "shadow-[0_8px_24px_-8px_rgba(0,0,0,0.2)]",
              "transition-colors hover:bg-white/95 md:text-base"
            )}
          >
            Demander un devis
          </Link>
        </div>
      </div>
    </section>
  );
}
