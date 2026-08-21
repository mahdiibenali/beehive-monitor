import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Linkedin } from "@/lib/icons";
import { cn } from "@/lib/cn";

const SOCIAL = [
  { label: "Facebook", href: "https://facebook.com", Icon: Facebook },
  { label: "Instagram", href: "https://instagram.com", Icon: Instagram },
  { label: "LinkedIn", href: "https://linkedin.com", Icon: Linkedin },
] as const;

const LEGAL = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookies Settings", href: "/cookies" },
] as const;

const STORES = [
  {
    label: "Télécharger sur l'App Store",
    href: "#",
    src: "/landing/store-appstore.png",
    width: 120,
    height: 40,
  },
  {
    label: "Disponible sur Google Play",
    href: "#",
    src: "/landing/store-googleplay.png",
    width: 120,
    height: 40,
  },
] as const;

/**
 * Landing-page footer — matches Figma:
 *   • large logo flush left
 *   • contacts block flush right (phone → adresse → email + socials)
 *   • store badges under contacts
 *   • legal row separated by a thin rule
 */
export function LandingFooter() {
  return (
    <footer className="bg-landing-footer text-white">
      <div className="mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-16">
        {/* Top row — logo left, contacts right */}
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between md:gap-12">
          <Link href="/" className="inline-flex shrink-0 self-start">
            <Image
              src="/brand/logo-white.png"
              alt="Nahoul"
              width={260}
              height={68}
              unoptimized
              className="h-auto w-[200px] md:w-[260px]"
            />
          </Link>

          <div className="md:max-w-[420px]">
            <h2 className="text-xl font-semibold md:text-2xl">Contacts</h2>

            <ul className="mt-5 space-y-3 text-[15px] leading-relaxed md:text-base">
              <li>
                <span className="text-white/85">Numéro de téléphone : </span>
                <a
                  href="tel:+21656041819"
                  className="font-semibold text-white hover:underline"
                >
                  +216 56 041 819
                </a>
              </li>
              <li>
                <span className="text-white/85">Adresse : </span>
                <span className="font-semibold text-white">
                  nahoul.venom-adresse
                </span>
              </li>
              <li className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span>
                  <span className="text-white/85">email : </span>
                  <a
                    href="mailto:contact@nahoul.venom"
                    className="font-semibold text-white hover:underline"
                  >
                    contact@nahoul.venom
                  </a>
                </span>
                <span className="inline-flex items-center gap-2.5">
                  {SOCIAL.map(({ label, href, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="text-white transition-opacity hover:opacity-80"
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    </a>
                  ))}
                </span>
              </li>
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {STORES.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="inline-flex shrink-0 transition-opacity hover:opacity-90"
                >
                  <Image
                    src={s.src}
                    alt={s.label}
                    width={s.width}
                    height={s.height}
                    unoptimized
                    className="h-10 w-auto object-contain md:h-11"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "mt-12 flex flex-col gap-4 border-t border-white/30 pt-6",
            "text-sm text-white/85 md:flex-row md:items-center md:justify-between"
          )}
        >
          <p>© 2026. All rights reserved.</p>
          <nav
            aria-label="Liens légaux"
            className="flex flex-wrap gap-5 md:gap-8"
          >
            {LEGAL.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
