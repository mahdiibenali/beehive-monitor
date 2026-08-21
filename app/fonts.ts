import localFont from "next/font/local";
import { Poppins } from "next/font/google";

/**
 * Poppins — display font used by the public landing page (`/`).
 * Exposed via `--font-poppins`; the rest of the app keeps Metropolis
 * as the default `font-sans`.
 */
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

/**
 * Metropolis — design-kit font.
 * Files live in /public/fonts and are loaded through next/font/local
 * so they are preloaded, self-hosted, and exposed via the
 * --font-metropolis CSS variable (consumed by tailwind.config -> font-sans).
 */
export const metropolis = localFont({
  src: [
    {
      path: "../public/fonts/Metropolis-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Metropolis-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Metropolis-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/Metropolis-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/Metropolis-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-metropolis",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
