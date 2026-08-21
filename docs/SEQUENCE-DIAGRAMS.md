# Diagrammes de Séquence — Nahoul / Nectarios

---

## 1. Flux d'Authentification (Auth Flow)

### PlantUML

```plantuml
@startuml SD_Auth

title Flux d'Authentification — Nahoul

actor Utilisateur as U
participant "Client\n(Browser / Mobile)" as C
participant "Middleware\n(Edge)" as MW
participant "POST /api/auth/login" as L
participant "GET /api/auth/me" as ME
participant "POST /api/auth/logout" as LO
database "MongoDB\n(User)" as DB
participant "AuditLog" as AL
participant "SessionCookie\n(HMAC-SHA256)" as SC

== Connexion ==
U -> C : Saisit email + mot de passe
C -> L : POST { email, password }
L -> DB : findOne({ email }).select("+passwordHash")
DB --> L : User doc ou null

alt Utilisateur inexistant ou inactif
    L -> AL : logAudit(failure, reason: user-not-found | inactive)
    L --> C : 401 { error: "Identifiants invalides." }
    C --> U : Message d'erreur
else Mot de passe invalide
    L -> L : verifyPassword(password, passwordHash)
    L -> AL : logAudit(failure, reason: bad-password)
    L --> C : 401 { error: "Identifiants invalides." }
    C --> U : Message d'erreur
else Abonnement expiré (apiculteur)
    L -> DB : checkApiculteurAccess(email) → Apiculteur
    L -> AL : logAudit(failure, reason: subscription-expired)
    L --> C : 403 { error, reason }
    C --> U : Abonnement expiré
else Connexion réussie
    L -> SC : writeSessionCookie(userId)\ncréer token HMAC (7 jours)
    SC --> L : token
    L -> DB : updateOne({ lastLoginAt, lastActiveAt })
    L -> AL : logAudit(success, auth.login)
    L --> C : 200 { user, token } + Set-Cookie: nahoul.session
    C --> U : Redirection vers Dashboard
end

== Vérification de session (chaque requête protégée) ==
C -> MW : GET /dashboard (avec cookie)
MW -> ME : GET /api/auth/me
ME -> SC : readSession() → vérifie HMAC + exp
SC --> ME : { uid, exp } ou null
alt Session valide
    ME -> DB : User.findById(uid)
    DB --> ME : User
    ME --> C : 200 { user }
else Session invalide/expirée
    ME --> C : 401 { error: "Not authenticated" }
    C --> U : Redirection /login
end

== Déconnexion ==
U -> C : Clic Déconnexion
C -> LO : POST /api/auth/logout (avec cookie)
LO -> SC : getCurrentUser() → lit session
LO -> SC : clearSessionCookie() → maxAge=0
LO -> DB : updateOne({ lastActiveAt: null })
LO -> AL : logAudit(auth.logout)
LO --> C : 200 { ok: true }
C --> U : Redirection /login

== Heartbeat (présence temps réel) ==
loop toutes les 60 secondes
    C -> C : POST /api/auth/heartbeat
    note right : Met à jour lastActiveAt
    note right : Utilisateur considéré online si\nlastActiveAt > now - 90s
end

@enduml
```

