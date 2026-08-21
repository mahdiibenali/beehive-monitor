# Diagrammes de Classes — Nahoul / Nectarios

---

## Diagramme Global

### PlantUML

```plantuml
@startuml DC_Global

title Diagramme de Classes Global — Nahoul

skinparam classAttributeIconSize 0
skinparam class {
  BackgroundColor #FAFAFA
  BorderColor #555
  FontSize 12
}

class User {
  +_id : ObjectId
  +name : String
  +email : String [unique]
  -passwordHash : String [select:false]
  +role : "super-admin" | "admin" | "apiculteur"
  +avatarSrc : String
  +phone : String
  +genre : String
  +region : String
  +isActive : Boolean = true
  +lastLoginAt : Date
  +lastActiveAt : Date
  +createdAt : Date
  +updatedAt : Date
}

class Apiculteur {
  +_id : ObjectId
  +name : String
  +email : String [unique]
  +phone : String
  +avatarSrc : String
  +gender : "male" | "female" | "unknown"
  +region : String
  +rucheCount : Number
  +fermeCount : Number
  +subscriptionStatus : "active" | "expired" | "suspended"
  +subscriptionPeriodMonths : Number
  +subscriptionStartedAt : Date
  +subscriptionEndsAt : Date
  +subscriptionSuspendedAt : Date
  +subscriptionRemainingMs : Number
  +lat : Number
  +lng : Number
  +address : String
  +userId : ObjectId [ref: User]
  +createdAt : Date
  +updatedAt : Date
}

class Ferme {
  +_id : ObjectId [embedded]
  +name : String
  +rucheCount : Number
  +address : String
  +plusCode : String
  +lat : Number
  +lng : Number
  +gatewayCount : Number
  +ruchesAttention : Number
}

class Ruche {
  +_id : ObjectId [embedded]
  +name : String
  +serial : String
  +status : "alerte" | "normale"
  +alerts : Number
  +gatewayIndex : Number
  +lat : Number
  +lng : Number
}

class Gateway {
  +_id : ObjectId [embedded]
  +serialNumber : String
  +label : String
  +source : "qr" | "manual"
  +pairedAt : Date
  +payload : Mixed
}

class VenomSession {
  +_id : ObjectId [embedded]
  +date : String
  +time : String
  +grams : Number
  +hiveId : String
  +createdAt : Date
  +updatedAt : Date
}

class Maintenance {
  +_id : ObjectId
  +apiculteurId : ObjectId [ref: Apiculteur]
  +title : String
  +description : String
  +status : "non-traite" | "traite"
  +startedAt : Date
  +dueAt : Date
  +treatedAt : Date
  +attachmentUrl : String
  +lastActivityAt : Date
  +createdAt : Date
  +updatedAt : Date
}

class ApiculteurSnapshot {
  +name : String
  +email : String
  +phone : String
  +avatarSrc : String
  +rucheCount : Number
  +fermeCount : Number
  +inscriptionAt : Date
}

class Reply {
  +_id : ObjectId [embedded]
  +authorId : ObjectId [ref: User]
  +authorName : String
  +authorRole : String
  +authorAvatarSrc : String
  +body : String
  +createdAt : Date
}

class TreatedBy {
  +id : ObjectId [ref: User]
  +name : String
  +role : String
}

class Alert {
  +_id : ObjectId
  +userId : ObjectId [ref: User]
  +hiveId : String
  +hiveName : String
  +farmName : String
  +title : String
  +status : "Resolue" | "En cours" | "Non resolue"
  +tone : "orange" | "red" | "purple"
  +category : "batterie" | "capteur" | "venin" | "autre"
  +date : String
  +time : String
  +createdAt : Date
  +updatedAt : Date
}

class Notification {
  +_id : ObjectId
  +userId : ObjectId [ref: User, nullable]
  +role : "super-admin" | "admin" | "apiculteur" [nullable]
  +title : String
  +message : String
  +type : "info" | "success" | "warning" | "error"
  +category : "batterie" | "capteur" | "venin" | "autre"
  +link : String
  +action : String
  +entity : String
  +entityId : String
  +readBy : ObjectId[]
  +meta : Mixed
  +createdAt : Date
}

class Telemetry {
  +_id : ObjectId
  +gatewayId : String
  +hiveId : String
  +timestamp : Date
  +payload : Mixed
  +createdAt : Date
  +updatedAt : Date
}

class AuditLog {
  +_id : ObjectId
  +action : String
  +entity : String
  +entityId : String
  +summary : String
  +status : "success" | "failure"
  +changes : Change[]
  +metadata : Mixed
  +ip : String
  +userAgent : String
  +createdAt : Date
}

class Actor {
  +id : ObjectId
  +email : String
  +name : String
  +role : String
}

class Change {
  +field : String
  +before : Mixed
  +after : Mixed
}

' Relations principales
User "1" --> "0..1" Apiculteur : linked via userId
Apiculteur "1" *-- "0..*" Ferme : fermes (embedded)
Ferme "1" *-- "0..*" Ruche : ruches (embedded)
Ferme "1" *-- "0..*" Gateway : gateways (embedded)
Gateway "1" *-- "0..*" VenomSession : sessions (embedded)

Maintenance "1" --> "1" Apiculteur : filed by
Maintenance "1" *-- "1" ApiculteurSnapshot : denormalized
Maintenance "1" *-- "1" TreatedBy : treatedBy
Maintenance "1" *-- "0..*" Reply : replies (embedded)

Alert "1" --> "1" User : belongs to
Notification "0..*" --> "0..1" User : direct
AuditLog "1" *-- "1" Actor : actor (denormalized)
AuditLog "1" *-- "0..*" Change : changes
Notification "1" *-- "1" Actor : actor

@enduml
```

