/**
 * Bulk-generates fake but realistic apiculteurs and admins so the
 * Gestion d'abonnements and Gestion admins pages have plenty of data.
 *
 * Usage:
 *   npm run seed:fake               → insert ~120 apiculteurs + ~30 admins
 *   npm run seed:clear-fake         → remove every record this script ever
 *                                     inserted (matched on the `*.fake@nahoul.tn`
 *                                     email suffix), then re-seed.
 *
 * Notes:
 *   • Everything generated here uses the `*.fake@nahoul.tn` email convention
 *     so it's easy to identify, filter or wipe later.
 *   • Lat/lng for apiculteurs and fermes are anchored on real Tunisian
 *     governorate seats (with small jitter) so the maps look believable.
 *   • Re-running is safe — entries are upserted by email.
 */
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Apiculteur } from "@/models/Apiculteur";
import { User } from "@/models/User";
import { Maintenance } from "@/models/Maintenance";
import { Notification } from "@/models/Notification";
import { Alert } from "@/models/Alert";
import { ContactMessage } from "@/models/ContactMessage";
import { hashPassword } from "@/lib/auth/password";
import { addMonths } from "@/lib/apiculteurs/subscription";

/** Default password every fake apiculteur / admin logs in with. */
const APICULTEUR_PASSWORD = "Apiculteur123!";
const ADMIN_PASSWORD = "Admin123!";
/** Valid subscription cycle lengths used by the form. */
const PERIODS = [1, 3, 6, 12, 24] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

const APICULTEUR_TARGET = 120;
const ADMIN_TARGET = 30;
const MAINTENANCE_TARGET = 80;
const CONTACT_MESSAGE_TARGET = 35;
const FAKE_EMAIL_DOMAIN = "fake@nahoul.tn";

const MAINTENANCE_TITLES = [
  "Vérification du système",
  "Capteur défaillant",
  "Capteur de température HS",
  "Calibration du capteur d'humidité",
  "Remplacement de la batterie de la passerelle",
  "Connexion réseau intermittente",
  "Mise à jour du firmware",
  "Inspection visuelle des cadres",
  "Traitement contre le varroa",
  "Renforcement de la ruche après essaimage",
];

const REPLY_TEMPLATES_APICULTEUR = [
  "Bonjour, le problème est toujours présent ce matin. Pouvez-vous m'indiquer la marche à suivre ?",
  "Merci pour votre retour, j'attends vos instructions.",
  "Je viens de relancer la passerelle, je vous tiens au courant.",
  "Je suis disponible sur site demain matin si besoin.",
  "Pouvons-nous planifier une intervention cette semaine ?",
];

const REPLY_TEMPLATES_ADMIN = [
  "Bonjour, votre demande est prise en compte. Un technicien vous contactera sous 24h.",
  "Pouvez-vous nous transmettre une photo du capteur concerné ?",
  "Nous avons identifié la cause, intervention prévue demain.",
  "Merci, nous procédons aux vérifications côté serveur.",
  "Pourriez-vous confirmer le numéro de série de l'équipement ?",
];

/** Contact form templates — short, varied French enquiries. */
const CONTACT_MESSAGE_TEMPLATES: string[] = [
  "Bonjour, je souhaite acquérir le dispositif Nahoul pour mes 12 ruches situées dans la région de Nabeul. Pourriez-vous m'envoyer un devis détaillé ainsi que les conditions de livraison ?",
  "Bonjour, je suis apiculteur professionnel à Sfax avec une exploitation de 45 ruches. Le dispositif est-il adapté à cette taille d'élevage ? J'aimerais aussi savoir si une formation est incluse.",
  "Bonjour, j'ai vu votre stand au salon de l'apiculture la semaine dernière. Pouvez-vous me recontacter pour organiser une démonstration sur site ?",
  "Bonjour, je gère une coopérative d'apiculteurs à Kairouan et nous serions intéressés par une commande groupée pour une vingtaine de membres. Quelles sont vos conditions tarifaires en gros ?",
  "Salam, je débute en apiculture et j'ai seulement 3 ruches. Est-ce que Nahoul est aussi adapté pour les petits apiculteurs ? Quel est le budget minimum ?",
  "Bonjour, je suis ingénieur agronome et je travaille sur un projet de recherche en collaboration avec l'INAT. Serait-il possible d'obtenir un accès aux données API pour intégration dans notre étude ?",
  "Bonjour, l'application mobile est-elle disponible en arabe ? La plupart des apiculteurs avec qui je collabore préfèrent cette langue.",
  "Bonjour, mes capteurs de température ne semblent pas se synchroniser correctement depuis hier soir. À qui dois-je m'adresser pour le support technique ?",
  "Bonjour, je viens de recevoir le matériel commandé la semaine dernière mais il manque le câble d'alimentation de la passerelle. Pouvez-vous m'envoyer la pièce manquante rapidement ?",
  "Bonjour, votre solution permet-elle d'envoyer des alertes par SMS en plus des notifications dans l'application ? J'ai un mauvais réseau internet sur certains de mes ruchers.",
  "Bonjour, je suis intéressée par votre dispositif. Pouvez-vous me dire quelle est l'autonomie de la batterie et la fréquence de remplacement ?",
  "Bonjour, je cherche une solution pour surveiller le poids de mes ruches à distance. Est-ce que Nahoul gère cela en plus de la température et de l'humidité ?",
  "Bonjour, l'installation des capteurs nécessite-t-elle un technicien ou puis-je le faire moi-même avec un guide ?",
  "Bonjour, je suis basé à Tataouine et je me demande si vos équipes assurent la livraison et l'installation dans le sud du pays ou si je dois me déplacer.",
  "Salut, super produit ! Existe-t-il un programme de parrainage ou de revente pour les magasins d'apiculture ?",
  "Bonjour, l'abonnement annuel inclut-il la mise à jour du firmware des capteurs ou est-ce une option payante en plus ?",
  "Bonjour, je voudrais ajouter 4 capteurs supplémentaires à mon installation actuelle. Quel est le tarif unitaire pour un client existant ?",
  "Bonjour, en cas de défaillance d'un capteur sous garantie, quelle est la procédure de remplacement et le délai habituel ?",
  "Bonjour, je viens de m'inscrire sur la plateforme mais je n'arrive pas à valider mon adresse email. Le lien dans le mail ne fonctionne pas, pouvez-vous m'aider ?",
  "Bonjour, je souhaite annuler ma commande passée hier car j'ai finalement opté pour une configuration différente. Comment dois-je procéder ?",
];