### Mermaid

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant C as Client (Browser/Mobile)
    participant L as POST /api/auth/login
    participant DB as MongoDB (User)
    participant SC as SessionCookie (HMAC-SHA256)
    participant AL as AuditLog
    participant LO as POST /api/auth/logout

    Note over U,AL: === CONNEXION ===
    U->>C: Saisit email + mot de passe
    C->>L: POST { email, password }
    L->>DB: findOne({ email }).select("+passwordHash")
    DB-->>L: User doc ou null

    alt Utilisateur inexistant ou inactif
        L->>AL: logAudit(failure, user-not-found)
        L-->>C: 401 Identifiants invalides
        C-->>U: Message d'erreur
    else Mot de passe invalide
        L->>AL: logAudit(failure, bad-password)
        L-->>C: 401 Identifiants invalides
    else Abonnement expiré (apiculteur)
        L->>DB: checkApiculteurAccess(email)
        L->>AL: logAudit(failure, subscription-expired)
        L-->>C: 403 Abonnement expiré
    else Succès
        L->>SC: writeSessionCookie(userId) — HMAC-SHA256, 7j
        SC-->>L: token
        L->>DB: updateOne({ lastLoginAt, lastActiveAt })
        L->>AL: logAudit(success, auth.login)
        L-->>C: 200 { user, token } + Set-Cookie
        C-->>U: Redirection Dashboard
    end

    Note over U,AL: === VÉRIFICATION DE SESSION ===
    C->>L: GET /api/auth/me (avec cookie)
    L->>SC: readSession() → vérifie HMAC + exp
    alt Session valide
        SC-->>L: { uid, exp }
        L->>DB: User.findById(uid)
        DB-->>L: User
        L-->>C: 200 { user }
    else Invalide/expirée
        SC-->>L: null
        L-->>C: 401 Not authenticated
        C-->>U: Redirection /login
    end

    Note over U,AL: === DÉCONNEXION ===
    U->>C: Clic Déconnexion
    C->>LO: POST /api/auth/logout
    LO->>SC: clearSessionCookie (maxAge=0)
    LO->>DB: updateOne({ lastActiveAt: null })
    LO->>AL: logAudit(auth.logout)
    LO-->>C: 200 { ok: true }
    C-->>U: Redirection /login
```

---

## 2. Appairage d'une Ruche (Device Pairing via QR)

### PlantUML

```plantuml
@startuml SD_Appairage

title Appairage d'une Ruche — Gateway QR / Manuel

actor "Apiculteur" as A
participant "App Mobile" as M
participant "Caméra QR" as QR
participant "POST /api/gateways" as GW
participant "GET /api/auth/me" as AUTH
database "MongoDB\n(Apiculteur)" as DB
database "MongoDB\n(Telemetry)" as TEL
participant "AuditLog" as AL

A -> M : Navigue vers Appairage
M -> AUTH : Vérifie session (getCurrentUser)
AUTH --> M : { user: apiculteur }

A -> M : Choisit mode QR ou Manuel

alt Mode QR Code
    M -> QR : Active caméra
    A -> QR : Pointe vers QR code gateway
    QR --> M : Décode { serialNumber (gateway_id) }
    M -> M : Extrait serialNumber du QR
else Mode Manuel
    A -> M : Saisit serialNumber + label
end

A -> M : Sélectionne la ferme (fermeId)
M -> GW : POST /api/gateways\n{ fermeId, serialNumber, source: "qr"|"manual",\n  label, payload? }

GW -> GW : canDo(role, "hives.update.own") → vérif permission
GW -> DB : findApiculteurForSession(session)
DB --> GW : Apiculteur doc

GW -> GW : Vérifie duplicate\n(serialNumber déjà associé ?)
alt Doublon détecté
    GW --> M : 409 { error: "Cette gateway est deja associee." }
    M --> A : Erreur doublon
end

alt Payload incomplet (QR simplifié)
    GW -> TEL : findOne({ gatewayId: serialNumber })
    TEL --> GW : Telemetry doc (payload riche)
end

GW -> DB : Apiculteur.fermes.id(fermeId)
GW -> DB : ferme.gateways.push({ serialNumber, label, source, pairedAt, payload })
GW -> DB : Incrémente ferme.gatewayCount

alt payload.end_device_data existe
    GW -> DB : ferme.ruches.push({ name: deviceId, serial: deviceId })
    GW -> DB : Incrémente ferme.rucheCount + apiculteur.rucheCount
    note right : Auto-crée la Ruche à partir du device_id
end

alt payload.gateway_location existe
    GW -> DB : Met à jour ferme.lat / ferme.lng
end

GW -> DB : apiculteur.save()
GW -> AL : logAudit(GatewayPair, success)
GW --> M : 201 { gateway, ferme }
M --> A : Confirmation "Gateway appairée !"

