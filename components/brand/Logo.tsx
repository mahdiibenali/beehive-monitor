import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface LogoProps {
  variant?: "full" | "icon" | "white";
  href?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({
  variant = "full",
  href,
  className,
  width,
  height,
}: LogoProps) {
  const isIcon = variant === "icon";
  const isWhite = variant === "white";
  const src = isIcon
    ? "/brand/logo-icon.png"
    : isWhite
      ? "/brand/logo-white.png"
      : "/brand/logo.png";
  const w = width ?? (isIcon ? 48 : 165);
  const h = height ?? (isIcon ? 48 : 40);

  const img = (
    <Image
      src={src}
      alt="Nahoul"
      width={w}
      height={h}
      className={cn("h-auto w-auto object-contain", className)}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {img}
      </Link>
    );
  }

  return img;
}