const MAINTENANCE_DESCRIPTIONS: Record<string, string> = {
  "Capteur défaillant":
    "Le capteur de température installé dans la ruche n'envoie plus de données depuis 48 heures.\n\nLes relevés restent figés à 35°C, ce qui empêche le suivi correct des conditions internes. Vérifier le capteur, les connexions et remplacer si nécessaire.\n\nLe dispositif de stimulation électrique destiné à la collecte du venin ne s'active plus selon les horaires programmés.\n\nUne inspection du circuit électrique et du programmateur est requise afin de garantir une collecte sécurisée et non stressante pour les abeilles.",
  "Capteur de température HS":
    "Les relevés de température sont bloqués depuis 24h. La passerelle confirme bien la connexion au capteur mais les valeurs ne progressent pas.",
  "Calibration du capteur d'humidité":
    "L'humidité affichée dévie d'environ 12% par rapport au capteur de référence sur le terrain. Calibration recommandée.",
  "Vérification du système":
    "Demande de contrôle complet du dispositif après une coupure d'alimentation prolongée.",
  "Remplacement de la batterie de la passerelle":
    "La passerelle déclenche des alarmes batterie faible toutes les nuits. À remplacer rapidement.",
  "Connexion réseau intermittente":
    "Le réseau GSM perd la connexion plusieurs fois par jour. Logs envoyés par e-mail.",
  "Mise à jour du firmware":
    "Mise à jour du firmware de la passerelle pour bénéficier des dernières optimisations de consommation.",
  "Inspection visuelle des cadres":
    "L'apiculteur signale une activité réduite. Demande une inspection visuelle approfondie.",
  "Traitement contre le varroa":
    "Traitement saisonnier contre le varroa à programmer pour les prochaines semaines.",
  "Renforcement de la ruche après essaimage":
    "La ruche a essaimé deux semaines plus tôt. Vérifier la reine et compléter le cheptel.",
};

/* -------------------------------------------------------------------------- */
/*                                   Pools                                    */
/* -------------------------------------------------------------------------- */

const MALE_FIRST_NAMES = [
  "Ahmed", "Ali", "Amine", "Anis", "Aymen", "Ayoub", "Bilel", "Chedly",
  "Fares", "Firas", "Fethi", "Habib", "Hamza", "Hatem", "Houssem", "Ibrahim",
  "Imed", "Issam", "Jamel", "Karim", "Khaled", "Lotfi", "Mahdi", "Marouane",
  "Mehdi", "Moez", "Mohamed", "Mongi", "Mounir", "Nabil", "Nader", "Nizar",
  "Oussama", "Rached", "Riadh", "Sami", "Samir", "Sofiane", "Tarek",
  "Walid", "Yassine", "Youssef", "Zied", "Adel", "Bechir", "Wassim",
];

const FEMALE_FIRST_NAMES = [
  "Amina", "Aroua", "Asma", "Cyrine", "Donia", "Emna", "Fatma", "Hajer",
  "Hanen", "Hela", "Imen", "Inès", "Jihane", "Khaoula", "Latifa",
  "Maha", "Manel", "Mariem", "Mouna", "Nadia", "Najla", "Nawel", "Nour",
  "Olfa", "Rania", "Rim", "Sabrine", "Salma", "Selma", "Sirine", "Sondes",
  "Soumaya", "Wafa", "Yasmine", "Zeineb", "Faten", "Houda", "Ines",
];

const FIRST_NAMES = [...MALE_FIRST_NAMES, ...FEMALE_FIRST_NAMES];