### Mermaid

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String name
        +String email
        -String passwordHash
        +String role
        +String avatarSrc
        +String phone
        +Boolean isActive
        +Date lastLoginAt
        +Date lastActiveAt
    }
    class Apiculteur {
        +ObjectId _id
        +String name
        +String email
        +String phone
        +String gender
        +String region
        +Number rucheCount
        +Number fermeCount
        +String subscriptionStatus
        +Date subscriptionEndsAt
        +ObjectId userId
    }
    class Ferme {
        +ObjectId _id
        +String name
        +Number rucheCount
        +String address
        +Number gatewayCount
        +Number ruchesAttention
        +Number lat
        +Number lng
    }
    class Ruche {
        +ObjectId _id
        +String name
        +String serial
        +String status
        +Number alerts
        +Number gatewayIndex
    }
    class Gateway {
        +ObjectId _id
        +String serialNumber
        +String label
        +String source
        +Date pairedAt
        +Mixed payload
    }
    class VenomSession {
        +ObjectId _id
        +String date
        +String time
        +Number grams
        +String hiveId
    }
    class Maintenance {
        +ObjectId _id
        +ObjectId apiculteurId
        +String title
        +String description
        +String status
        +Date startedAt
        +Date dueAt
        +Date treatedAt
        +String attachmentUrl
    }
    class ApiculteurSnapshot {
        +String name
        +String email
        +String phone
        +Number rucheCount
        +Number fermeCount
    }
    class Reply {
        +ObjectId _id
        +ObjectId authorId
        +String authorName
        +String authorRole
        +String body
        +Date createdAt
    }
    class Alert {
        +ObjectId _id
        +ObjectId userId
        +String hiveId
        +String hiveName
        +String farmName
        +String title
        +String status
        +String tone
        +String category
    }
    class Notification {
        +ObjectId _id
        +ObjectId userId
        +String role
        +String title
        +String message
        +String type
        +String category
        +ObjectId[] readBy
    }
    class Telemetry {
        +ObjectId _id
        +String gatewayId
        +String hiveId
        +Date timestamp
        +Mixed payload
    }
    class AuditLog {
        +ObjectId _id
        +String action
        +String entity
        +String entityId
        +String status
        +Mixed metadata
    }

    User "1" --> "0..1" Apiculteur : linked via userId
    Apiculteur "1" *-- "0..*" Ferme : fermes
    Ferme "1" *-- "0..*" Ruche : ruches
    Ferme "1" *-- "0..*" Gateway : gateways
    Gateway "1" *-- "0..*" VenomSession : sessions
    Maintenance "1" --> "1" Apiculteur : filed by
    Maintenance "1" *-- "1" ApiculteurSnapshot : snapshot
    Maintenance "1" *-- "0..*" Reply : replies
    Alert "1" --> "1" User : belongs to
    Notification "0..*" --> "0..1" User : direct notification
```

---

## Diagrammes Secondaires

### A. Domaine Authentification & Utilisateurs

```plantuml
@startuml DC_Auth

title Classes — Authentification & Utilisateurs

class User {
  +_id : ObjectId
  +name : String
  +email : String
  -passwordHash : String
  +role : Role
  +isActive : Boolean
  +lastLoginAt : Date
  +lastActiveAt : Date
}

