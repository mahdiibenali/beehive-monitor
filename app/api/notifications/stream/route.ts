import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { getCurrentUser } from "@/lib/auth/current-user";
import { buildVisibilityFilter } from "@/lib/notifications/visibility";

/**
 * GET /api/notifications/stream
 *
 * Server-Sent Events (SSE) channel that pushes new notifications to the
 * connected user in real-time. Any authenticated user can subscribe — the
 * stream is filtered to messages targeted at their account or their role.
 *
 * Wire format:
 *   • `event: connected`        → `{ at: <iso> }`     — handshake
 *   • `event: notifications`    → `{ items: [...] }`  — new entries since
 *                                 the previous tick (newest first)
 *   • `event: heartbeat`        → `{ t: <ms> }`       — keep-alive
 *
 * The client (EventSource) reconnects automatically on disconnect, so we
 * intentionally keep the protocol stateless: each connection re-opens with
 * `lastSeenAt = now` and only delivers strictly newer events from there.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POLL_INTERVAL_MS = 4_000;
const BATCH_LIMIT = 20;

interface SerializedNotification {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  link: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  actor: { id: string | null; name: string; role: string };
  createdAt: string;
  read: boolean;
  scope: "user" | "role";
}

export async function GET(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectToDatabase();
  const viewerId = new mongoose.Types.ObjectId(session.id);

  const encoder = new TextEncoder();
  let closed = false;
  let lastSeenAt = new Date();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      function send(event: string, data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
            )
          );
        } catch {
          closed = true;
        }
      }

      send("connected", { at: lastSeenAt.toISOString() });

      const visibilityFilter = buildVisibilityFilter({
        id: session!.id,
        role: session!.role,
        joinedAt: session!.joinedAt,
      });

      async function tick() {
        if (closed) return;
        try {
          const docs = await Notification.find({
            ...visibilityFilter,
            createdAt: { $gt: lastSeenAt },
          })
            .sort({ createdAt: -1 })
            .limit(BATCH_LIMIT)
            .lean();

          if (docs.length > 0) {
            const newest = docs[0].createdAt as unknown as Date;
            lastSeenAt = newest instanceof Date ? newest : new Date(newest);
            const items: SerializedNotification[] = docs.map((doc) => {
              const readBy = (doc.readBy ?? []).map((id) => id.toString());
              return {
                _id: doc._id.toString(),
                title: doc.title ?? "",
                message: doc.message ?? "",
                type: doc.type ?? "info",
                link: doc.link ?? null,
                action: doc.action ?? "",
                entity: doc.entity ?? "",
                entityId: doc.entityId ?? null,
                actor: {
                  id: doc.actor?.id ? doc.actor.id.toString() : null,
                  name: doc.actor?.name ?? "",
                  role: doc.actor?.role ?? "",
                },
                createdAt:
                  doc.createdAt instanceof Date
                    ? doc.createdAt.toISOString()
                    : new Date(doc.createdAt as unknown as string).toISOString(),
                read: readBy.includes(session!.id),
                scope: doc.userId ? "user" : "role",
              };
            });
            send("notifications", { items });
          } else {
            send("heartbeat", { t: Date.now() });
          }
        } catch {
          // Swallow transient DB errors — next tick will retry.
        }
      }

      const interval = setInterval(tick, POLL_INTERVAL_MS);

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
