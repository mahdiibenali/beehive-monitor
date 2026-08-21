import type { Metadata } from "next";
import { metropolis, poppins } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nahoul",
  description: "Plateforme de gestion d'apiculture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${metropolis.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-surface font-sans text-ink-900 antialiased">
        {children}
      </body>
    </html>
  );
}
