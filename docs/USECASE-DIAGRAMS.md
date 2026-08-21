# Diagrammes de Cas d'Utilisation — Nahoul / Nectarios

---

## Diagramme Global

### PlantUML

```plantuml
@startuml UC_Global

title Diagramme de Cas d'Utilisation Global — Nahoul

left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome

actor "Apiculteur" as AP
actor "Admin" as ADM
actor "Super-Admin" as SA
actor "Système IoT\n(Gateway)" as IOT

rectangle "Système Nahoul" {

  package "Authentification" {
    usecase "Se connecter" as UC_LOGIN
    usecase "Se déconnecter" as UC_LOGOUT
    usecase "Consulter son profil" as UC_PROFILE
  }

  package "Gestion Apiculture" {
    usecase "Voir mes fermes" as UC_FERMES
    usecase "Voir mes ruches" as UC_RUCHES
    usecase "Appairer une gateway (QR/Manuel)" as UC_PAIR
    usecase "Consulter télémétrie temps réel" as UC_TELEM
    usecase "Gérer sessions de collecte venin" as UC_VENIN
  }

  package "Gestion des Alertes" {
    usecase "Recevoir alertes automatiques" as UC_ALERT_AUTO
    usecase "Consulter ses alertes" as UC_ALERT_VIEW
    usecase "Résoudre / clôturer une alerte" as UC_ALERT_RESOLVE
  }

  package "Maintenance" {
    usecase "Créer une demande de maintenance" as UC_MAINT_CREATE
    usecase "Consulter ses demandes" as UC_MAINT_VIEW_AP
    usecase "Gérer toutes les demandes" as UC_MAINT_MANAGE
    usecase "Traiter / répondre à une demande" as UC_MAINT_TREAT
    usecase "Exporter demandes (CSV)" as UC_MAINT_EXPORT
  }

  package "Gestion Utilisateurs" {
    usecase "Gérer les apiculteurs" as UC_API_MGMT
    usecase "Gérer les abonnements" as UC_SUB_MGMT
    usecase "Gérer les admins" as UC_ADM_MGMT
    usecase "Créer / désactiver un compte" as UC_USER_CREATE
  }

  package "Tableau de Bord" {
    usecase "Voir dashboard opérationnel" as UC_DASH
    usecase "Voir statistiques système" as UC_STATS
  }

  package "Notifications" {
    usecase "Recevoir notifications" as UC_NOTIF_RECV
    usecase "Envoyer notification broadcast" as UC_NOTIF_SEND
    usecase "Marquer notifications lues" as UC_NOTIF_READ
  }

  package "Système & Audit" {
    usecase "Consulter journal d'audit" as UC_AUDIT
    usecase "Recevoir données télémétrie" as UC_IOT_DATA
    usecase "Déclencher alerte automatique" as UC_IOT_ALERT
  }

}

' Apiculteur
AP --> UC_LOGIN
AP --> UC_LOGOUT
AP --> UC_PROFILE
AP --> UC_FERMES
AP --> UC_RUCHES
AP --> UC_PAIR
AP --> UC_TELEM
AP --> UC_VENIN
AP --> UC_ALERT_VIEW
AP --> UC_ALERT_RESOLVE
AP --> UC_MAINT_CREATE
AP --> UC_MAINT_VIEW_AP
AP --> UC_NOTIF_RECV
AP --> UC_NOTIF_READ

' Admin
ADM --> UC_LOGIN
ADM --> UC_LOGOUT
ADM --> UC_DASH
ADM --> UC_API_MGMT
ADM --> UC_SUB_MGMT
ADM --> UC_MAINT_MANAGE
ADM --> UC_MAINT_TREAT
ADM --> UC_MAINT_EXPORT
ADM --> UC_NOTIF_RECV
ADM --> UC_NOTIF_READ

' Super-Admin
SA --> UC_LOGIN
SA --> UC_LOGOUT
SA --> UC_DASH
SA --> UC_STATS
SA --> UC_ADM_MGMT
SA --> UC_USER_CREATE
SA --> UC_API_MGMT
SA --> UC_SUB_MGMT
SA --> UC_MAINT_MANAGE
SA --> UC_MAINT_TREAT
SA --> UC_MAINT_EXPORT
SA --> UC_AUDIT
SA --> UC_NOTIF_RECV
SA --> UC_NOTIF_READ
SA --> UC_NOTIF_SEND

' IoT System
IOT --> UC_IOT_DATA
UC_IOT_DATA .> UC_IOT_ALERT : <<include>>
UC_IOT_ALERT .> UC_ALERT_AUTO : <<include>>

' Includes
UC_ALERT_AUTO .> UC_NOTIF_RECV : <<include>>
UC_MAINT_CREATE .> UC_NOTIF_RECV : <<include>>
UC_MAINT_TREAT .> UC_NOTIF_RECV : <<include>>

@enduml
```