@enduml
```

### Mermaid

```mermaid
sequenceDiagram
    actor A as Apiculteur
    participant M as App Mobile
    participant QR as Caméra QR
    participant GW as POST /api/gateways
    participant DB as MongoDB (Apiculteur)
    participant TEL as MongoDB (Telemetry)
    participant AL as AuditLog

    A->>M: Navigue vers Appairage
    M->>GW: GET /api/auth/me — vérifie session
    GW-->>M: { user: apiculteur }

    alt Mode QR Code
        M->>QR: Active caméra
        A->>QR: Pointe vers QR code gateway
        QR-->>M: Décode serialNumber
    else Mode Manuel
        A->>M: Saisit serialNumber + label
    end

    A->>M: Sélectionne la ferme (fermeId)
    M->>GW: POST /api/gateways { fermeId, serialNumber, source, payload? }
    GW->>GW: canDo(role, "hives.update.own")
    GW->>DB: findApiculteurForSession(session)
    DB-->>GW: Apiculteur doc

    GW->>GW: Vérifie doublon serialNumber
    alt Doublon
        GW-->>M: 409 Gateway déjà associée
        M-->>A: Erreur doublon
    end

    alt Payload QR simplifié / vide
        GW->>TEL: findOne({ gatewayId: serialNumber })
        TEL-->>GW: Payload riche (end_device_data, location…)
    end

    GW->>DB: ferme.gateways.push({ serialNumber, source, pairedAt, payload })
    GW->>DB: Incrémente ferme.gatewayCount

    alt payload.end_device_data présent
        GW->>DB: ferme.ruches.push({ name: deviceId })
        GW->>DB: Incrémente rucheCount
        Note right of DB: Auto-création de la Ruche
    end

    GW->>DB: apiculteur.save()
    GW->>AL: logAudit(GatewayPair, success)
    GW-->>M: 201 { gateway, ferme }
    M-->>A: Confirmation "Gateway appairée !"
```

---

## 3. Contrôle du Contrôleur de Venin (Venom Collection Session)

### PlantUML

```plantuml
@startuml SD_Venin

title Contrôle du Collecteur de Venin

actor "Apiculteur" as A
participant "App Mobile\n(Écran Venin)" as M
participant "GET /api/mobile/sessions" as SGET
participant "POST /api/mobile/sessions" as SPOST
participant "DELETE /api/mobile/sessions" as SDEL
database "MongoDB\n(Apiculteur →\nFerme → Gateway\n→ Sessions)" as DB

== Consultation des sessions de collecte ==
A -> M : Ouvre onglet Venin
M -> SGET : GET /api/mobile/sessions?farmId=<id>
SGET -> DB : Apiculteur.findOne({ userId })\n→ ferme → gateways[0].sessions
DB --> SGET : [ { id, date, time } ... ]
SGET --> M : 200 [ sessions ]
M --> A : Affiche tableau des sessions

== Démarrage d'une session de collecte ==
A -> M : Appuie sur "Démarrer la collecte"
M -> M : Sélectionne date + heure (auto ou manuel)

A -> M : Appuie sur "Confirmer"
M -> SPOST : POST /api/mobile/sessions\n{ farmId, gatewayId?, date, time, grams, hiveId? }
SPOST -> DB : Apiculteur.findOne({ userId })\n→ ferme.id(farmId)

alt Aucune gateway existante
    SPOST -> DB : Crée gateway par défaut "GW-001"
end

SPOST -> DB : targetGateway.sessions.push({ date, time, grams, hiveId })
SPOST -> DB : apiculteur.save()
DB --> SPOST : Session sauvegardée avec _id
SPOST --> M : 201 { id, date, time, grams }
M --> A : Session ajoutée ✓

== Arrêt / Suppression d'une session ==
A -> M : Swipe left ou clic "Supprimer"
M -> SDEL : DELETE /api/mobile/sessions?farmId=<id>&id=<sessionId>
SDEL -> DB : Trouve session par _id\nfirstGateway.sessions.splice(index, 1)
SDEL -> DB : apiculteur.save()
SDEL --> M : 200 { success: true }
M --> A : Session retirée

