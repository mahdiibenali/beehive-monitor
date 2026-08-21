/**
 * Seed fake fermes for a single, manually-created test user.
 *
 * Looks up the user by email (default `test@test.com`), ensures an
 * Apiculteur document is linked to it, and (re)fills its `fermes[]`
 * array with realistic Tunisian sample data so the `/fermes` page
 * has something to display.
 *
 * Usage:
 *   npm run seed:test-fermes                    → seed test@test.com
 *   npm run seed:test-fermes -- other@mail.tn   → custom email
 *
 * Re-running is safe: existing fermes are replaced (not appended)
 * so counts stay stable.
 */
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Apiculteur } from "@/models/Apiculteur";
import { User } from "@/models/User";
import { Alert } from "@/models/Alert";
import { Notification } from "@/models/Notification";

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

interface City {
  name: string;
  lat: number;
  lng: number;
  zoneCode: string;
}

const CITIES: City[] = [
  { name: "Tunis", lat: 36.81, lng: 10.18, zoneCode: "J9W" },
  { name: "Ariana", lat: 36.86, lng: 10.19, zoneCode: "K8X" },
  { name: "Ben Arous", lat: 36.75, lng: 10.22, zoneCode: "J9V" },
  { name: "Nabeul", lat: 36.45, lng: 10.74, zoneCode: "J8X" },
  { name: "Sousse", lat: 35.83, lng: 10.64, zoneCode: "H8X" },
  { name: "Béja", lat: 36.73, lng: 9.18, zoneCode: "J8V" },
  { name: "Kairouan", lat: 35.68, lng: 10.10, zoneCode: "H8W" },
  { name: "Sfax", lat: 34.74, lng: 10.76, zoneCode: "G8X" },
];

const STREET_TYPES = ["Avenue", "Rue", "Boulevard", "Route", "Cité"];
const STREET_NAMES = [
  "Habib Bourguiba",
  "de la République",
  "Mohamed Ali",
  "Farhat Hached",
  "Hédi Chaker",
  "des Oliviers",
  "El Manar",
  "Ibn Khaldoun",
];
const FERME_NAMES = [
  "Ferme El Amel",
  "Ferme Salah",
  "Ferme Ben Selem",
  "Senyet Lazhar",
  "Ferme Sidi Ali",
  "Ferme El Bostan",
  "Ferme Annahla",
  "Ferme El Faouz",
  "Ferme El Khir",
  "Ferme El Falah",
  "Ferme El Yasmine",
  "Ferme El Borj",
];

const RUCHE_NAME_LETTERS = ["A", "B", "C", "D"];

interface SeedRuche {
  name: string;
  serial: string;
  status: "alerte" | "normale";
  alerts: number;
  gatewayIndex: number;
  lat: number;
  lng: number;
}

function buildRuches(
  ferme: SeedFerme,
  count: number,
  alertCount: number
): SeedRuche[] {
  const ruches: SeedRuche[] = [];
  const perGroup = Math.max(1, Math.ceil(count / RUCHE_NAME_LETTERS.length));
  const alertedIdx = new Set<number>();
  while (alertedIdx.size < Math.min(alertCount, count)) {
    alertedIdx.add(randInt(0, count - 1));
  }
  for (let i = 0; i < count; i++) {
    const letter = RUCHE_NAME_LETTERS[Math.floor(i / perGroup) % RUCHE_NAME_LETTERS.length];
    const numWithin = (i % perGroup) + 1;
    const gatewayIndex = (i % Math.max(1, ferme.gatewayCount)) + 1;
    const isAlerted = alertedIdx.has(i);
    ruches.push({
      name: `Ruche ${letter}${numWithin}`,
      serial: `NH-${1000 + randInt(0, 8999)}`,
      status: isAlerted ? "alerte" : "normale",
      alerts: isAlerted ? 1 + randInt(0, 5) : 0,
      gatewayIndex,
      lat: ferme.lat + rand(-0.004, 0.004),
      lng: ferme.lng + rand(-0.005, 0.005),
    });
  }
  return ruches;
}

function randomStreetAddress(city: City) {
  const number = randInt(1, 220);
  return `${number} ${pick(STREET_TYPES)} ${pick(STREET_NAMES)}, ${city.name}`;
}

function randomPlusCode(zoneCode: string) {
  const chars = "23456789CFGHJMPQRVWX";
  let out = "";
  for (let i = 0; i < 4; i++) out += chars[randInt(0, chars.length - 1)];
  return `${zoneCode}${out.slice(0, 1)}+${out.slice(1, 3)}`;
}

interface SeedFerme {
  name: string;
  rucheCount: number;
  address: string;
  plusCode: string;
  lat: number;
  lng: number;
  gatewayCount: number;
  ruchesAttention: number;
  ruches: SeedRuche[];
}