### Mermaid

> **Note:** Mermaid ne supporte pas nativement les diagrammes UML "Use Case". La représentation ci-dessous utilise un graphe orienté avec des nœuds stylisés pour approximer le même contenu.

```mermaid
graph LR
    AP(["👤 Apiculteur"])
    ADM(["👤 Admin"])
    SA(["👤 Super-Admin"])
    IOT(["🤖 Système IoT"])

    subgraph AUTH["Authentification"]
        UC_LOGIN["Se connecter"]
        UC_LOGOUT["Se déconnecter"]
        UC_PROFILE["Gérer profil"]
    end

    subgraph APIC["Gestion Apiculture"]
        UC_FERMES["Voir fermes"]
        UC_RUCHES["Voir ruches"]
        UC_PAIR["Appairer gateway QR/Manuel"]
        UC_TELEM["Télémétrie temps réel"]
        UC_VENIN["Sessions collecte venin"]
    end

    subgraph ALERTE["Gestion Alertes"]
        UC_ALERT_AUTO["Recevoir alertes auto"]
        UC_ALERT_VIEW["Consulter alertes"]
        UC_ALERT_RESOLVE["Résoudre alerte"]
    end

    subgraph MAINT["Maintenance"]
        UC_MAINT_CREATE["Créer demande"]
        UC_MAINT_VIEW["Consulter demandes"]
        UC_MAINT_MANAGE["Gérer toutes demandes"]
        UC_MAINT_TREAT["Traiter / répondre"]
        UC_MAINT_EXPORT["Exporter CSV"]
    end

    subgraph USERS["Gestion Utilisateurs"]
        UC_API_MGMT["Gérer apiculteurs"]
        UC_SUB_MGMT["Gérer abonnements"]
        UC_ADM_MGMT["Gérer admins"]
    end

    subgraph DASH["Dashboard & Stats"]
        UC_DASH["Dashboard opérationnel"]
        UC_AUDIT["Journal d'audit"]
    end

    subgraph NOTIF["Notifications"]
        UC_NOTIF_RECV["Recevoir notifications"]
        UC_NOTIF_SEND["Envoyer broadcast"]
        UC_NOTIF_READ["Marquer lues"]
    end

    AP --> AUTH
    AP --> APIC
    AP --> ALERTE
    AP --> UC_MAINT_CREATE
    AP --> UC_MAINT_VIEW
    AP --> NOTIF

    ADM --> AUTH
    ADM --> DASH
    ADM --> UC_API_MGMT
    ADM --> UC_SUB_MGMT
    ADM --> UC_MAINT_MANAGE
    ADM --> UC_MAINT_TREAT
    ADM --> UC_MAINT_EXPORT
    ADM --> NOTIF

    SA --> AUTH
    SA --> DASH
    SA --> UC_ADM_MGMT
    SA --> UC_API_MGMT
    SA --> UC_SUB_MGMT
    SA --> UC_MAINT_MANAGE
    SA --> UC_MAINT_TREAT
    SA --> UC_MAINT_EXPORT
    SA --> UC_AUDIT
    SA --> UC_NOTIF_SEND
    SA --> NOTIF

    IOT -->|envoie données| UC_ALERT_AUTO
    UC_ALERT_AUTO -->|déclenche| UC_NOTIF_RECV
    UC_MAINT_CREATE -->|notifie| UC_NOTIF_RECV
    UC_MAINT_TREAT -->|notifie| UC_NOTIF_RECV
```

---

## Diagrammes Secondaires

### A. Cas d'utilisation — Authentification

```plantuml
@startuml UC_Auth

title Cas d'Utilisation — Authentification

actor "Utilisateur\n(tout rôle)" as U
actor "Système" as S

rectangle "Authentification" {
  usecase "Se connecter\n(email + mot de passe)" as UC1
  usecase "Vérifier identifiants" as UC2
  usecase "Vérifier abonnement\n(apiculteur uniquement)" as UC3
  usecase "Créer token session\n(HMAC-SHA256, 7j)" as UC4
  usecase "Maintenir la présence\n(heartbeat 60s)" as UC5
  usecase "Se déconnecter" as UC6
  usecase "Voir/modifier profil" as UC7
}

U --> UC1
U --> UC5
U --> UC6
U --> UC7

UC1 .> UC2 : <<include>>
UC2 .> UC3 : <<extend>>\n[role == apiculteur]
UC2 .> UC4 : <<include>>\n[si succès]
S --> UC5
UC6 .> UC4 : <<extend>>\n[invalide le cookie]

note right of UC3
  Abonnement expiré ou suspendu
  → connexion refusée (HTTP 403)
end note

@enduml
```

