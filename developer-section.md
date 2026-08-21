# Contribution Développeur — Plateforme Nahoul

## 1. Aperçu du Système

Le projet s'appelle **Nahoul** (package `nectaious`). C'est une plateforme de gestion apicole connectée qui se compose de trois couches qui communiquent via une API REST:

- **Application web** (Next.js 15, App Router) : dashboard admin/apiculteur + landing page publique
- **Application mobile** (React Native / Expo) : interface apiculteur terrain avec scan QR, cartes, alertes
- **Backend API** : hébergé dans le même projet Next.js via les route handlers dans `app/api/`

Le backend repose sur MongoDB via Mongoose pour le stockage. L'authentification utilise des cookies de session signés avec HMAC-SHA256, avec un système de rôles (`super-admin`, `admin`, `apiculteur`). Chaque opération sensible est tracée dans une collection d'audit append-only.

Il n'y a pas de séparation physique entre le frontend web et l'API — Next.js sert les deux. Le mobile, lui, tourne sur un serveur Expo séparé et consomme l'API via HTTP.

## 2. Stack Technique Réelle

| Couche | Technologie | Version |
|---|---|---|
| Framework web | Next.js (App Router) | 15.1.0 |
| Langage | TypeScript | 5.7.2 |
| Base de données | MongoDB via Mongoose | 8.8.0 |
| Mobile | React Native / Expo | 54.0.0 / 0.81.5 |
| Style | Tailwind CSS + design tokens custom | 3.4.16 |
| Icons | lucide-react (réexportés depuis `lib/icons.tsx`) | 0.460.0 |
| Authentification | bcryptjs + cookies HMAC-SHA256 (stateless) | 3.0.3 |
| Cartes | Leaflet + react-leaflet | 1.9.4 / 5.0.0 |
| QR code | expo-camera (mobile) | 17.0.10 |
| Polices | Metropolis (locale via next/font) + Poppins (Google Fonts) | — |
| Utilitaires | clsx + tailwind-merge (via `lib/cn.ts`) | 2.1.1 / 2.5.5 |

Il n'y a pas de state management global — chaque page gère son état local avec `useState` / `useEffect`. Le contexte utilisateur est partagé via React Context (`lib/auth/use-current-user.tsx`).

## 3. Architecture Réelle

### Structure des dossiers (web)

```
app/
  (app)/             → pages protégées (layout + guard serveur)
    admins/          → gestion des admins (super-admin only)
    apiculteurs/     → gestion abonnements + fermes
    audit-logs/      → journal d'audit (super-admin only)
    dashboard/       → page d'accueil connectée
    fermes/          → fermes + ruches (apiculteur)
    maintenance/     → tickets de maintenance
    mes-ruches/      → vue détaillée ruches (apiculteur)
    messages-contact/ → inbox formulaires contact
    notifications/   → centre notifications
    profile/         → édition profil
  (auth)/            → pages non connectées
    login/           → page de connexion
  api/               → 37 route handlers REST
  _components/       → composants landing page (server components)
components/
  ui/               → 30 composants du design system
  brand/            → Logo
  layout/           → AppShell, SideNav, Popovers
  auth/             → RoleGate
lib/
  auth/             → session, password, current-user, roles, use-current-user
  audit/            → logAudit, actions, format
  mongodb.ts        → connexion MongoDB avec cache
  icons.tsx         → réexport lucide-react
  cn.ts             → clsx + tailwind-merge
models/             → 9 schémas Mongoose
```

### Navigation (web)

Le routage utilise le App Router de Next.js 15 avec deux groupes:

- `(auth)/` — pages publiques (login). Layout fournit le `UserProvider` sans utilisateur.
- `(app)/` — pages protégées. Le layout serveur appelle `getCurrentUser()` et redirige vers `/login` si pas de session valide.

La sidebar est gérée par `AppSideNav` qui lit les permissions depuis `lib/menu.tsx` et filtre les entrées selon le rôle. Chaque rôle voit des entrées différentes.

### Navigation (mobile)

