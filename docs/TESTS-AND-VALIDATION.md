## 4.4 Tests et validation

La validation de la plateforme Nahoul n'est pas seulement une étape de vérification technique ; c'est la garantie que notre solution peut réellement accompagner l'apiculteur sur le terrain, souvent dans des conditions de connectivité difficiles. Nous avons privilégié une approche de tests itérative, intégrée au cœur du développement.

### 4.4.1 Une approche de tests ancrée dans le réel
Plutôt que de se limiter à des simulations théoriques, nous avons testé chaque brique de Nahoul au fur et à mesure de sa construction. Cette méthode nous a permis d'ajuster l'ergonomie de l'application mobile et la robustesse du backend face aux imprévus.

*   **Validation du flux d'appairage :** Nous avons testé manuellement la reconnaissance des QR Codes avec différentes luminosités pour s'assurer que la gateway est reconnue instantanément par l'application mobile Expo.
*   **Sécurité et sessions :** La gestion des sessions par cookies signés (HMAC-SHA256) a été éprouvée pour garantir que les accès aux données des ruches restent strictement confidentiels, même en cas de fermeture brutale de l'application.
*   **Intégrité des données IoT :** Grâce à notre simulateur, nous avons vérifié que les payloads envoyés par les capteurs sont correctement interprétés et stockés dans MongoDB sans perte d'information, même lors de pics d'activité.
*   **Réactivité des alertes :** Chaque règle de gestion (ex: batterie < 20% ou température anormale) a fait l'objet d'un test spécifique pour confirmer que l'apiculteur reçoit sa notification en quelques millisecondes.
*   **Cohérence du Dashboard :** Nous avons utilisé des scripts de "seeding" pour peupler le système avec des dizaines de ruches fictives, validant ainsi la clarté de l'interface d'administration face à une grande quantité de données.

### 4.4.2 Vers une automatisation durable
Pour assurer la pérennité du projet, nous avons posé les jalons d'une automatisation des tests. Bien que l'essentiel de la validation ait été manuel pour cette première version, nous avons identifié les points clés à automatiser.

**Tableau 4.4 — Focus sur les tests futurs pour la scalabilité**

| Domaine | Objectif de la validation |
| :--- | :--- |
| **Logique Métier** | Garantir que le calcul de la production de venin reste exact après chaque mise à jour. |
| **API Backend** | S'assurer que les routes `/api/gateways` et `/api/alerts` répondent toujours en moins de 100ms. |
| **Interface Mobile** | Valider la fluidité de la navigation sur différents modèles de smartphones (Android et iOS). |
| **Stress Test IoT** | Simuler 1000 gateways simultanées pour valider la montée en charge de notre architecture Next.js. |

### 4.4.3 Les outils de notre écosystème
Le choix des outils pour les futures phases de tests s'est porté sur des technologies modernes, en parfaite adéquation avec notre stack technique (Next.js et Expo).

**Tableau 4.5 — Outils sélectionnés pour l'évolution de Nahoul**

| Outil | Pourquoi ce choix ? |
| :--- | :--- |
| **Jest & Library Testing** | L'outil de référence pour tester nos composants React et nos fonctions de sécurité. |
| **Playwright** | Pour automatiser les tests sur le tableau de bord web et vérifier le rendu sur tous les navigateurs. |
| **Postman / Thunder Client** | Essentiels pour debugger et documenter nos points de terminaison REST en équipe. |
| **Expo Orbit** | Pour simplifier le déploiement de versions de tests sur les appareils des apiculteurs partenaires. |

**Conclusion :** Les tests manuels approfondis ont confirmé la viabilité de Nahoul pour une utilisation réelle. Cette phase nous a permis de livrer une solution stable et sécurisée, tout en préparant le terrain pour une intégration continue (CI/CD) robuste lors des prochaines évolutions du système.