@enduml
```

### Mermaid

```mermaid
sequenceDiagram
    actor A as Apiculteur
    participant M as App Mobile (Venin)
    participant SGET as GET /api/mobile/sessions
    participant SPOST as POST /api/mobile/sessions
    participant SDEL as DELETE /api/mobile/sessions
    participant DB as MongoDB (Apiculteur→Ferme→Gateway→Sessions)

    Note over A,DB: === CONSULTATION ===
    A->>M: Ouvre onglet Venin
    M->>SGET: GET /api/mobile/sessions?farmId=X
    SGET->>DB: findOne({ userId }) → ferme → gateways[0].sessions
    DB-->>SGET: [ { id, date, time } ]
    SGET-->>M: 200 sessions[]
    M-->>A: Tableau des sessions collecte

    Note over A,DB: === DÉMARRAGE SESSION ===
    A->>M: Appuie "Démarrer la collecte"
    M->>M: Sélectionne date + heure
    A->>M: Confirme
    M->>SPOST: POST { farmId, date, time, grams, hiveId? }
    SPOST->>DB: findOne({ userId }) → ferme.id(farmId)

    alt Aucune gateway existante
        SPOST->>DB: Crée gateway par défaut GW-001
    end

    SPOST->>DB: sessions.push({ date, time, grams, hiveId })
    SPOST->>DB: apiculteur.save()
    DB-->>SPOST: Session avec _id
    SPOST-->>M: 201 { id, date, time, grams }
    M-->>A: ✓ Session ajoutée

    Note over A,DB: === SUPPRESSION SESSION ===
    A->>M: Supprimer une session
    M->>SDEL: DELETE ?farmId=X&id=sessionId
    SDEL->>DB: sessions.splice(index, 1) + save()
    DB-->>SDEL: OK
    SDEL-->>M: 200 { success: true }
    M-->>A: Session retirée
```

---

## 4. Demande de Maintenance

### PlantUML

```plantuml
@startuml SD_Maintenance

title Demande de Maintenance

actor "Apiculteur" as AP
actor "Admin / Super-Admin" as ADMIN
participant "App Mobile /\nInterface Web" as UI
participant "POST /api/maintenance" as MP
participant "GET /api/maintenance" as MG
participant "PATCH /api/maintenance/[id]" as MU
database "MongoDB\n(Apiculteur)" as DBA
database "MongoDB\n(Maintenance)" as DBM
participant "Notifications\n(pushNotification)" as NOTIF
participant "AuditLog" as AL

== Création d'une demande (par l'apiculteur) ==
AP -> UI : Remplit formulaire\n(titre, description, dates,\npièce jointe?)
UI -> MP : POST /api/maintenance\n{ title, description, startedAt,\n  dueAt, attachmentUrl }

MP -> MP : getCurrentUser() → session
MP -> DBA : Apiculteur.findOne({ email: session.email })
DBA --> MP : Apiculteur + snapshot

MP -> DBM : Maintenance.create({\n  apiculteurId,\n  apiculteurSnapshot,\n  title, description,\n  status: "non-traite"\n})
DBM --> MP : doc créé (_id)

MP -> AL : logAudit(MaintenanceCreate)

MP -> NOTIF : pushNotifications([\n  { role: "super-admin", … },\n  { role: "admin", … }\n])
NOTIF -> DBM : Insère Notification pour\nsuper-admin + admin

MP --> UI : 201 { item }
UI --> AP : "Demande envoyée ✓"

== Consultation de la liste (par l'admin) ==
ADMIN -> UI : Ouvre Gestion Maintenance
UI -> MG : GET /api/maintenance?page=1&status=non-traite
MG -> DBM : Maintenance.find(filter).sort().limit()
DBM --> MG : [ demandes ]
MG --> UI : 200 { items, total, stats }
UI --> ADMIN : Liste des demandes

== Traitement d'une demande (par l'admin) ==
ADMIN -> UI : Ouvre le ticket\nAjoute un commentaire
UI -> MU : PATCH /api/maintenance/:id\n{ reply: { body } }
MU -> DBM : Maintenance.findById(id)\n→ replies.push(reply)
MU -> DBM : lastActivityAt = now
DBM --> MU : doc mis à jour
MU -> NOTIF : pushNotification({ userId: apiculteurUserId })
MU -> AL : logAudit(MaintenanceReply)
MU --> UI : 200 { item }