L'application mobile n'utilise **pas** React Navigation. La navigation est manuelle : un composant `Shell` dans `App.tsx` maintient un état `screen` de type `ScreenKey` et affiche conditionnellement chaque écran. La bottom tab bar est aussi gérée manuellement avec des `Pressable`.

### Flux API

Tous les calls API passent soit par `fetch` natif (web) soit par Axios (mobile). Le token de session est stocké dans un cookie httpOnly (web) ou AsyncStorage (mobile). Les appels mobiles passent par `mobile/src/services/api.ts` qui injecte le token Bearer dans le header Authorization.

Le backend valide la session via `getCurrentUser()` dans chaque route handler.

## 4. Application Web

### Interface d'authentification

La page de connexion se trouve dans `app/(auth)/login/page.tsx`. C'est un formulaire avec email + mot de passe, des icônes de verrouillage, un toggle pour afficher/masquer le mot de passe. Le design suit les maquettes Figma avec des formes de fond (ovales orange) et une carte centrée.

Le formulaire appelle `login()` du contexte `useSession()` qui fait un POST vers `/api/auth/login`. Si la réponse est OK, l'utilisateur est stocké dans le state React et redirigé vers `/dashboard`. Si erreur, un toast apparaît en bas à droite.

Il y a une vérification : si l'utilisateur est déjà connecté, `useEffect` redirige automatiquement vers le dashboard.

### Dashboard

Deux variantes selon le rôle :

- **SuperAdminDashboard** (`dashboard/_components/SuperAdminDashboard.tsx`) : affiche les métriques globales (admins connectés, apiculteurs, maintenance), un graphique donut de répartition par région, et une liste des admins en ligne avec présence temps réel via heartbeat.
- **ApiculteurDashboard** (`dashboard/_components/ApiculteurDashboard.tsx`) : montre les métriques de l'apiculteur (ruches, alertes, production venin) avec des cartes.

La présence temps réel utilise `useHeartbeat()` (`lib/auth/use-heartbeat.ts`) qui envoie un POST `/api/auth/heartbeat` toutes les 45 secondes. Le serveur met à jour `lastActiveAt`. La fenêtre de présence est de 90 secondes.

### Gestion des apiculteurs (admin)

La page `app/(app)/apiculteurs/` est un tableau complet avec :
- Barre de recherche + filtres par statut
- Pagination côté serveur
- Tri par colonnes
- Modale de création/édition d'apiculteur
- Un drawer de détail avec carte Leaflet des fermes
- Vue "ruches en alerte" avec le statut de chaque ruche
- Export CSV

Les apiculteurs sont stockés dans une collection Mongoose dédiée (`models/Apiculteur.ts`) avec un schéma contenant les fermes (sous-documents), les gateways, les sessions de récolte, et les ruches.

### Fermes & Ruches (apiculteur)

Les pages `fermes/` et `mes-ruches/` sont conçues pour le rôle apiculteur. Elles affichent les fermes avec leurs ruches, les alertes actives, un historique de production, et une carte Leaflet.

### Maintenance

La page `maintenance/` liste les tickets déposés par les apiculteurs. Chaque ticket a un fil de discussion (admin ↔ apiculteur). L'admin peut marquer comme traité, l'apiculteur peut créer des demandes.

### Système de notifications

Les notifications sont stockées dans MongoDB avec deux modes : direct (userId) ou broadcast (role). Le read state est tracké via un tableau `readBy[]`. L'API `/api/notifications/stream` permet le polling pour les nouvelles notifications.

### Journal d'audit

Chaque action importante est tracée via `logAudit()` dans une collection append-only. Les logs incluent l'acteur (dénormalisé), l'action, l'entité, les changements, l'IP, et le user-agent. La page `audit-logs/` est accessible uniquement au super-admin.

## 5. Application Mobile

### Structure