```mermaid
graph TD
    U(["👤 Utilisateur"])
    S(["⚙️ Système"])

    U --> A["Se connecter"]
    A -->|include| B["Vérifier identifiants"]
    B -->|extend si apiculteur| C["Vérifier abonnement"]
    B -->|include si succès| D["Créer token HMAC-SHA256"]
    U --> E["Maintenir présence heartbeat"]
    U --> F["Se déconnecter"]
    U --> G["Voir/modifier profil"]
    F -->|invalide cookie| D
    S --> E
```

---

### B. Cas d'utilisation — Appairage Ruche

```plantuml
@startuml UC_Appairage

title Cas d'Utilisation — Appairage d'une Ruche

actor "Apiculteur" as AP
actor "Système IoT\n(Gateway/Simulateur)" as IOT

rectangle "Appairage Gateway" {
  usecase "Scanner QR code" as UC1
  usecase "Saisir n° série manuellement" as UC2
  usecase "Sélectionner une ferme" as UC3
  usecase "Envoyer demande d'appairage" as UC4
  usecase "Récupérer payload télémétrie\n(si QR simplifié)" as UC5
  usecase "Créer la Ruche automatiquement" as UC6
  usecase "Gérer mes gateways" as UC7
  usecase "Dissocier une gateway" as UC8
}

AP --> UC1
AP --> UC2
AP --> UC3
AP --> UC4
AP --> UC7
AP --> UC8

UC1 .> UC4 : <<include>>
UC2 .> UC4 : <<include>>
UC3 .> UC4 : <<include>>
UC4 .> UC5 : <<extend>>\n[payload incomplet]
UC4 .> UC6 : <<extend>>\n[si end_device_data présent]

IOT --> UC5

note right of UC5
  Telemetry.findOne({ gatewayId })
  Récupère payload complet
  depuis dernière donnée capteur
end note

@enduml
```

```mermaid
graph TD
    AP(["👤 Apiculteur"])
    IOT(["🤖 IoT / Simulateur"])

    AP --> A["Scanner QR code"]
    AP --> B["Saisir n° série manuel"]
    AP --> C["Sélectionner ferme"]

    A -->|include| D["Envoyer demande d'appairage"]
    B -->|include| D
    C -->|include| D

    D -->|extend si QR simple| E["Récupérer payload Telemetry"]
    D -->|extend si end_device_data| F["Créer Ruche automatiquement"]

    IOT --> E

    AP --> G["Gérer mes gateways"]
    AP --> H["Dissocier une gateway"]
```

---

### C. Cas d'utilisation — Collecte de Venin

```plantuml
@startuml UC_Venin

title Cas d'Utilisation — Collecteur de Venin

actor "Apiculteur" as AP

rectangle "Gestion des Sessions de Collecte" {
  usecase "Consulter l'historique des sessions" as UC1
  usecase "Démarrer une session de collecte" as UC2
  usecase "Saisir date, heure et quantité\n(grammes)" as UC3
  usecase "Associer la session à une ruche" as UC4
  usecase "Sauvegarder la session" as UC5
  usecase "Supprimer une session" as UC6
  usecase "Visualiser graphique de production" as UC7
}

AP --> UC1
AP --> UC2
AP --> UC6
AP --> UC7

UC2 .> UC3 : <<include>>
UC3 .> UC4 : <<extend>>\n[si ruche sélectionnée]
UC3 .> UC5 : <<include>>

@enduml
```

```mermaid
graph TD
    AP(["👤 Apiculteur"])

    AP --> A["Consulter historique sessions"]
    AP --> B["Démarrer session de collecte"]
    AP --> C["Supprimer une session"]
    AP --> D["Visualiser graphique production"]

    B -->|include| E["Saisir date, heure, grammes"]
    E -->|extend si ruche| F["Associer à une ruche"]
    E -->|include| G["Sauvegarder la session"]
```

---

### D. Cas d'utilisation — Gestion des Alertes

```plantuml
@startuml UC_Alertes

title Cas d'Utilisation — Gestion des Alertes

actor "Apiculteur" as AP
actor "Système IoT" as IOT

rectangle "Alertes" {
  usecase "Générer alerte automatique\n(batterie / capteur / venin)" as UC1
  usecase "Notifier l'apiculteur" as UC2
  usecase "Mettre à jour statut ruche" as UC3
  usecase "Consulter liste des alertes" as UC4
  usecase "Filtrer alertes\n(statut / catégorie)" as UC5
  usecase "Résoudre une alerte" as UC6
  usecase "Mettre en cours une alerte" as UC7
  usecase "Résolution groupée\n(bulk resolve)" as UC8
}

IOT --> UC1
UC1 .> UC2 : <<include>>
UC1 .> UC3 : <<include>>

AP --> UC4
AP --> UC6
AP --> UC7
AP --> UC8

UC4 .> UC5 : <<extend>>
UC6 .> UC8 : <<extend>>\n[sélection multiple]
UC7 .> UC8 : <<extend>>\n[sélection multiple]

@enduml
```

