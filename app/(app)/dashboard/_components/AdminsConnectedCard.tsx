"use client";

import { Maximize2 } from "lucide-react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

interface ConnectedAdmin {
  id: string;
  name: string;
  email: string;
  initials: string;
  /** Pre-formatted timestamp string ready for display ("09/06/2026 - 10:20"). */
  connectedAt: string;
  /** Optional avatar URL — falls back to initials when missing. */
  avatarSrc?: string;
  /** True when within the presence window (heartbeat seen recently). */
  isOnline: boolean;
  /** Optional human-friendly "il y a X min" string for offline rows. */
  lastSeenLabel?: string;
}

interface AdminsConnectedCardProps {
  admins: ConnectedAdmin[];
  /** Number of admins currently online — shown in the header chip. */
  onlineCount?: number;
  /** Friendly state shown in place of the table when nothing to display. */
  emptyState?: string;
}

/** "Admins connectés" card with table. */
export function AdminsConnectedCard({
  admins,
  onlineCount,
  emptyState,
}: AdminsConnectedCardProps) {
  return (
    <section className="rounded-[18px] bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-sm font-semibold text-ink-900">Admins connectés</h2>
        {typeof onlineCount === "number" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            {onlineCount} en ligne
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-[14px] border border-ink-100">
        <Table className="rounded-[14px] border-none shadow-none">
          <TableHead>
            <Th sortable className="w-[40%]">
              Nom complet et e-mail
            </Th>
            <Th sortable className="w-[20%]">
              Dernière connexion
            </Th>
            <Th className="w-[20%]">Dernière activité</Th>
            <Th className="w-[20%]">Statut</Th>
          </TableHead>
          <TableBody>
            {admins.length === 0 && (
              <TableRow>
                <Td className="text-center text-sm text-ink-500" colSpan={4}>
                  {emptyState ?? "Aucun admin connecté pour le moment."}
                </Td>
              </TableRow>
            )}
            {admins.map((a) => (
              <TableRow key={a.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar
                        initials={a.initials}
                        src={a.avatarSrc || undefined}
                        alt={a.name}
                        size="sm"
                      />
                      {/* Presence dot anchored to the avatar — green when
                          online, neutral grey when offline. */}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
                          a.isOnline ? "bg-success" : "bg-ink-300"
                        )}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink-900">
                        {a.name}
                      </div>
                      <div className="text-xs text-ink-500">{a.email}</div>
                    </div>
                  </div>
                </Td>
                <Td className="text-ink-600">{a.connectedAt}</Td>
                <Td className="text-ink-600">
                  {a.isOnline ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      Maintenant
                    </span>
                  ) : (
                    <span className="text-xs text-ink-500">
                      {a.lastSeenLabel ?? "—"}
                    </span>
                  )}
                </Td>
                <Td>
                  <div className="flex items-center justify-between">
                    <StatusPill online={a.isOnline} />
                    <button
                      type="button"
                      aria-label="Voir le détail"
                      className="text-ink-400 transition-colors hover:text-brand-purple"
                    >
                      <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </div>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

/**
 * Small presence-aware status pill.
 * Online → green "Connecté", offline → neutral grey "Hors ligne".
 */
function StatusPill({ online }: { online: boolean }) {
  if (online) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Connecté
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-500">
      <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
      Hors ligne
    </span>
  );
}
