# Manuel d'Utilisation - MyJantes

## Table des matières
1. [Introduction](#introduction)
2. [Guide Client](#guide-client)
3. [Guide Administrateur](#guide-administrateur)

---

## Introduction

**MyJantes** est une application de gestion de services automobiles permettant aux clients de demander des devis et aux administrateurs de gérer l'ensemble des opérations.

### Connexion
- URL : Accédez à l'application via votre navigateur
- Authentification Replit intégrée
- Deux rôles : **Client** et **Administrateur**

---

## Guide Client

### 1. Tableau de bord
- Vue d'ensemble : devis en attente, factures, réservations
- Bouton "Demander un devis" pour créer une nouvelle demande
- Liens rapides vers toutes vos données

### 2. Demander un devis
1. Cliquez sur "Demander un devis" ou allez dans Services
2. Sélectionnez un service
3. Remplissez le formulaire :
   - Nombre de jantes (1-4)
   - Diamètre des jantes
   - Informations véhicule
   - Méthode de paiement
   - Notes (optionnel)
4. Cliquez "Soumettre"
5. Un administrateur traitera votre demande

### 3. Mes Devis (Menu : /quotes)
- Consultez tous vos devis
- **Statuts possibles** :
  - **En attente** : Devis en cours de traitement
  - **Approuvé** : Devis validé par l'administrateur
  - **Refusé** : Devis rejeté
  - **Terminé** : Service effectué
- Téléchargez le PDF de chaque devis (bouton "Télécharger PDF")

### 4. Mes Factures (Menu : /invoices)
- Consultez toutes vos factures
- **Statuts possibles** :
  - **En attente** : Facture non payée
  - **Payée** : Facture réglée
  - **En retard** : Paiement en retard
  - **Annulée** : Facture annulée
- Téléchargez le PDF de chaque facture

### 5. Notifications
- Icône cloche en haut à droite
- Recevez des alertations pour :
  - Changement de statut de devis
  - Nouvelles factures
  - Confirmations de réservation

---

## Guide Administrateur

### 1. Dashboard Admin
- Vue complète de l'activité
- Statistiques : devis, factures, réservations
- Accès rapide aux actions courantes

### 2. Gestion des Services
**Menu : Services**

#### Créer un service
1. Cliquez "Ajouter un service"
2. Remplissez :
   - Nom du service
   - Description
   - Prix de base
   - Catégorie
3. Activez/Désactivez selon besoin

#### Modifier/Supprimer
- Cliquez sur le service
- Boutons "Modifier" ou "Supprimer"

### 3. Gestion des Devis
**Menu : Devis**

#### Traiter un devis
1. Ouvrez le devis
2. Cliquez "Éditer"
3. Modifiez les détails si nécessaire
4. Choisissez une action :
   - **Approuver** : Valider le devis
   - **Refuser** : Rejeter le devis
   - **Modifier** : Ajuster le montant/détails
5. Le client reçoit une notification

#### Créer un devis manuellement
1. Cliquez "Créer un devis"
2. **Choisir le type de client** :
   - **Client existant** : Sélectionnez dans la liste déroulante
   - **Nouveau client** : Activez le switch "Créer un nouveau client"
3. Si nouveau client, remplissez :
   - Email (requis)
   - Prénom et nom (requis)
   - Type : **Particulier** ou **Professionnel**
   - Si professionnel : nom entreprise, SIRET, TVA, adresse
   - 💡 Mot de passe par défaut : **client123** (à changer à la première connexion)
4. Sélectionnez un service
5. Remplissez les détails du devis
6. Téléchargez au moins 6 images
7. Enregistrez

### 4. Gestion des Factures
**Menu : Factures**

#### Créer une facture
1. Cliquez "Créer une facture"
2. Sélectionnez un devis approuvé
3. La facture se génère automatiquement avec :
   - Numéro unique
   - Montants HT/TVA/TTC
   - Date d'échéance
4. Modifiez si nécessaire
5. Enregistrez

#### Modifier le statut
- Ouvrez la facture
- Changez le statut (En attente → Payée)
- Enregistrez

### 5. Gestion des Réservations (CRUD Complet)
**Menu : Réservations**

#### Créer une réservation
1. Cliquez "Créer une réservation"
2. Choisissez le type :
   - **Réservation directe** : Création manuelle
   - **À partir d'un devis** : Depuis un devis approuvé
3. Remplissez les informations :
   - Client et service
   - Date et heure
   - Nombre de jantes, diamètre
   - Prix HT, taux TVA
   - Détails produit
   - Notes
   - Statut initial
4. Cliquez "Créer"

#### Modifier une réservation
1. Trouvez la réservation
2. Cliquez "Modifier"
3. Changez les champs nécessaires :
   - Date/heure
   - Statut (En attente, Confirmée, Terminée, Annulée)
   - Prix
   - Détails
4. Cliquez "Enregistrer"

#### Supprimer une réservation
1. Trouvez la réservation
2. Cliquez "Supprimer"
3. Confirmez la suppression
4. ⚠️ Action irréversible

**Statuts des réservations** :
- **En attente** : Non confirmée
- **Confirmée** : Validée
- **Terminée** : Service effectué
- **Annulée** : Réservation annulée

### 6. Gestion des Utilisateurs
**Menu : Utilisateurs**
- Consultez la liste des utilisateurs
- Voir les rôles (Client/Admin)
- Statistiques par utilisateur

### 7. Paramètres
**Menu : Paramètres**

Configuration de l'application :
- **Nombre de jantes par défaut** : Valeur pré-remplie dans les formulaires
- **Diamètre par défaut** : Diamètre standard
- **Taux TVA** : Pourcentage TVA (ex: 20%)
- **Informations entreprise** :
  - Nom
  - Adresse
  - Téléphone
  - Email

#### Vider le cache
- Bouton "Vider le cache" pour rafraîchir les données
- Utilisez en cas de problème d'affichage

### 8. Étiquettes QR Code (Fonctionnalité à venir)
Génération d'étiquettes pour identifier les jantes :
- Positions : AVG, AVD, ARG, ARD, CLÉ VÉHICULE
- QR codes pour traçabilité

---

## Statuts dans l'application

### Devis
| Statut | Description |
|--------|-------------|
| En attente | Devis soumis, en attente de traitement |
| Approuvé | Devis validé par l'admin |
| Refusé | Devis rejeté |
| Terminé | Service réalisé |

### Factures
| Statut | Description |
|--------|-------------|
| En attente | Facture émise, non payée |
| Payée | Paiement reçu |
| En retard | Échéance dépassée |
| Annulée | Facture annulée |

### Réservations
| Statut | Description |
|--------|-------------|
| En attente | Réservation créée, non confirmée |
| Confirmée | Réservation validée |
| Terminée | Service effectué |
| Annulée | Réservation annulée |

---

## Conseils d'utilisation

### Pour les clients
- Vérifiez régulièrement vos notifications
- Téléchargez vos documents PDF pour vos archives
- Contactez l'administrateur en cas de question

### Pour les administrateurs
- Traitez rapidement les demandes de devis
- Utilisez les réservations pour organiser le planning
- Mettez à jour les statuts des factures après paiement
- Configurez les paramètres avant la première utilisation

---

## Support

Pour toute assistance technique :
- Contactez l'administrateur système
- Vérifiez que vous utilisez un navigateur récent
- En cas d'erreur, rafraîchissez la page

---

**Version 1.0 - MyJantes**  
*Application de gestion de services automobiles*