```
mobile/src/
  core/providers/     → AuthContext (connexion, token, refresh)
  features/
    auth/             → LoginScreen
    home/             → DashboardScreen, GatewayScreen
    ferme/            → FermesScreen, FarmDetailScreen, FarmListScreen, FermeDashboardScreen
    hive/             → HivesScreen, HiveDetailScreen
    alerts/           → MaintenanceScreen, NotificationsScreen
    profile/          → ProfileScreen, EditProfileScreen
  services/           → api.ts (Axios avec intercepteur token)
  shared/
    components/       → ~40 composants réutilisables
    theme/            → theme.ts (couleurs, shadows)
    types/            → types.ts (tous les types partagés)
    utils/            → helpers, constants, formatDate, screenLabels
```

### Navigation manuelle

Le point d'entrée est `App.tsx`. Il n'y a pas de React Navigation — le composant `Shell` maintient un état `screen` de type `ScreenKey` et rend l'écran correspondant via un switch. La bottom tab bar est une `View` avec des `Pressable` et des icônes Ionicons. Chaque onglet peut avoir des sous-écrans.

Ça a été un choix un peu particulier, mais vu la structure des écrans ça fonctionne. Le re-rendu est géré par React quand l'état `screen` change.

### Écran de connexion

`LoginScreen.tsx` est un formulaire simple avec email + mot de passe. Il utilise `useAuth()` qui fait un POST vers l'API puis stocke le token dans AsyncStorage. Il n'y a pas de gestion de mot de passe oublié — le lien redirige vers la page contact.

### Dashboard mobile

`FermesScreen.tsx` est l'écran principal. Il affiche des tuiles de statistiques (fermes, ruches, gateways, alertes), un graphique de production, une carte de la Tunisie avec les fermes positionnées, et les 3 dernières alertes. Les données viennent de l'API `/mobile/ruche-data`.

### Scan de gateway

`GatewayScreen.tsx` gère l'appairage des gateways IoT. Le flow a plusieurs étapes :
1. Sélection de la ferme
2. Choix de la méthode : scan QR ou saisie manuelle
3. Scan via `expo-camera` ou formulaire manuel
4. Envoi à l'API

Le format du QR code attendu est `XX_XXXXXX_000`. Si le format est invalide, une alerte s'affiche. Le bouton de scan est désactivé si la permission caméra n'est pas accordée.

### Détail de ferme

`FarmDetailScreen.tsx` est l'écran le plus riche. Il a des tabs pour naviguer entre :
- **Ruches** : liste des ruches avec filtres et recherche
- **Venin** : collecte + statistiques de production
- **Plan** : vue carte Leaflet via WebView
- **Batterie** : état des batteries des gateways

Le composant `FarmVeninTab.tsx` permet d'ajouter une session de récolte via une modale (`AddVeninModal`). La modale a un PanResponder pour le swipe-to-close.

### Cartographie

La carte Leaflet est intégrée via `react-native-webview`. Les composants `MapExplorerView` et `TunisiaMapCard` génèrent du HTML avec Leaflet.js et l'injectent dans une WebView. Les marqueurs sont positionnés selon les coordonnées des fermes.

### Profil et édition

`EditProfileScreen.tsx` permet de modifier le nom, le genre et la région. La région est sélectionnée via un picker modal avec la liste des gouvernorats tunisiens.

## 6. Landing Page

La landing page (`app/page.tsx`) est un **Server Component** Next.js — il n'y a pas de JavaScript côté client sur cette page (sauf les composants `"use client"` qu'elle importe).

Sections :
1. **Hero** : photo plein écran avec dégradé sombre, titre, CTA, formes décoratives orange
2. **Pitch** : carte violette avec texte de valeur + showcase app
3. **Feature Tags** : marquee infinie avec labels "App mobile", "Surveillance", etc.
4. **Impact** : section avec aperçu du dashboard
5. **Pourquoi Nahoul ?** : carrousel horizontal infini de cartes avec photos et descriptions
6. **Contact CTA** : bande orange avec bouton "Demander un devis"
7. **Footer** : logo, contacts, réseaux sociaux, stores badges

Les animations sont purement CSS (`@keyframes landing-marquee` et `pourquoi-marquee`). Le marquee utilise un `-webkit-mask-image` pour un effet de fondu aux bords. `prefers-reduced-motion` désactive les animations et passe en wrap.

