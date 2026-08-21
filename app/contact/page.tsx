import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { LandingNavbar } from "@/app/_components/LandingNavbar";
import { LandingFooter } from "@/app/_components/LandingFooter";
import { ContactForm } from "./_components/ContactForm";

/**
 * Public "Contact" page.
 *
 * Layout matches the Figma frame:
 *   1. Lavender header band (logo + auth pills) — solid, not over a photo.
 *   2. Breadcrumb + page title.
 *   3. Orange information banner (with the same swooshes as the CTA).
 *   4. Two-column section: contact info on the left, form card on the right.
 *   5. Shared landing footer.
 */
export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FE]">
      {/* Lavender header band hosting the navbar. */}
      <div className="bg-gradient-to-b from-[#ABB3EF] to-[#F8F9FE] pb-10 md:pb-14">
        <LandingNavbar tone="light" contactHref="/contact" />

        <div className="mx-auto max-w-6xl px-5 pt-6 md:px-8 md:pt-10">
          <nav
            aria-label="Fil d'Ariane"
            className="flex items-center gap-2 text-sm text-[#454C72]/80"
          >
            <Link href="/" className="hover:text-[#454C72]">
              Page d&apos;accueil
            </Link>
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span className="text-[#454C72]">Nous contacter</span>
          </nav>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#454C72] md:text-4xl">
            Contact
          </h1>
        </div>
      </div>

      {/* Orange info banner. */}
      <section
        aria-label="Présentation"
        className="-mt-2 px-5 md:px-8"
      >
        <div
          className={cn(
            "relative mx-auto max-w-6xl overflow-hidden rounded-[28px]",
            "bg-brand-orange px-6 py-10 text-center text-white md:px-12 md:py-12"
          )}
        >
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

          <p className="relative z-10 mx-auto max-w-3xl text-base font-medium leading-relaxed md:text-lg">
            Vous souhaitez acquérir le dispositif Nahoul ou obtenir plus
            d&apos;informations&nbsp;? Notre équipe commerciale est à votre
            disposition pour vous accompagner.
          </p>
        </div>
      </section>

      {/* Two columns: info left, form right. */}
      <section
        aria-label="Coordonnées et formulaire"
        className="px-5 py-12 md:px-8 md:py-16"
      >
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:gap-14">
          <ContactInfo />
          <ContactForm />
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}

function ContactInfo() {
  return (
    <div className="space-y-7 text-[15px] text-[#454C72]">
      <InfoRow
        title="Visitez-nous"
        body={<>nahoul.venom-adresse</>}
      />
      <InfoRow
        title="Appelez-nous"
        body={
          <a href="tel:+21656041819" className="hover:underline">
            +216 56 041 819
          </a>
        }
      />
      <InfoRow
        title="Écrivez-nous"
        body={
          <a href="mailto:contact@nahoul.venom" className="hover:underline">
            contact@nahoul.venom
          </a>
        }
      />

      <hr className="border-[#454C72]/15" />

      <div>
        <h3 className="text-base font-semibold text-[#454C72] md:text-lg">
          Commandes &amp; informations
        </h3>
        <p className="mt-2 leading-relaxed text-[#454C72]/85">
          Pour toute demande d&apos;achat, de devis ou de partenariat,
          veuillez nous contacter afin de bénéficier d&apos;un accompagnement
          personnalisé selon vos besoins apicoles.
        </p>
      </div>
    </div>
  );
}

function InfoRow({
  title,
  body,
}: {
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-[#454C72] md:text-lg">
        {title}
      </h3>
      <p className="mt-1 text-[#454C72]/85">{body}</p>
    </div>
  );
}