class SessionToken {
  +uid : String
  +exp : Number (unix timestamp)
  -- methods --
  +createToken(userId) : String
  +verifyToken(token) : SessionPayload | null
  +writeSessionCookie(userId) : String
  +clearSessionCookie() : void
  +readSession() : SessionPayload | null
}

class AuditLog {
  +_id : ObjectId
  +actor : Actor
  +action : String
  +entity : String
  +status : "success" | "failure"
  +ip : String
  +userAgent : String
}

class Actor {
  +id : ObjectId
  +email : String
  +name : String
  +role : String
}

enum Role {
  super-admin
  admin
  apiculteur
}

User --> Role : has
User ..> SessionToken : creates on login
SessionToken ..> AuditLog : triggers log
AuditLog *-- Actor : embedded

note bottom of SessionToken
  Cookie: nahoul.session
  Format: base64(payload).HMAC-SHA256
  TTL: 7 jours
end note

@enduml
```

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String name
        +String email
        -String passwordHash
        +Role role
        +Boolean isActive
        +Date lastLoginAt
        +Date lastActiveAt
    }
    class SessionToken {
        +String uid
        +Number exp
        +createToken(userId) String
        +verifyToken(token) SessionPayload
        +writeSessionCookie(userId) String
        +clearSessionCookie() void
        +readSession() SessionPayload
    }
    class AuditLog {
        +ObjectId _id
        +Actor actor
        +String action
        +String entity
        +String status
        +String ip
    }
    class Actor {
        +ObjectId id
        +String email
        +String name
        +String role
    }
    User --> SessionToken : creates on login
    SessionToken --> AuditLog : triggers
    AuditLog *-- Actor : embedded
```

---

### B. Domaine Apiculture (Ferme, Ruche, Gateway)

```plantuml
@startuml DC_Apiculture

title Classes — Apiculture

class Apiculteur {
  +_id : ObjectId
  +name : String
  +email : String
  +phone : String
  +region : String
  +subscriptionStatus : String
  +subscriptionEndsAt : Date
  +rucheCount : Number
  +fermeCount : Number
  +fermes : Ferme[]
  +userId : ObjectId
}

class Ferme {
  +_id : ObjectId [embedded]
  +name : String
  +address : String
  +gatewayCount : Number
  +rucheCount : Number
  +ruchesAttention : Number
  +lat : Number
  +lng : Number
  +gateways : Gateway[]
  +ruches : Ruche[]
}

class Gateway {
  +_id : ObjectId [embedded]
  +serialNumber : String
  +label : String
  +source : "qr" | "manual"
  +pairedAt : Date
  +payload : Mixed
  +sessions : VenomSession[]
}

class VenomSession {
  +_id : ObjectId [embedded]
  +date : String
  +time : String
  +grams : Number
  +hiveId : String
}

class Ruche {
  +_id : ObjectId [embedded]
  +name : String
  +serial : String
  +status : "alerte" | "normale"
  +alerts : Number
  +gatewayIndex : Number
}

class Telemetry {
  +_id : ObjectId
  +gatewayId : String
  +hiveId : String
  +timestamp : Date
  +payload : Mixed
}

Apiculteur "1" *-- "1..*" Ferme
Ferme "1" *-- "0..*" Gateway
Ferme "1" *-- "0..*" Ruche
Gateway "1" *-- "0..*" VenomSession
Gateway "1" ..> "0..*" Telemetry : sends data
Ruche "1" ..> "0..*" Telemetry : reported via

@enduml
```

```mermaid
classDiagram
    class Apiculteur {
        +ObjectId _id
        +String name
        +String email
        +String subscriptionStatus
        +Number rucheCount
        +Number fermeCount
        +Ferme[] fermes
    }
    class Ferme {
        +ObjectId _id
        +String name
        +String address
        +Number gatewayCount
        +Number rucheCount
        +Gateway[] gateways
        +Ruche[] ruches
    }
    class Gateway {
        +ObjectId _id
        +String serialNumber
        +String source
        +Date pairedAt
        +VenomSession[] sessions
    }
    class Ruche {
        +ObjectId _id
        +String name
        +String serial
        +String status
        +Number alerts
    }
    class VenomSession {
        +ObjectId _id
        +String date
        +String time
        +Number grams
        +String hiveId
    }
    class Telemetry {
        +String gatewayId
        +String hiveId
        +Date timestamp
        +Mixed payload
    }
    Apiculteur "1" *-- "1..*" Ferme
    Ferme "1" *-- "0..*" Gateway
    Ferme "1" *-- "0..*" Ruche
    Gateway "1" *-- "0..*" VenomSession
    Gateway ..> Telemetry : sends telemetry
```

