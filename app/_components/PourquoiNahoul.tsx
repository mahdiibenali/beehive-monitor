import Image from "next/image";
import {
  BrainCircuit,
  Clock,
  Handshake,
  Heart,
  ShieldCheck,
  type LucideIcon,
} from "@/lib/icons";
import { cn } from "@/lib/cn";

interface PourquoiCard {
  /** Photo-only PNG (no chrome). */
  src: string;
  title: string;
  description: string;
  Icon: LucideIcon;
}

const CARDS: readonly PourquoiCard[] = [
  {
    src: "/landing/pourquoi/photo-technologie.png",
    title: "Technologie intelligente",
    description: "Une plateforme IoT moderne avec suivi en temps réel.",
    Icon: BrainCircuit,
  },
  {
    src: "/landing/pourquoi/photo-accompagnement.png",
    title: "Accompagnement des apiculteurs",
    description: "Nahoul simplifie l'apiculture moderne.",
    Icon: Handshake,
  },
  {
    src: "/landing/pourquoi/photo-securite.png",
    title: "Sécurité des ruches",
    description: "Alertes instantanées et détection des anomalies.",
    Icon: ShieldCheck,
  },
  {
    src: "/landing/pourquoi/photo-collecte.png",
    title: "Collecte de venin",
    description: "Récolte automatisée et respectueuse des abeilles.",
    Icon: Handshake,
  },
  {
    src: "/landing/pourquoi/photo-gain-temps.png",
    title: "Gain de temps",
    description: "Réduction des déplacements inutiles.",
    Icon: Clock,
  },
  {
    src: "/landing/pourquoi/photo-respect-abeilles.png",
    title: "Respect des abeilles",
    description:
      "Notre système de récolte est conçu pour minimiser le stress des colonies.",
    Icon: Heart,
  },
];

/**
 * "Pourquoi Nahoul ?" — auto-scrolling card marquee.
 *
 * Same pattern as the feature-tags strip above: the track is rendered
 * twice and translated by 50% so the loop is seamless. Hover pauses
 * the animation; `prefers-reduced-motion` disables it entirely and
 * falls back to a centered wrap.
 */
export function PourquoiNahoul() {
  const track = [...CARDS, ...CARDS];

  return (
    <section
      aria-labelledby="pourquoi-heading"
      className="bg-[#F8F9FE] px-4 pb-16 pt-12 md:px-8 md:pb-24 md:pt-20"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="pourquoi-heading"
          className="font-display text-3xl font-semibold tracking-tight text-[#454C72] md:text-4xl"
        >
          Pourquoi Nahoul&nbsp;?
        </h2>
      </div>

      <div className="pourquoi-marquee relative mt-8 overflow-hidden md:mt-12">
        <ul
          role="list"
          className="pourquoi-marquee-track flex min-w-max items-stretch gap-6"
        >
          {track.map((card, i) => (
            <li
              key={`${card.title}-${i}`}
              className="w-[280px] shrink-0 md:w-[320px] lg:w-[360px]"
              aria-hidden={i >= CARDS.length}
            >
              <Card card={card} />
            </li>
          ))}
        </ul>

        {/* Screen-reader friendly static list. */}
        <ul className="sr-only">
          {CARDS.map((card) => (
            <li key={card.title}>
              {card.title} — {card.description}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Card({ card }: { card: PourquoiCard }) {
  const Icon = card.Icon;
  return (
    <article
      className={cn(
        "flex h-full flex-col gap-4 rounded-[22px] p-3",
        "bg-[#E8ECFC] ring-1 ring-blue-100"
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[16px]">
        <Image
          src={card.src}
          alt={card.title}
          fill
          sizes="(min-width: 1024px) 360px, (min-width: 768px) 320px, 280px"
          className="object-cover"
        />
      </div>

      <div className="flex items-start gap-3 px-1 pb-2">
        <span
          aria-hidden
          className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white text-blue-400"
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-[#454C72] md:text-lg">
            {card.title}
          </h3>
          <p className="mt-1 text-sm text-[#7F88BF]">{card.description}</p>
        </div>
      </div>
    </article>
  );
}