### SEO

La landing page a des `aria-label` sur chaque section, des `sr-only` pour les listes dupliquées (accessibilité), et des balises `<h1>`/`<h2>` structurées. Les métadonnées sont définies dans `app/layout.tsx`.

## 7. Authentification & Sécurité

### Flow réel

1. L'utilisateur envoie email + password → `POST /api/auth/login`
2. Le serveur cherche l'utilisateur dans MongoDB avec `select("+passwordHash")` (le hash est caché par défaut dans le schéma)
3. `verifyPassword()` compare avec bcrypt
4. Si OK → `writeSessionCookie()` crée un **token stateless** : `base64url(payload).base64url(hmac(payload, secret))`
5. Le cookie est set en httpOnly, sameSite lax, secure en production
6. Le token contient `{ uid, exp }` avec une expiration à 7 jours
7. À chaque requête protégée, `getCurrentUser()` lit le cookie, vérifie la signature HMAC avec `timingSafeEqual()`, vérifie l'expiration

### Session mobile

Le mobile stocke le token dans AsyncStorage. L'intercepteur Axios dans `services/api.ts` ajoute `Authorization: Bearer <token>` à chaque requête. Le serveur vérifie le Bearer token en priorité dans `readSession()`.

### Rôles et permissions

Définis dans `lib/auth/roles.ts` :
- `super-admin` : tout voir, tout modifier (gère les admins)
- `admin` : gère les apiculteurs, la maintenance, les messages
- `apiculteur` : voit ses propres fermes/ruches, crée des tickets

Les routes API vérifient avec `canDo(role, permission)` avant chaque opération sensible.

### Subscription gate

Les apiculteurs ne peuvent se connecter que si leur abonnement est actif. `checkApiculteurAccess()` est appelé au login **et** à chaque requête via `getCurrentUser()`, ce qui permet de révoquer une session en cours si l'abonnement expire.

### Audit

Tout login (réussi ou échoué), logout, création/modification/suppression est tracé. Les mots de passe ne sont jamais loggés.

## 8. API & Data Flow

### Organisation des routes