const LAST_NAMES = [
  "Ben Ali", "Ben Salah", "Ben Hamed", "Ben Saïd", "Ben Mahmoud", "Ben Ammar",
  "Ben Youssef", "Ben Romdhane", "Ben Achour", "Ben Slimane", "Ben Hassine",
  "Trabelsi", "Bouazizi", "Gharbi", "Hamdi", "Hammami", "Jaziri", "Jebali",
  "Khelifi", "Mansouri", "Mejri", "Mhamdi", "Mokrani", "Naimi", "Ouni",
  "Riahi", "Saidi", "Sassi", "Sellami", "Slim", "Soltani", "Tlili",
  "Zayani", "Belhadj", "Ferchichi", "Chahed", "Cherni", "Dridi",
  "Hadj Salah", "Karoui", "Laabidi", "Maaloul", "Nasri", "Rebai",
  "Saadi", "Zarrouk", "Lahmar", "Bouker", "Bouguerra", "Brahmi",
];

interface City {
  name: string;
  lat: number;
  lng: number;
  /** Two-letter region prefix used for Plus Codes (totally cosmetic). */
  zoneCode: string;
}

// 24 Tunisian governorate seats — coords are real.
const CITIES: City[] = [
  { name: "Tunis", lat: 36.81, lng: 10.18, zoneCode: "J9W" },
  { name: "Ariana", lat: 36.86, lng: 10.19, zoneCode: "K8X" },
  { name: "Ben Arous", lat: 36.75, lng: 10.22, zoneCode: "J9V" },
  { name: "Manouba", lat: 36.81, lng: 10.10, zoneCode: "J9W" },
  { name: "Nabeul", lat: 36.45, lng: 10.74, zoneCode: "J8X" },
  { name: "Zaghouan", lat: 36.40, lng: 10.14, zoneCode: "J8W" },
  { name: "Bizerte", lat: 37.27, lng: 9.87, zoneCode: "L8V" },
  { name: "Béja", lat: 36.73, lng: 9.18, zoneCode: "J8V" },
  { name: "Jendouba", lat: 36.50, lng: 8.78, zoneCode: "J7V" },
  { name: "Le Kef", lat: 36.18, lng: 8.71, zoneCode: "H7V" },
  { name: "Siliana", lat: 36.08, lng: 9.37, zoneCode: "H8W" },
  { name: "Sousse", lat: 35.83, lng: 10.64, zoneCode: "H8X" },
  { name: "Monastir", lat: 35.78, lng: 10.83, zoneCode: "H9X" },
  { name: "Mahdia", lat: 35.50, lng: 11.06, zoneCode: "H9Y" },
  { name: "Sfax", lat: 34.74, lng: 10.76, zoneCode: "G8X" },
  { name: "Kairouan", lat: 35.68, lng: 10.10, zoneCode: "H8W" },
  { name: "Kasserine", lat: 35.17, lng: 8.83, zoneCode: "H7V" },
  { name: "Sidi Bouzid", lat: 35.04, lng: 9.49, zoneCode: "G8W" },
  { name: "Gabès", lat: 33.88, lng: 10.10, zoneCode: "F8W" },
  { name: "Médenine", lat: 33.34, lng: 10.50, zoneCode: "F8X" },
  { name: "Tataouine", lat: 32.93, lng: 10.45, zoneCode: "E8X" },
  { name: "Gafsa", lat: 34.42, lng: 8.78, zoneCode: "G7V" },
  { name: "Tozeur", lat: 33.92, lng: 8.13, zoneCode: "F7U" },
  { name: "Kébili", lat: 33.70, lng: 8.97, zoneCode: "F7W" },
];

const STREET_TYPES = [
  "Avenue",
  "Rue",
  "Boulevard",
  "Route",
  "Place",
  "Cité",
];

const STREET_NAMES = [
  "Habib Bourguiba",
  "de la République",
  "Mohamed Ali",
  "Farhat Hached",
  "du 7 Novembre",
  "Hédi Chaker",
  "Bab El Khadra",
  "des Roses",
  "des Oliviers",
  "de Carthage",
  "El Manar",
  "El Menzah",
  "Ibn Khaldoun",
  "Hassan ibn Thabit",
  "Khaled ibn El Walid",
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
  "Ferme Errahma",
  "Ferme El Yasmine",
  "Ferme El Borj",
  "Ferme El Wifak",
  "Ferme El Hana",
];

/* -------------------------------------------------------------------------- */
/*                            Random number helpers                           */
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
/** Pick a different random first/last name on every call. */
function randomFullName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}
/**
 * Pick a name + matching gender. Roughly 60% male / 40% female across the
 * fake dataset, but each individual record gets a name whose gender
 * actually fits ("Yasmine" → female, "Tarek" → male).
 */
function randomNameWithGender(): { name: string; gender: "male" | "female" } {
  const isMale = Math.random() < 0.6;
  const first = pick(isMale ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES);
  return { name: `${first} ${pick(LAST_NAMES)}`, gender: isMale ? "male" : "female" };
}
/** Stable, slugified email handle derived from a person name. */
function emailHandle(name: string, salt: number) {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.|\.$/g, "") + `.${salt}`
  );
}
/** Tunisian-style phone: "+216 XX YYY ZZZ". */
function randomPhone() {
  const a = randInt(20, 99);
  const b = randInt(100, 999);
  const c = randInt(100, 999);
  return `+216 ${a} ${b} ${c}`;
}
/** Plus-code-shaped string: "J9W6+VM" using the city's zone prefix. */
function randomPlusCode(zoneCode: string) {
  const digit = randInt(2, 9);
  const letters = "BCDFGHJKMPQRVWXY";
  const a = letters[randInt(0, letters.length - 1)];
  const b = letters[randInt(0, letters.length - 1)];
  return `${zoneCode}${digit}+${a}${b}`;
}
function randomStreetAddress(city: City) {
  const num = randInt(1, 250);
  return `${num} ${pick(STREET_TYPES)} ${pick(STREET_NAMES)}, ${city.name}`;
}

