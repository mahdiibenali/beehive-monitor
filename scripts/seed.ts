/**
 * Seed script — inserts one user per role so you can log into the app
 * end-to-end. Idempotent: re-running upserts (no duplicates).
 *
 * Run with:
 *   npm run seed
 *
 * Make sure your MongoDB server is running and `.env.local` contains
 * MONGODB_URI before invoking.
 */
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Apiculteur } from "@/models/Apiculteur";
import { hashPassword } from "@/lib/auth/password";
import type { Role } from "@/lib/auth/roles";

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  region?: string;
  isActive?: boolean;
}

const SEED_USERS: SeedUser[] = [
  {
    name: "Yasmine Trabelsi",
    email: "super@nahoul.tn",
    password: "Super123!",
    role: "super-admin",
    phone: "+216 44 667 888",
  },
  {
    name: "Samir Ben Ali",
    email: "admin@nahoul.tn",
    password: "Admin123!",
    role: "admin",
    region: "Sfax",
    phone: "+216 22 334 455",
  },
  {
    name: "Mehdi Sassi",
    email: "apiculteur@nahoul.tn",
    password: "Apiculteur123!",
    role: "apiculteur",
    region: "Sidi Bouzid",
    phone: "+216 99 887 766",
  },
  // Demo admins for the Gestion admins page.
  {
    name: "Jane Cooper",
    email: "jane.cooper@nahoul.tn",
    password: "Admin123!",
    role: "admin",
    region: "Tunis",
    phone: "+216 88 774 511",
  },
  {
    name: "Esther Howard",
    email: "esther.howard@nahoul.tn",
    password: "Admin123!",
    role: "admin",
    region: "Sousse",
    phone: "+216 44 667 822",
  },
  {
    name: "Cody Fisher",
    email: "cody.fisher@nahoul.tn",
    password: "Admin123!",
    role: "admin",
    region: "Kairouan",
    phone: "+216 21 998 100",
    isActive: false,
  },
  {
    name: "Robert Fox",
    email: "robert.fox@nahoul.tn",
    password: "Admin123!",
    role: "admin",
    region: "Bizerte",
    phone: "+216 50 123 456",
  },
  {
    name: "Jenny Wilson",
    email: "jenny.wilson@nahoul.tn",
    password: "Admin123!",
    role: "admin",
    region: "Gabès",
    phone: "+216 71 200 300",
    isActive: false,
  },
  {
    name: "Brooklyn Simmons",
    email: "brooklyn.simmons@nahoul.tn",
    password: "Admin123!",
    role: "admin",
    region: "Monastir",
    phone: "+216 95 678 901",
  },
];

interface SeedFerme {
  name: string;
  rucheCount: number;
  address: string;
  plusCode: string;
  /** Offset from the apiculteur's main lat/lng. */
  latOffset: number;
  lngOffset: number;
}

interface SeedApiculteur {
  name: string;
  email: string;
  phone: string;
  region: string;
  address: string;
  rucheCount: number;
  fermeCount: number;
  subscriptionStatus: "active" | "expired" | "suspended";
  subscriptionEndsAtDays: number; // offset from today (positive = future)
  lat: number;
  lng: number;
  fermes: SeedFerme[];
}

const FERME_NAMES = [
  "Ferme Salah",
  "Ferme Ben Selem",
  "Senyet Lazhar",
  "Ferme El Amel",
  "Ferme Sidi Ali",
  "Ferme El Bostan",
  "Ferme Annahla",
  "Ferme El Faouz",
];

function buildFermes(
  count: number,
  rucheTotal: number,
  region: string
): SeedFerme[] {
  const out: SeedFerme[] = [];
  let remaining = rucheTotal;
  for (let i = 0; i < count; i++) {
    const share =
      i === count - 1
        ? remaining
        : Math.max(1, Math.floor(rucheTotal / count));
    remaining -= share;
    const name = FERME_NAMES[(i * 3 + count) % FERME_NAMES.length];
    out.push({
      name,
      rucheCount: Math.max(0, share),
      address: `${name}, ${region}, Tunisie`,
      plusCode: `J9W${(i + 1) * 2}+${i % 2 === 0 ? "VM" : "RX"}`,
      latOffset: (i - (count - 1) / 2) * 0.03,
      lngOffset: (i - (count - 1) / 2) * 0.05,
    });
  }
  return out;
}