37 route handlers dans `app/api/` organisés par domaine :
- `auth/` : login, logout, me, heartbeat, profile
- `fermes/` : CRUD fermes
- `ruches/` : CRUD ruches
- `apiculteurs/` : CRUD apiculteurs (admin)
- `admins/` : CRUD admins (super-admin) + export CSV
- `maintenance/` : tickets + réponses + export
- `notifications/` : liste, lecture, stream, read-all
- `mobile/` : ruche-data (payload complet pour l'app mobile), sessions (CRUD sessions de récolte), alerts/bulk
- `contact-messages/` : inbox
- `gateways/` : liste gateways
- `dashboard/stats` : métriques dashboard
- `audit-logs/` : journal d'audit
- `simulator/` : endpoints pour le simulateur hardware
- `users/:id/profile-preview` : preview profil utilisateur

### Mobile data endpoint : `/api/mobile/ruche-data`

C'est l'endpoint le plus important pour le mobile. Il agrège :
- Les fermes de l'apiculteur connecté
- Les ruches avec leurs métriques (température, humidité, batterie, production)
- Les alertes actives
- Les séries temporelles (production, tension, batterie, pression)
- Les données météo simulées
- Les sessions de récolte

Le filtre temporel (`1S`, `1M`, `3M`, `6M`, `1A`) est passé en query parameter et modifie l'agrégation des séries.

### Sessions de récolte

Les sessions sont stockées dans les sous-documents `gateway[].sessions[]` du modèle Apiculteur. Le mobile peut lister (GET), créer (POST) et supprimer (DELETE) des sessions via `/api/mobile/sessions`. Chaque session a une date, une heure, un poids en grammes, et optionnellement un hiveId.

### Gestion d'erreurs

Tous les handlers API sont wrappés dans des try/catch. Les erreurs MongoDB sont catchées et retournent un 500 avec un message générique. Les erreurs de validation retournent un 400 avec le champ concerné. Les erreurs d'authentification retournent 401. Les erreurs de permission retournent 403.

## 9. Fonctionnalités Implémentées

### Fonctionnalité 1 : Dashboard avec présence temps réel

Le dashboard super-admin montre les admins connectés en temps réel. J'ai implémenté un système de heartbeat où le client envoie `POST /api/auth/heartbeat` toutes les 45 secondes. Le serveur met à jour `lastActiveAt` sur l'utilisateur. La fenêtre de présence est de 90 secondes — si le heartbeat n'est pas reçu pendant ce délai, l'utilisateur passe "hors ligne".

Ce qui a été compliqué : il fallait que le heartbeat continue à fonctionner même quand l'onglet est en arrière-plan, et qu'il s'arrête proprement au logout. J'ai utilisé `useHeartbeat()` qui s'abonne à l'événement `visibilitychange` pour arrêter/reprendre le timer.

### Fonctionnalité 2 : Système d'audit complet

Toutes les actions sont tracées dans une collection append-only. L'audit est best-effort — si l'écriture échoue, l'erreur est loggée dans la console mais la requête utilisateur ne plante pas. J'ai implémenté `diffFields()` qui compare les champs avant/après pour les mises à jour et ne garde que les différences.

Le plus dur a été de s'assurer que les mots de passe ne fuient jamais dans les logs. La fonction `diffFields()` ignore les champs qui ne sont pas explicitement listés, et j'ai ajouté une règle dans les actions que `user.password.change` n'inclut pas de diff.

### Fonctionnalité 3 : Mobile data endpoint

L'API `/api/mobile/ruche-data` est l'épine dorsale de l'application mobile. Elle agrège les données de plusieurs collections MongoDB (Apiculteur, Alert, Telemetry) et les transforme dans un format que le mobile peut consommer directement. Les séries temporelles sont agrégées selon un filtre (`1S` = quotidien, `1M` = hebdomadaire, etc.).

Le challenge : les données viennent de plusieurs sources avec des formats différents. Les sessions de récolte sont dans les sous-documents gateways, les alertes dans une collection dédiée, la télémétrie IoT dans une autre. J'ai dû normaliser tout ça dans un seul payload tout en gardant les performances correctes.

### Fonctionnalité 4 : Scan QR gateway

Sur mobile, l'utilisateur peut appairer une gateway IoT en scannant un QR code. J'ai utilisé `expo-camera` pour le scan. Le format du QR est validé côté client avant l'envoi à l'API. Si le format est valide, le numéro de série est extrait et associé à la ferme sélectionnée.

J'ai géré le cas où la permission caméra n'est pas accordée — le bouton de scan est désactivé et un message guide l'utilisateur vers les permissions. Il y a aussi une option de saisie manuelle en fallback.

### Fonctionnalité 5 : Landing page avec animations CSS

La landing page utilise des animations CSS pures pour les marquees infinis. Pas de bibliothèque JS — juste des `@keyframes` avec `translateX(-50%)` sur un track dupliqué. J'ai ajouté un `-webkit-mask-image` pour l'effet de fondu aux bords, et `prefers-reduced-motion` pour l'accessibilité.

### Fonctionnalité 6 : Système de rôles et permissions

Un système de permissions granular défini dans `lib/auth/roles.ts`. Chaque permission est une chaîne comme `"admins.create"` et liste les rôles autorisés. La sidebar, le middleware et les routes API lisent tous la même source de vérité. J'ai évité les chaînes de rôles en dur dans les composants.

### Fonctionnalité 7 : Gestion de maintenance avec fil de discussion

Les apiculteurs peuvent créer des tickets de maintenance. Les admins peuvent répondre et marquer comme traités. Chaque ticket a un snapshot dénormalisé de l'apiculteur (nom, email, avatar) pour que le ticket reste lisible même si l'apiculteur est supprimé plus tard.

### Fonctionnalité 8 : Simulateur hardware

Un simulateur Python avec Tkinter (`simulator/simulator.py`) qui émule les gateways IoT. Il envoie des données de télémétrie simulées à l'API et peut générer des QR codes pour tester le flow d'appairage mobile.

## 10. Défis Techniques

### Le stateless session token

J'avais initialement pensé à utiliser une session stockée en DB, mais ça ajoutait une requête MongoDB à chaque page protégée. J'ai opté pour des tokens stateless signés avec HMAC-SHA256. Le payload contient juste l'UID et l'expiration, le tout encodé en base64url. La vérification se fait en temps constant avec `timingSafeEqual()`.

Le compromis : impossible de révoquer une session individuellement sans une blacklist Redis. Pour l'instant, la révocation se fait via le subscription gate sur l'apiculteur.

### Navigation mobile sans React Navigation

La navigation manuelle dans l'app mobile a été un choix un peu bizarre au début. Le composant `Shell` a un switch énorme qui rend chaque écran selon l'état `screen`. La bottom tab bar est aussi gérée manuellement.

Le problème principal : la gestion des paramètres entre les écrans. J'ai utilisé un paramètre `payload` optionnel dans `onNavigate(screen, payload)` pour passer l'ID de la ferme ou de la ruche. C'est fonctionnel mais ça pourrait être mieux avec un vrai routeur.

### Agrégation des séries temporelles

L'endpoint `/api/mobile/ruche-data` doit générer des séries pour 5 périodes différentes (1S, 1M, 3M, 6M, 1A). Chaque période a un bucket différent (jour, semaine, mois). J'ai implémenté `getChartConfig()` qui définit les buckets, puis `aggregateSessions()` qui répartit les sessions dans ces buckets.

Le problème était que les sessions de récolte stockées dans MongoDB n'ont pas toujours une date bien formatée — certaines sont en `DD/MM/YYYY`, d'autres en `YYYY-MM-DD`. J'ai dû ajouter `parseSessionDate()` pour normaliser avant l'agrégation.

### Dénormalisation des données

Pour éviter les requêtes coûteuses, j'ai dénormalisé certaines informations :
- Les tickets de maintenance contiennent un `apiculteurSnapshot` (nom, email, phone)
- Les logs d'audit contiennent un `actor` dénormalisé (id, email, name, role)
- Les notifications ont un `actor` dénormalisé

Le risque : si un utilisateur change son nom, les anciens logs et tickets gardent l'ancien nom. Pour l'instant c'est acceptable vu l'usage.

### Subscription gate avec vérification à chaque requête

Le subscription gate est appelé au login **et** dans `getCurrentUser()` à chaque requête protégée. Ça signifie qu'un apiculteur dont l'abonnement expire en cours de session perd l'accès immédiatement (pas besoin d'attendre le prochain login). Le coût : une requête MongoDB supplémentaire à chaque appel protégé.