/* -------------------------------------------------------------------------- */
/*                              Generators                                    */
/* -------------------------------------------------------------------------- */

interface GeneratedFerme {
  name: string;
  rucheCount: number;
  address: string;
  plusCode: string;
  lat: number;
  lng: number;
  gatewayCount: number;
  ruchesAttention: number;
}

interface GeneratedApiculteur {
  name: string;
  email: string;
  phone: string;
  region: string;
  gender: "male" | "female";
  address: string;
  rucheCount: number;
  fermeCount: number;
  subscriptionStatus: "active" | "expired" | "suspended";
  subscriptionPeriodMonths: number;
  subscriptionStartedAt: Date;
  subscriptionEndsAt: Date;
  subscriptionSuspendedAt: Date | null;
  subscriptionRemainingMs: number;
  lat: number;
  lng: number;
  fermes: GeneratedFerme[];
  createdAt: Date;
}

function buildApiculteur(index: number): GeneratedApiculteur {
  const city = pick(CITIES);
  const { name, gender } = randomNameWithGender();
  const fermeCount = randInt(1, 4);
  const fermes: GeneratedFerme[] = [];

  // Random total ruches; distribute across fermes.
  const totalRuches = randInt(1, 60);
  let remaining = totalRuches;
  for (let i = 0; i < fermeCount; i++) {
    const share =
      i === fermeCount - 1
        ? remaining
        : randInt(1, Math.max(1, Math.ceil(remaining / (fermeCount - i))));
    remaining = Math.max(0, remaining - share);
    const hasAlert = Math.random() < 0.4;
    fermes.push({
      name: pick(FERME_NAMES),
      rucheCount: share,
      address: randomStreetAddress(city),
      plusCode: randomPlusCode(city.zoneCode),
      lat: city.lat + rand(-0.04, 0.04),
      lng: city.lng + rand(-0.06, 0.06),
      gatewayCount: randInt(1, Math.max(1, Math.min(share, 22))),
      ruchesAttention: hasAlert
        ? randInt(1, Math.max(1, Math.min(share, 12)))
        : 0,
    });
  }

  // Status distribution — 65% active / 25% expired / 10% suspended.
  const r = Math.random();
  const subscriptionStatus: GeneratedApiculteur["subscriptionStatus"] =
    r < 0.65 ? "active" : r < 0.9 ? "expired" : "suspended";

  const subscriptionPeriodMonths = pick([...PERIODS]);
  const now = new Date();

  // Compute start / end dates consistent with the chosen status:
  //   • active    → cycle started recently, still in the future
  //   • expired   → cycle finished 1-90 days ago
  //   • suspended → cycle started recently, was paused before its end
  let subscriptionStartedAt: Date;
  let subscriptionEndsAt: Date;
  let subscriptionSuspendedAt: Date | null = null;
  let subscriptionRemainingMs = 0;

  if (subscriptionStatus === "active") {
    const periodDays = subscriptionPeriodMonths * 30;
    const daysIn = randInt(1, Math.max(1, periodDays - 5));
    subscriptionStartedAt = new Date(now.getTime() - daysIn * DAY_MS);
    subscriptionEndsAt = addMonths(
      subscriptionStartedAt,
      subscriptionPeriodMonths
    );
  } else if (subscriptionStatus === "expired") {
    const daysOverdue = randInt(1, 90);
    subscriptionEndsAt = new Date(now.getTime() - daysOverdue * DAY_MS);
    subscriptionStartedAt = new Date(
      subscriptionEndsAt.getTime() -
        subscriptionPeriodMonths * 30 * DAY_MS
    );
  } else {
    // suspended — paused mid-way through an otherwise-active cycle.
    const periodDays = subscriptionPeriodMonths * 30;
    const daysIn = randInt(2, Math.max(3, periodDays - 5));
    subscriptionStartedAt = new Date(now.getTime() - daysIn * DAY_MS);
    subscriptionEndsAt = addMonths(
      subscriptionStartedAt,
      subscriptionPeriodMonths
    );
    const daysSuspended = randInt(1, Math.max(1, daysIn - 1));
    subscriptionSuspendedAt = new Date(now.getTime() - daysSuspended * DAY_MS);
    subscriptionRemainingMs = Math.max(
      0,
      subscriptionEndsAt.getTime() - subscriptionSuspendedAt.getTime()
    );
  }

  // CreatedAt is just before the subscription started (or the same day).
  const createdAt = new Date(
    subscriptionStartedAt.getTime() - randInt(0, 30) * DAY_MS
  );

  return {
    name,
    email: `${emailHandle(name, index)}.${FAKE_EMAIL_DOMAIN}`,
    phone: randomPhone(),
    region: city.name,
    gender,
    address: randomStreetAddress(city),
    rucheCount: totalRuches,
    fermeCount,
    subscriptionStatus,
    subscriptionPeriodMonths,
    subscriptionStartedAt,
    subscriptionEndsAt,
    subscriptionSuspendedAt,
    subscriptionRemainingMs,
    lat: city.lat + rand(-0.02, 0.02),
    lng: city.lng + rand(-0.02, 0.02),
    fermes,
    createdAt,
  };
}

