# 🐝 Nectaious — Beehive Monitor

Full-stack **beehive monitoring & apiary management platform** for beekeepers, farm administrators and venom-harvesting operations. Built as a final-year engineering project (PFE) and production-minded from day one.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green?logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8?logo=tailwindcss)
![Expo](https://img.shields.io/badge/Mobile-Expo_React_Native-000020?logo=expo)

## ✨ Features

- **Role-based portals** — administrators, apiarists (beekeepers) and contact messaging
- **Apiary management** — farms (`fermes`), hives (`ruches`), maintenance scheduling and intervention tracking
- **Audit logs & notifications** — every sensitive action is traceable
- **IoT-ready data model** — hive sensor readings and alerts modeled for device integration
- **Hive simulator** — generate realistic telemetry for demos and load testing
- **Mobile companion app** — Expo / React Native client sharing the same API
- **Design system** — custom tokens, component library and live `/style-guide` route
- **UML documentation suite** — use-case, class, sequence diagrams + test plan ([`docs/`](docs))

## 🏗️ Architecture

```
Web (Next.js 15 App Router, RSC)  ──┐
                                    ├──►  REST API (Route Handlers)  ──►  MongoDB (Mongoose)
Mobile (Expo React Native)       ──┘                                    └─►  Simulator / seeders
```

## 🚀 Getting started

**Web**

```bash
npm install
cp .env.example .env   # set MONGODB_URI
npm run dev            # http://localhost:3000
```

Useful scripts: `seed`, `seed:fake`, `db:check`, `verify-login`.

**Mobile**

```bash
cd mobile
npm install
npx expo start
```

## 📁 Project structure

```
app/            # App Router pages: (auth), (app), api, style-guide
components/     # Reusable UI components
lib/            # DB clients, auth, helpers
models/         # Mongoose models (Apiary, Hive, Alert, AuditLog…)
scripts/        # Seeders & maintenance scripts
simulator/      # Hive telemetry simulator
docs/           # UML diagrams, design tokens, test plan
mobile/         # Expo React Native companion app
```

## 🧪 Engineering highlights

- Server Components by default with typed Route Handlers
- Middleware-based auth guards and role routing
- Audit-log model covering admin actions
- Deterministic seeders for reproducible demo environments
- Documented design system with a live style-guide page

## 📄 License

MIT — see [LICENSE](LICENSE).