ADMIN -> UI : Marque comme "Traité"
UI -> MU : PATCH /api/maintenance/:id\n{ status: "traite" }
MU -> DBM : status = "traite"\ntreatedAt = now\ntreatedBy = { id, name, role }
MU -> AL : logAudit(MaintenanceUpdate, status: traite)
MU -> NOTIF : pushNotification({ userId: apiculteurUserId,\n  "Votre demande a été traitée" })
MU --> UI : 200 { item }
UI --> ADMIN : Demande clôturée ✓

@enduml
```

### Mermaid

```mermaid
sequenceDiagram
    actor AP as Apiculteur
    actor ADMIN as Admin / Super-Admin
    participant UI as App Mobile / Web
    participant MP as POST /api/maintenance
    participant MG as GET /api/maintenance
    participant MU as PATCH /api/maintenance/[id]
    participant DBA as MongoDB (Apiculteur)
    participant DBM as MongoDB (Maintenance)
    participant NOTIF as Notifications
    participant AL as AuditLog

    Note over AP,AL: === CRÉATION DE DEMANDE ===
    AP->>UI: Remplie formulaire (titre, description, dates)
    UI->>MP: POST /api/maintenance { title, description, startedAt, dueAt }
    MP->>MP: getCurrentUser() → vérifie session
    MP->>DBA: findOne({ email }) → snapshot apiculteur
    DBA-->>MP: Apiculteur doc
    MP->>DBM: Maintenance.create({ apiculteurSnapshot, title, status: "non-traite" })
    DBM-->>MP: doc _id
    MP->>AL: logAudit(MaintenanceCreate)
    MP->>NOTIF: pushNotifications([super-admin, admin])
    NOTIF->>DBM: Insère Notification × 2
    MP-->>UI: 201 { item }
    UI-->>AP: Demande envoyée ✓

    Note over AP,AL: === CONSULTATION (ADMIN) ===
    ADMIN->>UI: Ouvre Gestion Maintenance
    UI->>MG: GET /api/maintenance?status=non-traite
    MG->>DBM: find(filter).sort().limit()
    DBM-->>MG: demandes[]
    MG-->>UI: 200 { items, stats }
    UI-->>ADMIN: Liste des demandes

    Note over AP,AL: === TRAITEMENT (ADMIN) ===
    ADMIN->>UI: Ajoute commentaire
    UI->>MU: PATCH /id { reply: { body } }
    MU->>DBM: replies.push(reply); lastActivityAt = now
    MU->>NOTIF: pushNotification(apiculteurUserId)
    MU->>AL: logAudit(MaintenanceReply)
    MU-->>UI: 200 { item }

    ADMIN->>UI: Marque "Traité"
    UI->>MU: PATCH /id { status: "traite" }
    MU->>DBM: status="traite", treatedAt=now, treatedBy={…}
    MU->>NOTIF: pushNotification(apiculteurUserId, "Demande traitée")
    MU->>AL: logAudit(MaintenanceUpdate)
    MU-->>UI: 200 { item }
    UI-->>ADMIN: Demande clôturée ✓
```

---

## 5. Gestion des Alertes

### PlantUML

```plantuml
@startuml SD_Alertes

title Gestion des Alertes

participant "Simulateur IoT /\nGateway" as IOT
participant "POST /api/simulator" as SIM
database "MongoDB\n(Telemetry)" as TELEM
database "MongoDB\n(Alert)" as ALERT_DB
database "MongoDB\n(Apiculteur)" as API_DB
participant "Notifications\n(pushNotification)" as NOTIF
actor "Apiculteur" as AP
participant "App Mobile\n(Écran Alertes)" as M
participant "GET /api/mobile/alerts" as AG
participant "PATCH /api/mobile/alerts/bulk" as AB

== Génération automatique d'une alerte ==
IOT -> SIM : POST données capteur\n{ gatewayId, hiveId, payload:\n  { battery_level, weight, temperature,\n    venom_level, … } }

