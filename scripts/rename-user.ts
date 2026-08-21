/**
 * One-off direct-DB rename.
 *
 * Renames a user (name + email) everywhere they appear:
 *   • `users` collection (the account itself)
 *   • `auditlogs.actor.name` / `actor.email` (denormalized snapshots)
 *   • `auditlogs.summary` (free-text, usually contains the actor name)
 *   • `auditlogs.changes[].before` / `.after` (diffs that captured the
 *     old name/email when the user was originally created or updated)
 *
 * Bypasses the normal audited mutation flow on purpose — used once by the
 * super-admin to correct a typo made when the account was seeded.
 *
 *   npx tsx --env-file=.env.local scripts/rename-user.ts
 */
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";

const OLD_NAME = "ben tanfous Ramy";
const OLD_EMAIL = "ramy.bentanfous@esprit.tn";

const NEW_NAME = "ben tanfous Roua";
const NEW_EMAIL = "roua.bentanfous@gmail.com";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function main() {
  await connectToDatabase();

  console.log("");
  console.log(`Renaming "${OLD_NAME}" <${OLD_EMAIL}>`);
  console.log(`     →  "${NEW_NAME}" <${NEW_EMAIL}>`);
  console.log("");

  // ── 1. Update the user account ──────────────────────────────────────
  const user = await User.findOne({
    $or: [
      { email: OLD_EMAIL.toLowerCase() },
      { name: new RegExp(`^${escapeRegex(OLD_NAME)}$`, "i") },
    ],
  });

  if (!user) {
    console.log("✗ No user matched the old name/email — nothing to do.");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log("✓ Found user:");
  console.log(`    _id   : ${user._id.toString()}`);
  console.log(`    name  : ${user.name}`);
  console.log(`    email : ${user.email}`);
  console.log(`    role  : ${user.role}`);
  console.log("");

  // Guard: make sure the new email isn't already taken by a *different* user.
  const conflict = await User.findOne({
    email: NEW_EMAIL.toLowerCase(),
    _id: { $ne: user._id },
  }).lean();
  if (conflict) {
    console.log(
      `✗ Aborting — another user already uses ${NEW_EMAIL} (_id=${conflict._id}).`
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  user.name = NEW_NAME;
  user.email = NEW_EMAIL;
  await user.save();
  console.log("✓ User document updated.");
  console.log("");

  const userIdStr = user._id.toString();

  // ── 2. Update actor snapshots on every audit log ────────────────────
  const actorRes = await AuditLog.updateMany(
    {
      $or: [
        { "actor.id": user._id },
        { "actor.email": OLD_EMAIL.toLowerCase() },
        { "actor.email": OLD_EMAIL },
        { "actor.name": OLD_NAME },
      ],
    },
    {
      $set: {
        "actor.name": NEW_NAME,
        "actor.email": NEW_EMAIL,
      },
    }
  );
  console.log(
    `✓ Audit logs — actor snapshots updated: ${actorRes.modifiedCount}`
  );

  // ── 3. Patch free-text fields & diff values one doc at a time ───────
  // (we can't use a single updateMany because it needs per-document logic
  //  for the `changes[]` array)
  const oldNameRx = new RegExp(escapeRegex(OLD_NAME), "gi");
  const oldEmailRx = new RegExp(escapeRegex(OLD_EMAIL), "gi");

  const candidates = await AuditLog.find({
    $or: [
      { "actor.id": user._id },
      { entityId: userIdStr },
      { summary: { $regex: oldNameRx } },
      { summary: { $regex: oldEmailRx } },
      { "changes.before": OLD_NAME },
      { "changes.after": OLD_NAME },
      { "changes.before": OLD_EMAIL },
      { "changes.after": OLD_EMAIL },
      { "changes.before": OLD_EMAIL.toLowerCase() },
      { "changes.after": OLD_EMAIL.toLowerCase() },
    ],
  });

  let summaryTouched = 0;
  let changesTouched = 0;

  for (const log of candidates) {
    let dirty = false;

    if (typeof log.summary === "string") {
      const next = log.summary
        .replace(oldNameRx, NEW_NAME)
        .replace(oldEmailRx, NEW_EMAIL);
      if (next !== log.summary) {
        log.summary = next;
        summaryTouched++;
        dirty = true;
      }
    }

    if (Array.isArray(log.changes)) {
      let changedHere = false;
      for (const c of log.changes) {
        const swap = (v: unknown): unknown => {
          if (typeof v !== "string") return v;
          if (v === OLD_NAME) return NEW_NAME;
          if (
            v === OLD_EMAIL ||
            v.toLowerCase() === OLD_EMAIL.toLowerCase()
          )
            return NEW_EMAIL;
          if (oldNameRx.test(v) || oldEmailRx.test(v)) {
            return v
              .replace(oldNameRx, NEW_NAME)
              .replace(oldEmailRx, NEW_EMAIL);
          }
          return v;
        };
        const nb = swap(c.before);
        const na = swap(c.after);
        if (nb !== c.before) {
          c.before = nb;
          changedHere = true;
        }
        if (na !== c.after) {
          c.after = na;
          changedHere = true;
        }
      }
      if (changedHere) {
        log.markModified("changes");
        changesTouched++;
        dirty = true;
      }
    }

    if (dirty) await log.save();
  }

  console.log(`✓ Audit logs — summary text rewritten     : ${summaryTouched}`);
  console.log(`✓ Audit logs — changes[] diffs rewritten  : ${changesTouched}`);
  console.log("");

  // ── 4. Verify nothing stale is left ─────────────────────────────────
  const leftovers = await AuditLog.countDocuments({
    $or: [
      { "actor.name": OLD_NAME },
      { "actor.email": OLD_EMAIL.toLowerCase() },
      { "actor.email": OLD_EMAIL },
      { summary: { $regex: oldNameRx } },
      { summary: { $regex: oldEmailRx } },
      { "changes.before": OLD_NAME },
      { "changes.after": OLD_NAME },
      { "changes.before": OLD_EMAIL },
      { "changes.after": OLD_EMAIL },
    ],
  });

  if (leftovers === 0) {
    console.log("✓ No leftover references to the old name/email — clean.");
  } else {
    console.log(
      `⚠ ${leftovers} audit log(s) still mention the old values. Inspect manually.`
    );
  }
  console.log("");

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("");
  console.error("✗ Rename failed:", err instanceof Error ? err.message : err);
  console.error("");
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