// Cities spread across Tunisia — lat/lng used to position dots on the map.
// Each entry has 1-3 fermes derived from `fermeCount` via buildFermes().
const APICULTEUR_RAW: Omit<SeedApiculteur, "fermes">[] = [
  { name: "Samir Ben Sami", email: "samir.bensami.api@nahoul.tn", phone: "+216 88 774 511", region: "Tunis", address: "Avenue Habib Bourguiba, Tunis", rucheCount: 20, fermeCount: 3, subscriptionStatus: "expired", subscriptionEndsAtDays: -12, lat: 36.81, lng: 10.18 },
  { name: "Jane Cooper", email: "jane.cooper.api@nahoul.tn", phone: "+216 88 774 522", region: "Tunis", address: "Rue de Carthage, Tunis", rucheCount: 1, fermeCount: 1, subscriptionStatus: "expired", subscriptionEndsAtDays: -12, lat: 36.83, lng: 10.20 },
  { name: "Esther Howard", email: "esther.howard.api@nahoul.tn", phone: "+216 44 667 822", region: "Sfax", address: "Route de Tunis, Sfax", rucheCount: 22, fermeCount: 3, subscriptionStatus: "expired", subscriptionEndsAtDays: -34, lat: 34.74, lng: 10.76 },
  { name: "Wade Warren", email: "wade.warren.api@nahoul.tn", phone: "+216 88 774 533", region: "Sousse", address: "Boulevard du 14 Janvier, Sousse", rucheCount: 5, fermeCount: 1, subscriptionStatus: "active", subscriptionEndsAtDays: 25, lat: 35.83, lng: 10.64 },
  { name: "Cody Fisher", email: "cody.fisher.api@nahoul.tn", phone: "+216 44 667 233", region: "Bizerte", address: "Avenue de l'Indépendance, Bizerte", rucheCount: 1, fermeCount: 1, subscriptionStatus: "suspended", subscriptionEndsAtDays: -2, lat: 37.27, lng: 9.87 },
  { name: "Robert Fox", email: "robert.fox.api@nahoul.tn", phone: "+216 88 774 544", region: "Kairouan", address: "Avenue de la République, Kairouan", rucheCount: 10, fermeCount: 2, subscriptionStatus: "active", subscriptionEndsAtDays: 60, lat: 35.68, lng: 10.10 },
  { name: "Brooklyn Simmons", email: "brooklyn.simmons.api@nahoul.tn", phone: "+216 44 667 100", region: "Monastir", address: "Route de la Corniche, Monastir", rucheCount: 13, fermeCount: 2, subscriptionStatus: "active", subscriptionEndsAtDays: 90, lat: 35.78, lng: 10.83 },
  { name: "Jenny Wilson", email: "jenny.wilson.api@nahoul.tn", phone: "+216 88 774 712", region: "Gabès", address: "Rue Mohamed Ali, Gabès", rucheCount: 9, fermeCount: 1, subscriptionStatus: "suspended", subscriptionEndsAtDays: -8, lat: 33.88, lng: 10.10 },
  { name: "Guy Hawkins", email: "guy.hawkins.api@nahoul.tn", phone: "+216 44 667 311", region: "Nabeul", address: "Avenue Habib Thameur, Nabeul", rucheCount: 1, fermeCount: 1, subscriptionStatus: "active", subscriptionEndsAtDays: 45, lat: 36.45, lng: 10.74 },
  { name: "Leslie Alexander", email: "leslie.alexander.api@nahoul.tn", phone: "+216 88 774 855", region: "Mahdia", address: "Boulevard Farhat Hached, Mahdia", rucheCount: 5, fermeCount: 1, subscriptionStatus: "expired", subscriptionEndsAtDays: -20, lat: 35.50, lng: 11.06 },
  { name: "Dianne Russell", email: "dianne.russell.api@nahoul.tn", phone: "+216 44 667 920", region: "Sidi Bouzid", address: "Avenue 14 Janvier, Sidi Bouzid", rucheCount: 7, fermeCount: 2, subscriptionStatus: "active", subscriptionEndsAtDays: 15, lat: 35.04, lng: 9.49 },
  { name: "Ralph Edwards", email: "ralph.edwards.api@nahoul.tn", phone: "+216 88 774 011", region: "Kasserine", address: "Route de Sbeitla, Kasserine", rucheCount: 12, fermeCount: 2, subscriptionStatus: "active", subscriptionEndsAtDays: 75, lat: 35.17, lng: 8.83 },
  { name: "Marvin McKinney", email: "marvin.mckinney.api@nahoul.tn", phone: "+216 44 667 442", region: "Tozeur", address: "Avenue Abou Kacem Chebbi, Tozeur", rucheCount: 3, fermeCount: 1, subscriptionStatus: "suspended", subscriptionEndsAtDays: -5, lat: 33.92, lng: 8.13 },
  { name: "Theresa Webb", email: "theresa.webb.api@nahoul.tn", phone: "+216 88 774 633", region: "Médenine", address: "Route de Djerba, Médenine", rucheCount: 8, fermeCount: 1, subscriptionStatus: "active", subscriptionEndsAtDays: 30, lat: 33.34, lng: 10.50 },
  { name: "Devon Lane", email: "devon.lane.api@nahoul.tn", phone: "+216 44 667 277", region: "Béja", address: "Avenue de la République, Béja", rucheCount: 6, fermeCount: 1, subscriptionStatus: "expired", subscriptionEndsAtDays: -18, lat: 36.73, lng: 9.18 },
  { name: "Kristin Watson", email: "kristin.watson.api@nahoul.tn", phone: "+216 88 774 188", region: "Le Kef", address: "Place de l'Indépendance, Le Kef", rucheCount: 4, fermeCount: 1, subscriptionStatus: "active", subscriptionEndsAtDays: 50, lat: 36.18, lng: 8.71 },
  { name: "Jacob Jones", email: "jacob.jones.api@nahoul.tn", phone: "+216 44 667 533", region: "Jendouba", address: "Avenue Hassen Saadaoui, Jendouba", rucheCount: 2, fermeCount: 1, subscriptionStatus: "active", subscriptionEndsAtDays: 22, lat: 36.50, lng: 8.78 },
  { name: "Cameron Williamson", email: "cameron.williamson.api@nahoul.tn", phone: "+216 88 774 444", region: "Gafsa", address: "Avenue 7 Novembre, Gafsa", rucheCount: 14, fermeCount: 2, subscriptionStatus: "expired", subscriptionEndsAtDays: -45, lat: 34.42, lng: 8.78 },
  { name: "Bessie Cooper", email: "bessie.cooper.api@nahoul.tn", phone: "+216 44 667 121", region: "Tataouine", address: "Avenue Hédi Chaker, Tataouine", rucheCount: 11, fermeCount: 2, subscriptionStatus: "active", subscriptionEndsAtDays: 65, lat: 32.93, lng: 10.45 },
  { name: "Floyd Miles", email: "floyd.miles.api@nahoul.tn", phone: "+216 88 774 909", region: "Zaghouan", address: "Boulevard de la République, Zaghouan", rucheCount: 6, fermeCount: 1, subscriptionStatus: "suspended", subscriptionEndsAtDays: -10, lat: 36.40, lng: 10.14 },
  { name: "Albert Flores", email: "albert.flores.api@nahoul.tn", phone: "+216 44 667 050", region: "Kébili", address: "Route de Douz, Kébili", rucheCount: 3, fermeCount: 1, subscriptionStatus: "active", subscriptionEndsAtDays: 18, lat: 33.70, lng: 8.97 },
];