function buildFermes(homeCity: City, fermeCount: number): SeedFerme[] {
  const out: SeedFerme[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < fermeCount; i++) {
    let name = pick(FERME_NAMES);
    let safety = 0;
    while (usedNames.has(name) && safety < 20) {
      name = pick(FERME_NAMES);
      safety++;
    }
    usedNames.add(name);

    // Spread fermes across nearby cities so the region label varies.
    const city =
      i === 0 || Math.random() < 0.6 ? homeCity : pick(CITIES);

    const ruches = randInt(3, 14);
    const hasAlert = Math.random() < 0.45;
    const ruchesAttention = hasAlert
      ? randInt(1, Math.max(1, Math.min(ruches, 6)))
      : 0;
    const gatewayCount = randInt(1, Math.max(1, Math.min(ruches, 4)));
    const baseFerme: SeedFerme = {
      name,
      rucheCount: ruches,
      address: randomStreetAddress(city),
      plusCode: randomPlusCode(city.zoneCode),
      lat: city.lat + rand(-0.04, 0.04),
      lng: city.lng + rand(-0.06, 0.06),
      gatewayCount,
      ruchesAttention,
      ruches: [],
    };
    baseFerme.ruches = buildRuches(baseFerme, ruches, ruchesAttention);
    out.push(baseFerme);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*                                   Main                                     */
/* -------------------------------------------------------------------------- */

async function main() {
  const targetEmail = (process.argv[2] ?? "test@test.com")
    .trim()
    .toLowerCase();

  console.log(`Seeding fake fermes for: ${targetEmail}\n`);
  await connectToDatabase();

  const user = await User.findOne({ email: targetEmail }).lean();
  if (!user) {
    console.error(
      `✗ No user found with email "${targetEmail}". Create the account first, then re-run this script.`
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  // Clean up existing Alerts and Notifications for this user
  await Alert.deleteMany({ userId: user._id });
  await Notification.deleteMany({ userId: user._id });

  // Pick a "home" city. Use the user's region if it matches a known city.
  const homeCity =
    CITIES.find(
      (c) => c.name.toLowerCase() === (user.region ?? "").toLowerCase()
    ) ?? pick(CITIES);

  const fermeCount = randInt(4, 8);
  const fermes = buildFermes(homeCity, fermeCount);
  const rucheCount = fermes.reduce((sum, f) => sum + f.rucheCount, 0);

  // Make sure the User has the right role so the apiculteur dashboard
  // and /fermes route guard let them in.
  if (user.role !== "apiculteur") {
    await User.updateOne(
      { _id: user._id },
      { $set: { role: "apiculteur" } }
    );
    console.log(`  • Promoted user "${user.email}" → role "apiculteur".`);
  }

  // Find or create the matching Apiculteur record.
  const existing = await Apiculteur.findOne({
    $or: [{ userId: user._id }, { email: targetEmail }],
  });

  if (existing) {
    existing.fermes = fermes as unknown as typeof existing.fermes;
    existing.fermeCount = fermes.length;
    existing.rucheCount = rucheCount;
    existing.region = homeCity.name;
    if (!existing.userId) existing.userId = user._id;
    if (!existing.lat) existing.lat = homeCity.lat;
    if (!existing.lng) existing.lng = homeCity.lng;
    await existing.save();
    console.log(
      `✓ Updated existing apiculteur (${existing._id}) — ${fermes.length} fermes, ${rucheCount} ruches.`
    );
  } else {
    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setMonth(endsAt.getMonth() + 12);

    const created = await Apiculteur.create({
      name: user.name,
      email: targetEmail,
      phone: user.phone ?? "",
      region: homeCity.name,
      gender: "unknown",
      address: randomStreetAddress(homeCity),
      rucheCount,
      fermeCount: fermes.length,
      subscriptionStatus: "active",
      subscriptionPeriodMonths: 12,
      subscriptionStartedAt: now,
      subscriptionEndsAt: endsAt,
      subscriptionSuspendedAt: null,
      subscriptionRemainingMs: endsAt.getTime() - now.getTime(),
      lat: homeCity.lat,
      lng: homeCity.lng,
      fermes,
      avatarSrc: "/brand/avatar-sample.svg",
      userId: user._id,
    });
    console.log(
      `✓ Created new apiculteur (${created._id}) — ${fermes.length} fermes, ${rucheCount} ruches.`
    );
  }

  const totalAlerted = fermes.reduce(
    (sum, f) => sum + f.ruches.filter((r) => r.status === "alerte").length,
    0
  );
  console.log("\nFermes inserted:");
  for (const f of fermes) {
    const tag = f.ruchesAttention > 0 ? "ALERTE" : "OK    ";
    console.log(
      `  [${tag}] ${f.name.padEnd(20)} · ${String(f.rucheCount).padStart(2, "0")} ruches · ${String(f.gatewayCount).padStart(2, "0")} gateway · attention=${f.ruchesAttention}`
    );
  }
  console.log(
    `\nRuches: ${rucheCount} total · ${totalAlerted} en alerte (DB rows inserted).`
  );

  // Generate Alerts and Notifications for ruches in "alerte" status
  const alertsToInsert: any[] = [];
  const notificationsToInsert: any[] = [];
  
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  for (const f of fermes) {
    for (const r of f.ruches) {
      if (r.status === "alerte") {
        const category = pick(["batterie", "capteur", "venin", "autre"]);
        const statuses = ["Resolue", "En cours", "Non resolue"];
        const tones = ["orange", "red", "purple"];
        
        alertsToInsert.push({
          userId: user._id,
          hiveId: r.serial,
          hiveName: r.name,
          farmName: f.name,
          title: `Alerte ${category} détectée`,
          status: pick(statuses),
          tone: pick(tones),
          category,
          date: dateStr,
          time: timeStr,
        });

        notificationsToInsert.push({
          userId: user._id,
          role: null,
          title: "Nouvelle Alerte",
          message: `La ruche ${r.name} dans la ferme ${f.name} nécessite votre attention (${category}).`,
          type: pick(["warning", "error"]),
          category,
          link: `/alertes`,
          action: "alert.new",
          entity: "Alert",
          entityId: r.serial,
          actor: { id: null, name: "Système", role: "system" },
          readBy: [],
          meta: { fake: true },
          createdAt: now,
        });
      }
    }
  }

  if (alertsToInsert.length > 0) {
    await Alert.insertMany(alertsToInsert, { ordered: false });
    console.log(`\n  → Inserted ${alertsToInsert.length} alerts for the alerted ruches.`);
  }

  if (notificationsToInsert.length > 0) {
    await Notification.insertMany(notificationsToInsert, { ordered: false });
    console.log(`  → Inserted ${notificationsToInsert.length} notifications for the user.`);
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