```mermaid
graph TD
    AP(["👤 Apiculteur"])
    IOT(["🤖 Système IoT"])

    IOT --> A["Générer alerte auto\n(batterie/capteur/venin)"]
    A -->|include| B["Notifier apiculteur"]
    A -->|include| C["Maj statut ruche → alerte"]

    AP --> D["Consulter liste alertes"]
    AP --> E["Résoudre alerte"]
    AP --> F["Mettre en cours"]
    AP --> G["Résolution groupée bulk"]

    D -->|extend| H["Filtrer par statut/catégorie"]
    E -->|extend| G
    F -->|extend| G
```

---

### E. Cas d'utilisation — Maintenance

```plantuml
@startuml UC_Maintenance

title Cas d'Utilisation — Gestion de la Maintenance

actor "Apiculteur" as AP
actor "Admin" as ADM
actor "Super-Admin" as SA

rectangle "Maintenance" {
  usecase "Créer une demande" as UC1
  usecase "Joindre un fichier" as UC2
  usecase "Consulter ses demandes" as UC3
  usecase "Répondre à un ticket" as UC4
  usecase "Voir toutes les demandes" as UC5
  usecase "Filtrer / rechercher\ndemandes" as UC6
  usecase "Marquer comme traitée" as UC7
  usecase "Exporter la liste (CSV)" as UC8
  usecase "Supprimer une demande" as UC9
  usecase "Notifier les parties" as UC10
}

AP --> UC1
AP --> UC3
AP --> UC4

ADM --> UC5
ADM --> UC6
ADM --> UC4
ADM --> UC7
ADM --> UC8

SA --> UC5
SA --> UC6
SA --> UC4
SA --> UC7
SA --> UC8
SA --> UC9

UC1 .> UC2 : <<extend>>\n[si fichier joint]
UC1 .> UC10 : <<include>>
UC7 .> UC10 : <<include>>
UC4 .> UC10 : <<include>>
UC5 .> UC6 : <<extend>>

@enduml
```

```mermaid
graph LR
    AP(["👤 Apiculteur"])
    ADM(["👤 Admin"])
    SA(["👤 Super-Admin"])

    AP --> A["Créer demande"]
    AP --> B["Consulter ses demandes"]
    AP --> C["Répondre à un ticket"]

    ADM --> D["Voir toutes les demandes"]
    ADM --> E["Filtrer / rechercher"]
    ADM --> C
    ADM --> F["Marquer comme traitée"]
    ADM --> G["Exporter CSV"]

    SA --> D
    SA --> E
    SA --> C
    SA --> F
    SA --> G
    SA --> H["Supprimer une demande"]

    A -->|extend si fichier| I["Joindre fichier"]
    A -->|include| J["Notifier admin/super-admin"]
    F -->|include| J
    C -->|include| J
```

---

### F. Cas d'utilisation — Dashboard & Audit (Super-Admin / Admin)

```plantuml
@startuml UC_Dashboard

title Cas d'Utilisation — Dashboard & Audit

actor "Admin" as ADM
actor "Super-Admin" as SA

rectangle "Dashboard & Audit" {
  usecase "Voir statistiques globales\n(ruches, fermes, abonnements)" as UC1
  usecase "Voir admins connectés" as UC2
  usecase "Consulter répartitions géo" as UC3
  usecase "Lire journal d'audit" as UC4
  usecase "Filtrer logs d'audit\n(action / entité / acteur)" as UC5
  usecase "Envoyer notification broadcast" as UC6
  usecase "Gérer les messages Contact" as UC7
}

ADM --> UC1
ADM --> UC3
ADM --> UC7

SA --> UC1
SA --> UC2
SA --> UC3
SA --> UC4
SA --> UC6
SA --> UC7

UC4 .> UC5 : <<extend>>

note bottom of UC2
  Présence = lastActiveAt
  dans les 90 dernières secondes
end note

@enduml
```

```mermaid
graph LR
    ADM(["👤 Admin"])
    SA(["👤 Super-Admin"])

    ADM --> A["Voir stats globales"]
    ADM --> C["Répartition géographique"]
    ADM --> G["Gérer messages Contact"]

    SA --> A
    SA --> B["Voir admins connectés"]
    SA --> C
    SA --> D["Journal d'audit"]
    SA --> E["Notification broadcast"]
    SA --> G

    D -->|extend| F["Filtrer logs"]
```
