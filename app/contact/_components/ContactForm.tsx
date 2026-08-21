"use client";

import { FormEvent, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Contact form (client) — rounded pill inputs on a lavender card,
 * matching the Figma "Contact" page mockup. Submits to a stub
 * endpoint for now; wire to a real handler when we have one.
 */
export function ContactForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/contact-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, message }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setErrorMsg(payload.error ?? "Une erreur est survenue.");
        setStatus("error");
        window.setTimeout(() => setStatus("idle"), 4500);
        return;
      }

      setStatus("sent");
      setFirstName("");
      setLastName("");
      setEmail("");
      setMessage("");
      window.setTimeout(() => setStatus("idle"), 4500);
    } catch {
      setErrorMsg("Erreur réseau. Vérifiez votre connexion et réessayez.");
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 4500);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-[28px] bg-[#E8ECFC] p-5 md:p-7",
        "shadow-[0_24px_60px_-30px_rgba(45,51,88,0.25)]"
      )}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FieldInput
          label="Nom"
          value={lastName}
          onChange={setLastName}
          required
        />
        <FieldInput
          label="Prénom"
          value={firstName}
          onChange={setFirstName}
          required
        />
      </div>

      <div className="mt-4">
        <FieldInput
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
        />
      </div>

      <label className="mt-4 block">
        <span className="sr-only">Message</span>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          rows={6}
          className={cn(
            "w-full resize-none rounded-[24px] bg-white px-5 py-4",
            "text-[15px] text-[#454C72] placeholder:text-[#9AA5E8]",
            "outline-none ring-1 ring-transparent transition-shadow",
            "focus:ring-2 focus:ring-blue-400"
          )}
        />
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className={cn(
          "mt-5 inline-flex h-12 w-full items-center justify-center rounded-[24px]",
          "bg-brand-orange text-base font-semibold text-white",
          "shadow-[0_10px_24px_-10px_rgba(232,148,65,0.55)]",
          "transition-colors hover:bg-brand-orange-hover",
          "disabled:cursor-not-allowed disabled:opacity-70"
        )}
      >
        {status === "sending" ? "Envoi…" : "Envoyer"}
      </button>

      {status === "sent" && (
        <p className="mt-4 text-center text-sm text-[#454C72]">
          Merci&nbsp;! Nous reviendrons vers vous très vite.
        </p>
      )}
      {status === "error" && (
        <p className="mt-4 text-center text-sm text-danger">
          {errorMsg ?? "Une erreur est survenue. Réessayez plus tard."}
        </p>
      )}
    </form>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className={cn(
          "h-12 w-full rounded-pill bg-white px-5",
          "text-[15px] text-[#454C72] placeholder:text-[#9AA5E8]",
          "outline-none ring-1 ring-transparent transition-shadow",
          "focus:ring-2 focus:ring-blue-400"
        )}
      />
    </label>
  );
}