### Marquee infini sur la landing page

Pour l'animation des tags et des cartes sur la landing page, j'ai utilisé un pattern de track dupliqué : les éléments sont rendus deux fois, et le track est translaté de 50% avec une animation CSS infinie. Quand le track arrive à -50%, il revient à 0% instantanément (seamless parce que le contenu est identique).

Le souci : sur les écrans larges, le masque de fondu (`-webkit-mask-image`) coupe un peu trop par rapport à la maquette Figma. J'ai ajusté les pourcentages (8% → 92%) pour que ça reste visible.

## 11. Conclusion

Ce projet m'a occupé pendant plusieurs mois. C'est une plateforme complète qui va de la landing page vitrine jusqu'au mobile avec scan QR, en passant par un dashboard avec monitoring temps réel et un système de maintenance.

J'ai appris à gérer l'agrégation de données MongoDB pour les séries temporelles, à implémenter une authentification stateless sans dépendre de NextAuth, et à structurer une application mobile Expo avec navigation manuelle.

Si je devais refaire certaines parties, je remplacerais la navigation mobile par React Navigation (plus maintenable) et j'ajouterais une couche Redis pour la révocation des sessions. Mais globalement, la plateforme fonctionne et couvre les besoins : gestion des fermes et ruches, suivi de production de venin, alertes, et communication admin ↔ apiculteur.