const SEED_APICULTEURS: SeedApiculteur[] = APICULTEUR_RAW.map((a) => ({
  ...a,
  fermes: buildFermes(a.fermeCount, a.rucheCount, a.region),
}));

async function main() {
  console.log("Connecting to MongoDB…");
  await connectToDatabase();
  console.log("Connected.\n");

  for (const seed of SEED_USERS) {
    const passwordHash = await hashPassword(seed.password);
    await User.findOneAndUpdate(
      { email: seed.email },
      {
        name: seed.name,
        email: seed.email,
        passwordHash,
        role: seed.role,
        phone: seed.phone ?? "",
        region: seed.region ?? "",
        avatarSrc: "/brand/avatar-sample.svg",
        isActive: seed.isActive ?? true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const status = seed.isActive === false ? "inactive" : "active";
    console.log(
      `  [${seed.role.padEnd(11)}]  ${seed.email.padEnd(32)} (${status})  ${seed.password}`
    );
  }

  console.log("\nSeeding apiculteurs…");
  const today = new Date();
  for (const a of SEED_APICULTEURS) {
    const endsAt = new Date(today);
    endsAt.setDate(endsAt.getDate() + a.subscriptionEndsAtDays);
    const fermes = a.fermes.map((f) => ({
      name: f.name,
      rucheCount: f.rucheCount,
      address: f.address,
      plusCode: f.plusCode,
      lat: a.lat + f.latOffset,
      lng: a.lng + f.lngOffset,
    }));
    await Apiculteur.findOneAndUpdate(
      { email: a.email },
      {
        name: a.name,
        email: a.email,
        phone: a.phone,
        region: a.region,
        address: a.address,
        rucheCount: a.rucheCount,
        fermeCount: a.fermeCount,
        subscriptionStatus: a.subscriptionStatus,
        subscriptionEndsAt: endsAt,
        lat: a.lat,
        lng: a.lng,
        avatarSrc: "/brand/avatar-sample.svg",
        fermes,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(
      `  [apiculteur]  ${a.email.padEnd(36)} (${a.subscriptionStatus.padEnd(9)})  ${a.region.padEnd(12)}  ${a.fermes.length} fermes`
    );
  }

  console.log("\nDone. You can now log in with any of the above accounts.");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