SIM -> TELEM : Enregistre Telemetry doc

SIM -> SIM : Analyse payload :\n• battery < seuil → alerte batterie\n• capteur hors plage → alerte capteur\n• anomalie venin → alerte venin

SIM -> API_DB : Trouve Apiculteur\npar gatewayId → ferme
SIM -> ALERT_DB : Alert.create({\n  userId, hiveId, hiveName, farmName,\n  title, category, tone, status: "Non resolue"\n})

SIM -> API_DB : ruche.status = "alerte"\nruche.alerts += 1
SIM -> NOTIF : pushNotification({ userId,\n  "Alerte : <titre>" })
NOTIF -> ALERT_DB : Insère Notification

== Consultation des alertes par l'apiculteur ==
AP -> M : Ouvre onglet Alertes
M -> AG : GET /api/mobile/alerts\n?page=1&status=all
AG -> ALERT_DB : Alert.find({ userId })\n.sort({ createdAt: -1 })
ALERT_DB --> AG : [ alertes ]
AG --> M : 200 { alerts, stats:\n  total, unresolved, byCategory }
M --> AP : Liste des alertes avec\nbadges couleur (orange/red/purple)

== Résolution d'une alerte ==
AP -> M : Appuie "Marquer comme résolue"
M -> AB : PATCH /api/mobile/alerts/bulk\n{ ids: ["id1"], status: "Resolue" }
AB -> ALERT_DB : Alert.updateMany(\n{ _id: { $in: ids }, userId },\n{ $set: { status: "Resolue" } }\n)
ALERT_DB --> AB : nModified
AB -> API_DB : Recalcule ruche.alerts\n(count restants)
AB --> M : 200 { updated }
M --> AP : Alerte marquée résolue ✓

@enduml
```

### Mermaid

```mermaid
sequenceDiagram
    participant IOT as Simulateur IoT / Gateway
    participant SIM as POST /api/simulator
    participant TELEM as MongoDB (Telemetry)
    participant ALERT_DB as MongoDB (Alert)
    participant API_DB as MongoDB (Apiculteur)
    participant NOTIF as Notifications
    actor AP as Apiculteur
    participant M as App Mobile (Alertes)
    participant AG as GET /api/mobile/alerts
    participant AB as PATCH /api/mobile/alerts/bulk

    Note over IOT,NOTIF: === GÉNÉRATION AUTOMATIQUE D'ALERTE ===
    IOT->>SIM: POST données capteur { gatewayId, hiveId, payload }
    SIM->>TELEM: Enregistre Telemetry doc
    SIM->>SIM: Analyse seuils (batterie, capteur, venin…)
    SIM->>API_DB: Trouve Apiculteur via gatewayId
    SIM->>ALERT_DB: Alert.create({ userId, hiveId, title, category, tone, status: "Non resolue" })
    SIM->>API_DB: ruche.status="alerte"; ruche.alerts++
    SIM->>NOTIF: pushNotification(userId, "Alerte: titre")
    NOTIF->>ALERT_DB: Insère Notification

    Note over AP,AB: === CONSULTATION (APICULTEUR) ===
    AP->>M: Ouvre onglet Alertes
    M->>AG: GET /api/mobile/alerts?page=1&status=all
    AG->>ALERT_DB: find({ userId }).sort({ createdAt: -1 })
    ALERT_DB-->>AG: alertes[]
    AG-->>M: 200 { alerts, stats: { total, unresolved, byCategory } }
    M-->>AP: Liste alertes avec badges couleur

    Note over AP,AB: === RÉSOLUTION D'ALERTE ===
    AP->>M: Marquer comme résolue
    M->>AB: PATCH /api/mobile/alerts/bulk { ids, status: "Resolue" }
    AB->>ALERT_DB: updateMany({ _id: $in ids, userId }, { status: "Resolue" })
    ALERT_DB-->>AB: nModified
    AB->>API_DB: Recalcule ruche.alerts count
    AB-->>M: 200 { updated }
    M-->>AP: ✓ Alerte résolue
```
