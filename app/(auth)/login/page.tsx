"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail } from "@/lib/icons";
import { Logo } from "@/components/brand/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useSession } from "@/lib/auth/use-current-user";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: sessionLoading, login } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);

  // Already signed in? Bounce straight to the dashboard.
  useEffect(() => {
    if (!sessionLoading && user) {
      router.replace("/dashboard");
    }
  }, [sessionLoading, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setToast(null);

    try {
      await login(email, password);
      setToast({ kind: "success", msg: "Connexion accomplie avec succès !" });
      // Give the toast a beat to render, then route.
      window.setTimeout(() => router.replace("/dashboard"), 400);
    } catch (err) {
      setToast({
        kind: "error",
        msg: err instanceof Error ? err.message : "Identifiants invalides.",
      });
      setSubmitting(false);
    }
  }

  const loading = submitting || sessionLoading;

  return (
    <main className="relative min-h-screen overflow-hidden bg-accent-100">
      {/* Desktop shapes — pinned to the bottom of the viewport */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 hidden select-none md:block"
        aria-hidden
      >
        <Image
          src="/brand/login-shapes.png"
          alt=""
          width={1024}
          height={728}
          className="w-full"
          priority
        />
      </div>

      {/* Mobile top-right curve */}
      <div
        className="pointer-events-none absolute right-0 top-0 z-0 w-[62%] max-w-[280px] select-none md:hidden"
        aria-hidden
      >
        <Image
          src="/brand/login-topshape.png"
          alt=""
          width={250}
          height={187}
          className="h-auto w-full"
          priority
        />
      </div>

      {/* Mobile bottom swirl */}
      <div
        className="pointer-events-none absolute -bottom-2 right-0 z-0 w-[78%] max-w-[420px] select-none md:hidden"
        aria-hidden
      >
        <Image
          src="/brand/login-bottomshape.png"
          alt=""
          width={430}
          height={314}
          className="h-auto w-full"
          priority
        />
      </div>

      {/* Logo top-left — desktop only. Clicking it returns to the
          public landing page (acceuil). */}
      <div className="absolute left-10 top-8 z-20 hidden md:left-16 md:top-10 md:block">
        <Logo
          href="/"
          variant="full"
          width={140}
          height={36}
          className="cursor-pointer transition-opacity hover:opacity-80"
        />
      </div>

      {/* Centered card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-16 md:px-6 md:py-24">
        <div className="w-full max-w-[460px] rounded-[28px] bg-[#F1EFF3] p-7 shadow-card md:max-w-[560px] md:p-10">
          <div className="text-center">
            <h1 className="text-[#2B2353]">
              <span className="block text-[30px] font-semibold leading-[34px] md:hidden">
                Bienvenue !
              </span>
              <span className="hidden text-h1 md:block">
                Bienvenue chez Nahoul !
              </span>
            </h1>
            <p className="mt-2 hidden text-sm text-ink-400 md:block">
              Veiller sur vos ruches en toute sérénité
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-[#2B2353]"
              >
                Adresse Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail />}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[#2B2353]"
              >
                Mot de passe
              </label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    aria-pressed={showPassword}
                    className="flex h-4 w-4 items-center justify-center text-ink-400 transition-colors hover:text-brand-purple focus:outline-none"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                }
                autoComplete="current-password"
                required
              />
              {/* No self-serve reset yet — same flow as account creation:
                  users contact the Nahoul team. */}
              <div className="flex justify-end pt-1">
                <Link
                  href="/contact"
                  className="text-[13px] font-medium text-blue-400 hover:underline"
                >
                  Mot de passe oublié&nbsp;?
                </Link>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" size="lg" fullWidth disabled={loading}>
                {loading ? "Connexion…" : "Se connecter"}
              </Button>
            </div>

            {/* Prospects don't self-register — they go through the contact
                page so Nahoul's team can validate + start the payment flow. */}
            <p className="text-center text-[13px] leading-relaxed text-ink-500">
              Vous n&apos;avez pas de compte&nbsp;?{" "}
              <Link
                href="/contact"
                className="font-semibold text-blue-400 hover:underline"
              >
                Contactez Nahoul
              </Link>{" "}
              pour créer votre compte et procéder aux étapes de paiement.
            </p>
          </form>
        </div>
      </div>

      {/* Toast — bottom-right */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-30 animate-fade-in-up">
          <Alert
            variant={toast.kind}
            title={toast.msg}
            compact
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </main>
  );
}