---

### C. Domaine Maintenance

```plantuml
@startuml DC_Maintenance

title Classes — Gestion de la Maintenance

class Maintenance {
  +_id : ObjectId
  +apiculteurId : ObjectId
  +title : String
  +description : String
  +status : "non-traite" | "traite"
  +startedAt : Date
  +dueAt : Date
  +treatedAt : Date
  +attachmentUrl : String
  +lastActivityAt : Date
  +apiculteurSnapshot : ApiculteurSnapshot
  +treatedBy : TreatedBy
  +replies : Reply[]
}

class ApiculteurSnapshot {
  +name : String
  +email : String
  +phone : String
  +avatarSrc : String
  +rucheCount : Number
  +fermeCount : Number
  +inscriptionAt : Date
}

class TreatedBy {
  +id : ObjectId
  +name : String
  +role : String
}

class Reply {
  +_id : ObjectId
  +authorId : ObjectId
  +authorName : String
  +authorRole : String
  +authorAvatarSrc : String
  +body : String
  +createdAt : Date
}

class Apiculteur {
  +_id : ObjectId
  +name : String
  +email : String
}

class User {
  +_id : ObjectId
  +name : String
  +role : String
}

Maintenance "1" *-- "1" ApiculteurSnapshot : snapshot
Maintenance "1" *-- "1" TreatedBy : treatedBy (admin)
Maintenance "1" *-- "0..*" Reply : thread
Maintenance "0..*" --> "1" Apiculteur : filed by
Reply "0..*" --> "1" User : written by

@enduml
```

```mermaid
classDiagram
    class Maintenance {
        +ObjectId _id
        +ObjectId apiculteurId
        +String title
        +String description
        +String status
        +Date startedAt
        +Date dueAt
        +Date treatedAt
        +String attachmentUrl
    }
    class ApiculteurSnapshot {
        +String name
        +String email
        +String phone
        +Number rucheCount
        +Number fermeCount
        +Date inscriptionAt
    }
    class TreatedBy {
        +ObjectId id
        +String name
        +String role
    }
    class Reply {
        +ObjectId _id
        +ObjectId authorId
        +String authorName
        +String authorRole
        +String body
        +Date createdAt
    }
    class Apiculteur {
        +ObjectId _id
        +String name
        +String email
    }
    Maintenance *-- ApiculteurSnapshot : embedded snapshot
    Maintenance *-- TreatedBy : treatedBy
    Maintenance *-- Reply : replies thread
    Maintenance --> Apiculteur : filed by
```

---

### D. Domaine Alertes & Notifications

```plantuml
@startuml DC_Alertes

title Classes — Alertes & Notifications

class Alert {
  +_id : ObjectId
  +userId : ObjectId
  +hiveId : String
  +hiveName : String
  +farmName : String
  +title : String
  +status : "Resolue" | "En cours" | "Non resolue"
  +tone : "orange" | "red" | "purple"
  +category : "batterie" | "capteur" | "venin" | "autre"
  +date : String
  +time : String
  +createdAt : Date
}

class Notification {
  +_id : ObjectId
  +userId : ObjectId [nullable]
  +role : String [nullable]
  +title : String
  +message : String
  +type : "info" | "success" | "warning" | "error"
  +category : String
  +link : String
  +action : String
  +entity : String
  +entityId : String
  +actor : Actor
  +readBy : ObjectId[]
  +createdAt : Date
}

class Actor {
  +id : ObjectId
  +name : String
  +role : String
}

class User {
  +_id : ObjectId
  +name : String
  +role : String
}

class Ruche {
  +status : "alerte" | "normale"
  +alerts : Number
}

Alert "0..*" --> "1" User : belongs to
Alert ..> Ruche : updates status
Notification "1" *-- "1" Actor : actor (denormalized)
Notification "0..*" --> "0..1" User : direct
Notification "0..*" ..> "0..*" User : broadcast via role

note right of Notification
  userId ≠ null → direct
  userId = null & role ≠ null → broadcast
end note

@enduml
```

```mermaid
classDiagram
    class Alert {
        +ObjectId _id
        +ObjectId userId
        +String hiveId
        +String title
        +String status
        +String tone
    }
    class Notification {
        +ObjectId _id
        +ObjectId userId
        +String role
        +String title
        +String type
        +Actor actor
    }
    class Actor {
        +ObjectId id
        +String name
        +String role
    }
    class User {
        +ObjectId _id
        +String name
    }
    Alert --> User : belongs to
    Notification *-- Actor : actor
    Notification --> User : target
```