interface GeneratedAdmin {
  name: string;
  email: string;
  phone: string;
  region: string;
  isActive: boolean;
}

function buildAdmin(index: number): GeneratedAdmin {
  const city = pick(CITIES);
  const name = randomFullName();
  return {
    name,
    email: `${emailHandle(name, index)}.${FAKE_EMAIL_DOMAIN}`,
    phone: randomPhone(),
    region: city.name,
    isActive: Math.random() > 0.2,
  };
}

/* -------------------------------------------------------------------------- */
/*                                  Main                                      */
/* -------------------------------------------------------------------------- */

async function main() {
  const shouldClear = process.argv.includes("--clear");

  console.log("Connecting to MongoDB…");
  await connectToDatabase();
  console.log("Connected.\n");

  if (shouldClear) {
    const emailRegex = new RegExp(
      `\\.${FAKE_EMAIL_DOMAIN.replace(/\./g, "\\.")}$`,
      "i"
    );
    const a = await Apiculteur.deleteMany({ email: emailRegex });
    const u = await User.deleteMany({ email: emailRegex });
    const m = await Maintenance.deleteMany({
      "apiculteurSnapshot.email": emailRegex,
    });
    const c = await ContactMessage.deleteMany({ email: emailRegex });
    const n = await Notification.deleteMany({ "meta.fake": true });
    const al = await Alert.deleteMany({ title: { $regex: /fake/i } });
    console.log(
      `Cleared ${a.deletedCount} fake apiculteurs, ${u.deletedCount} fake user accounts, ${m.deletedCount} fake maintenance demands, ${c.deletedCount} fake contact messages, ${n.deletedCount} fake notifications, and ${al.deletedCount} fake alerts.\n`
    );
  }

  // Backfill: any apiculteur missing a gender (or stuck at "unknown") gets
  // a random one, name-aware. Idempotent — never overwrites male/female.
  const ungendered = await Apiculteur.find({
    $or: [{ gender: { $exists: false } }, { gender: "unknown" }, { gender: null }],
  })
    .select({ _id: 1, name: 1 })
    .lean();
  if (ungendered.length > 0) {
    console.log(`Backfilling gender on ${ungendered.length} apiculteur(s)…`);
    let backfilled = 0;
    for (const row of ungendered) {
      const first = (row.name ?? "").split(/\s+/)[0] ?? "";
      let g: "male" | "female";
      if (MALE_FIRST_NAMES.includes(first)) g = "male";
      else if (FEMALE_FIRST_NAMES.includes(first)) g = "female";
      else g = Math.random() < 0.6 ? "male" : "female";
      await Apiculteur.updateOne({ _id: row._id }, { $set: { gender: g } });
      backfilled++;
    }
    console.log(`  → backfilled ${backfilled} apiculteur(s).\n`);
  }

  // Apiculteurs (with linked login accounts so the subscription gate works)
  console.log(`Seeding ${APICULTEUR_TARGET} fake apiculteurs…`);
  let inserted = 0;
  let skipped = 0;
  const apicPasswordHash = await hashPassword(APICULTEUR_PASSWORD);
  const batch: GeneratedApiculteur[] = [];
  for (let i = 0; i < APICULTEUR_TARGET; i++) {
    batch.push(buildApiculteur(i));
  }
  for (const a of batch) {
    const existing = await Apiculteur.findOne({ email: a.email }).lean();
    if (existing) {
      skipped++;
      continue;
    }

    // Linked User (role "apiculteur") so the subscription gate has
    // something to check against on login.
    const userExisting = await User.findOne({ email: a.email }).lean();
    const userDoc =
      userExisting ??
      (await User.create({
        name: a.name,
        email: a.email,
        phone: a.phone,
        region: a.region,
        role: "apiculteur",
        avatarSrc: "/brand/avatar-sample.svg",
        passwordHash: apicPasswordHash,
        isActive: true,
      }));

    await Apiculteur.create({
      name: a.name,
      email: a.email,
      phone: a.phone,
      region: a.region,
      gender: a.gender,
      address: a.address,
      rucheCount: a.rucheCount,
      fermeCount: a.fermeCount,
      subscriptionStatus: a.subscriptionStatus,
      subscriptionPeriodMonths: a.subscriptionPeriodMonths,
      subscriptionStartedAt: a.subscriptionStartedAt,
      subscriptionEndsAt: a.subscriptionEndsAt,
      subscriptionSuspendedAt: a.subscriptionSuspendedAt,
      subscriptionRemainingMs: a.subscriptionRemainingMs,
      lat: a.lat,
      lng: a.lng,
      fermes: a.fermes,
      avatarSrc: "/brand/avatar-sample.svg",
      createdAt: a.createdAt,
      userId: userDoc._id,
    });
    inserted++;
  }
  console.log(
    `  → inserted ${inserted}, skipped ${skipped} (already existed).`
  );

  // Admins
  console.log(`\nSeeding ${ADMIN_TARGET} fake admins…`);
  let aInserted = 0;
  let aSkipped = 0;
  const adminPasswordHash = await hashPassword(ADMIN_PASSWORD);
  for (let i = 0; i < ADMIN_TARGET; i++) {
    const u = buildAdmin(i);
    const existing = await User.findOne({ email: u.email }).lean();
    if (existing) {
      aSkipped++;
      continue;
    }
    await User.create({
      name: u.name,
      email: u.email,
      phone: u.phone,
      region: u.region,
      isActive: u.isActive,
      role: "admin",
      passwordHash: adminPasswordHash,
      avatarSrc: "/brand/avatar-sample.svg",
    });
    aInserted++;
  }
  console.log(
    `  → inserted ${aInserted}, skipped ${aSkipped} (already existed).`
  );

  // Maintenance demands — explicitly tied to the just-inserted fake
  // apiculteurs. We pick a subset of apiculteurs and give each a
  // realistic number of demands so the list shows recurring names like
  // in the Figma rather than every demand being a unique person.
  //
  // Idempotency: if there are already fake demands in the DB we wipe
  // them first so the seed doesn't keep stacking. Apiculteur and admin
  // rows above are upserted by email so this only resets maintenance.
  const fakeApiculteurs = await Apiculteur.find({
    email: new RegExp(`\\.${FAKE_EMAIL_DOMAIN.replace(/\./g, "\\.")}$`, "i"),
  })
    .select(
      "_id name email phone avatarSrc rucheCount fermeCount createdAt userId"
    )
    .limit(500)
    .lean();

  console.log(`\nSeeding fake maintenance demands…`);
  let mInserted = 0;

  // Notifications mirrored from the real API push are collected here
  // and bulk-inserted at the end so seeding stays fast.
  const notificationsToInsert: Record<string, unknown>[] = [];

  if (fakeApiculteurs.length === 0) {
    console.log("  → no fake apiculteurs found, skipping maintenance seed.");
  } else {
    // Reset existing fake demands so re-running is safe & deterministic.
    const cleared = await Maintenance.deleteMany({
      "apiculteurSnapshot.email": new RegExp(
        `\\.${FAKE_EMAIL_DOMAIN.replace(/\./g, "\\.")}$`,
        "i"
      ),
    });
    if (cleared.deletedCount > 0) {
      console.log(`  → cleared ${cleared.deletedCount} previous fake demands.`);
    }
    // Also clear any leftover fake notifications so we start with a
    // clean bell counter.
    const clearedNotifs = await Notification.deleteMany({
      "meta.fake": true,
    });
    if (clearedNotifs.deletedCount > 0) {
      console.log(
        `  → cleared ${clearedNotifs.deletedCount} previous fake notifications.`
      );
    }

    // Pick the apiculteurs that "have" demands. We aim for ~75% coverage
    // with a long tail (a few apiculteurs file 4-6 demands).
    const shuffled = [...fakeApiculteurs].sort(() => Math.random() - 0.5);
    const targetCount = MAINTENANCE_TARGET;
    let budget = targetCount;

    // Distribution: 5% file 4-6 demands, 25% file 2-3, 70% file 1.
    const heavyFilers = shuffled.slice(0, Math.ceil(shuffled.length * 0.05));
    const mediumFilers = shuffled.slice(
      heavyFilers.length,
      heavyFilers.length + Math.ceil(shuffled.length * 0.25)
    );
    const lightFilers = shuffled.slice(
      heavyFilers.length + mediumFilers.length,
      heavyFilers.length + mediumFilers.length + Math.ceil(shuffled.length * 0.7)
    );
    // The remaining ~25% don't get any demand — empty by design.

    type Filer = { apiculteur: (typeof shuffled)[number]; count: number };
    const queue: Filer[] = [
      ...heavyFilers.map((a) => ({ apiculteur: a, count: randInt(4, 6) })),
      ...mediumFilers.map((a) => ({ apiculteur: a, count: randInt(2, 3) })),
      ...lightFilers.map((a) => ({ apiculteur: a, count: 1 })),
    ];

    for (const filer of queue) {
      for (let i = 0; i < filer.count && budget > 0; i++) {
        const a = filer.apiculteur;
        const title = pick(MAINTENANCE_TITLES);
        const description =
          MAINTENANCE_DESCRIPTIONS[title] ?? "Demande de maintenance.";

        // Older demands are more likely to be treated already.
        const ageDays = randInt(0, 60);
        const startedAt = new Date(Date.now() - ageDays * DAY_MS);
        const dueAt = new Date(startedAt.getTime() + randInt(1, 14) * DAY_MS);
        const treatProbability = ageDays > 30 ? 0.7 : ageDays > 14 ? 0.45 : 0.2;
        const treated = Math.random() < treatProbability;
        const treatedAt = treated
          ? new Date(
              startedAt.getTime() +
                randInt(1, Math.max(2, ageDays)) * DAY_MS
            )
          : null;

        // Build a small thread on ~half the demands so the UI shows the
        // reply system in action.
        const replies: Array<{
          authorId: null;
          authorName: string;
          authorRole: string;
          authorAvatarSrc: string;
          body: string;
          createdAt: Date;
        }> = [];
        const wantsThread = Math.random() < 0.5 || treated;
        if (wantsThread) {
          const exchangeCount = randInt(1, 4);
          let cursor = startedAt.getTime() + randInt(2, 24) * 60 * 60 * 1000;
          for (let r = 0; r < exchangeCount; r++) {
            const fromAdmin = r % 2 === 0; // admins answer first
            replies.push({
              authorId: null,
              authorName: fromAdmin ? "Yasmine Trabelsi" : a.name,
              authorRole: fromAdmin ? "admin" : "apiculteur",
              authorAvatarSrc: "",
              body: fromAdmin
                ? pick(REPLY_TEMPLATES_ADMIN)
                : pick(REPLY_TEMPLATES_APICULTEUR),
              createdAt: new Date(cursor),
            });
            cursor += randInt(2, 36) * 60 * 60 * 1000;
          }
        }

        const lastActivityAt =
          replies.length > 0
            ? replies[replies.length - 1].createdAt
            : treatedAt ?? startedAt;

        const created = await Maintenance.create({
          apiculteurId: a._id,
          apiculteurSnapshot: {
            name: a.name,
            email: a.email,
            phone: a.phone ?? "",
            avatarSrc: a.avatarSrc ?? "",
            rucheCount: a.rucheCount ?? 0,
            fermeCount: a.fermeCount ?? 0,
            inscriptionAt: a.createdAt ?? null,
          },
          title,
          description,
          status: treated ? "traite" : "non-traite",
          startedAt,
          dueAt,
          treatedAt,
          treatedBy: treated
            ? { id: null, name: "Système (seed)", role: "admin" }
            : { id: null, name: "", role: "" },
          attachmentUrl: "",
          replies,
          lastActivityAt,
        });

        // Push the same notifications the real API would create when an
        // apiculteur files a demand, so signed-in super-admins / admins
        // see a populated bell on first load. Tagged with `meta.fake` so
        // a re-seed can wipe them.
        const baseNotif = {
          title: "Nouvelle demande de maintenance",
          message: `${a.name} — ${title}`,
          type: "info" as const,
          link: "/maintenance",
          action: "maintenance.create",
          entity: "Maintenance",
          entityId: created._id.toString(),
          category: pick(["batterie", "capteur", "venin", "autre"]) as "batterie" | "capteur" | "venin" | "autre",
          actor: {
            id: a.userId ?? null,
            name: a.name,
            role: "apiculteur",
          },
          readBy: [],
          meta: { fake: true },
          createdAt: startedAt,
        };
        notificationsToInsert.push(
          { ...baseNotif, userId: null, role: "super-admin" },
          { ...baseNotif, userId: null, role: "admin" }
        );
        // For treated demands, also push the personal "Votre demande a
        // été traitée" so the apiculteur's own bell has something.
        if (treated && a.userId && treatedAt) {
          notificationsToInsert.push({
            title: "Maintenance",
            message: `Votre demande "${title}" a été traitée.`,
            type: "success",
            link: null,
            action: "maintenance.resolve",
            entity: "Maintenance",
            entityId: created._id.toString(),
            category: pick(["batterie", "capteur", "venin", "autre"]) as "batterie" | "capteur" | "venin" | "autre",
            actor: {
              // attributed to a known admin so the actor.id filter
              // doesn't hide the row from the recipient.
              id: null,
              name: "Yasmine Trabelsi",
              role: "admin",
            },
            readBy: [],
            meta: { fake: true },
            createdAt: treatedAt,
            userId: a.userId,
            role: null,
          });
        }

        mInserted++;
        budget--;
      }
      if (budget <= 0) break;
    }
    console.log(
      `  → inserted ${mInserted} demands across ${queue.length} apiculteurs (heavy:${heavyFilers.length}, medium:${mediumFilers.length}, light:${lightFilers.length}).`
    );
  }

  console.log(`\nSeeding fake alerts…`);
  const alertsToInsert: any[] = [];
  let alertsInserted = 0;
  for (const a of fakeApiculteurs) {
    if (!a.userId) continue;
    const numAlerts = randInt(1, 5);
    for (let i = 0; i < numAlerts; i++) {
      const category = pick(["batterie", "capteur", "venin", "autre"]);
      const statuses = ["Resolue", "En cours", "Non resolue"];
      const tones = ["orange", "red", "purple"];
      alertsToInsert.push({
        userId: a.userId,
        hiveId: `${a._id}-ruche-${i}`,
        hiveName: `Ruche ${String(i + 1).padStart(2, "0")}`,
        farmName: `Ferme ${(i % 2) + 1}`,
        title: `Alerte ${category} (fake)`,
        status: pick(statuses),
        tone: pick(tones),
        category,
        date: "29/05/2026",
        time: "10:30",
      });
      alertsInserted++;
    }
  }
  if (alertsToInsert.length > 0) {
    await Alert.insertMany(alertsToInsert, { ordered: false });
    console.log(`  → inserted ${alertsInserted} fake alerts.`);
  }

  // Contact messages — submitted via the public `/contact` form by
  // prospects (visitors / not-yet-customers). Mostly new + a few already
  // read / handled so the inbox has a realistic mix of statuses.
  console.log(`\nSeeding ${CONTACT_MESSAGE_TARGET} fake contact messages…`);
  const clearedMessages = await ContactMessage.deleteMany({
    email: new RegExp(`\\.${FAKE_EMAIL_DOMAIN.replace(/\./g, "\\.")}$`, "i"),
  });
  if (clearedMessages.deletedCount > 0) {
    console.log(
      `  → cleared ${clearedMessages.deletedCount} previous fake messages.`
    );
  }

  let messagesInserted = 0;
  for (let i = 0; i < CONTACT_MESSAGE_TARGET; i++) {
    const { name } = randomNameWithGender();
    const [firstName, ...rest] = name.split(/\s+/);
    const lastName = rest.join(" ") || "Inconnu";

    // Status mix: 45% new (unread), 25% read but not handled, 30% handled.
    const r = Math.random();
    const status: "new" | "read" | "handled" =
      r < 0.45 ? "new" : r < 0.7 ? "read" : "handled";

    // Spread the messages over the past ~60 days so the list isn't all
    // identical timestamps.
    const ageDays = randInt(0, 60);
    const createdAt = new Date(
      Date.now() - ageDays * DAY_MS - randInt(0, 86_400_000)
    );

    const handledBy =
      status === "handled"
        ? {
            id: null,
            name: "Yasmine Trabelsi",
            role: "admin",
          }
        : { id: null, name: "", role: "" };
    const handledAt =
      status === "handled"
        ? new Date(createdAt.getTime() + randInt(1, 14) * DAY_MS)
        : null;

    const created = await ContactMessage.create({
      firstName,
      lastName,
      email: `${emailHandle(name, i)}.${FAKE_EMAIL_DOMAIN}`,
      message: pick(CONTACT_MESSAGE_TEMPLATES),
      status,
      handledBy,
      handledAt,
      ip: "",
      userAgent: "Mozilla/5.0 (seed)",
      createdAt,
      updatedAt: handledAt ?? createdAt,
    });

    // Mirror the bell notifications a real public submission would
    // create. Tagged `meta.fake` so a re-seed wipes them.
    const fullName = `${firstName} ${lastName}`.trim();
    const preview = created.message.slice(0, 80);
    const baseNotif = {
      title: "Nouveau message de contact",
      message: `${fullName} — ${preview}${
        created.message.length > 80 ? "…" : ""
      }`,
      type: "info" as const,
      link: null,
      action: "contact-message.create",
      entity: "contact-message",
      entityId: created._id.toString(),
      actor: { id: null, name: fullName, role: "guest" },
      readBy: [],
      meta: { fake: true },
      createdAt,
    };
    notificationsToInsert.push(
      { ...baseNotif, userId: null, role: "super-admin" },
      { ...baseNotif, userId: null, role: "admin" }
    );

    messagesInserted++;
  }
  console.log(`  → inserted ${messagesInserted} contact messages.`);

  if (notificationsToInsert.length > 0) {
    await Notification.insertMany(notificationsToInsert, { ordered: false });
    console.log(
      `  → inserted ${notificationsToInsert.length} fake notifications (super-admin + admin + per-apiculteur + contact).`
    );
  }

  // Summary
  const totals = await Promise.all([
    Apiculteur.countDocuments({}),
    Apiculteur.countDocuments({ subscriptionStatus: "active" }),
    Apiculteur.countDocuments({ subscriptionStatus: "expired" }),
    Apiculteur.countDocuments({ subscriptionStatus: "suspended" }),
    User.countDocuments({ role: "admin" }),
  ]);
  const totalMaintenance = await Maintenance.countDocuments({});
  const totalMaintenanceUnresolved = await Maintenance.countDocuments({
    status: "non-traite",
  });
  const totalMessages = await ContactMessage.countDocuments({});
  const totalMessagesNew = await ContactMessage.countDocuments({
    status: "new",
  });
  const totalMessagesHandled = await ContactMessage.countDocuments({
    status: "handled",
  });
  console.log("\nDatabase totals:");
  console.log(`  apiculteurs       : ${totals[0]}`);
  console.log(`    → active        : ${totals[1]}`);
  console.log(`    → expired       : ${totals[2]}`);
  console.log(`    → suspended     : ${totals[3]}`);
  console.log(`  admins            : ${totals[4]}`);
  console.log(`  maintenance       : ${totalMaintenance}`);
  console.log(`    → non traitées  : ${totalMaintenanceUnresolved}`);
  console.log(`  contact messages  : ${totalMessages}`);
  console.log(`    → non lus       : ${totalMessagesNew}`);
  console.log(`    → traités       : ${totalMessagesHandled}`);
  const totalNotifications = await Notification.countDocuments({});
  console.log(`  notifications     : ${totalNotifications}`);
  const totalAlerts = await Alert.countDocuments({});
  console.log(`  alerts            : ${totalAlerts}`);

  console.log("\nDefault login passwords:");
  console.log(`  apiculteurs : ${APICULTEUR_PASSWORD}`);
  console.log(`  admins      : ${ADMIN_PASSWORD}`);
  console.log(
    "  → Only apiculteurs whose subscription is currently ACTIVE will be able to sign in."
  );
  console.log("\nDone. Reload /admins or /apiculteurs to see the data.");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Fake seed failed:", err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
