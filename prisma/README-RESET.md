# Script de Réinitialisation de la Base de Données

## Description

Ce script permet de réinitialiser la base de données en **conservant** les données essentielles suivantes :

✅ **Conservé :**
- Tous les créneaux de **stages** (Stage)
- Tous les créneaux de **baptêmes** (Bapteme)
- Tous les **utilisateurs** (User)
- Les assignations **moniteurs-stages** (StageMoniteur)
- Les assignations **moniteurs-baptêmes** (BaptemeMoniteur)
- Les **prix** (BaptemeCategoryPrice, StageBasePrice, VideoOptionPrice, BaptemeDepositPrice)

❌ **Supprimé :**
- Toutes les **commandes** (Order, OrderItem)
- Tous les **paiements** (Payment, PaymentAllocation)
- Toutes les **réservations** (StageBooking, BaptemeBooking)
- Toutes les **cartes cadeaux** (GiftCard)
- Tous les **bons cadeaux** (GiftVoucher)
- Tous les **paniers** (CartSession, CartItem)
- Tous les **clients** (Client)
- Tous les **stagiaires** (Stagiaire)
- Toutes les **réservations temporaires** (TemporaryReservation)
- Tous les **événements webhook** (ProcessedWebhookEvent)

## Utilisation

### Méthode 1 : Via npm script (recommandé)

```bash
pnpm db:reset
```

### Méthode 2 : Directement avec tsx

```bash
pnpm tsx prisma/reset-db-keep-essentials.ts
```

## Quand utiliser ce script ?

- Après des tests de commandes
- Pour nettoyer les données de développement
- Avant de faire des tests de paiement
- Pour repartir sur une base propre tout en gardant la configuration

## ⚠️ Attention

Ce script supprime **définitivement** toutes les données de commandes, clients et réservations. Assurez-vous de :

1. Être en environnement de **développement** ou **test**
2. Avoir une **sauvegarde** si nécessaire
3. **Ne JAMAIS** exécuter ce script en **production**

## Exemple de sortie

```
🔄 Début de la réinitialisation de la base de données...

📦 Suppression des données de commandes et paniers...
  ✓ PaymentAllocations supprimées
  ✓ Payments supprimés
  ✓ OrderGiftCards supprimées
  ✓ OrderItems supprimés
  ✓ Orders supprimées
  ✓ ProcessedWebhookEvents supprimés

📅 Suppression des réservations...
  ✓ StageBookings supprimées
  ✓ BaptemeBookings supprimées

🎁 Suppression des cartes et bons cadeaux...
  ✓ GiftCards supprimées
  ✓ GiftVouchers supprimés

🛒 Suppression des paniers...
  ✓ TemporaryReservations supprimées
  ✓ CartItems supprimés
  ✓ CartSessions supprimées

👥 Suppression des clients et stagiaires...
  ✓ Clients supprimés
  ✓ Stagiaires supprimés

✅ Conservation des données essentielles:
  ✓ 12 stages conservés
  ✓ 45 baptêmes conservés
  ✓ 3 utilisateurs conservés
  ✓ 24 assignations moniteurs-stages conservées
  ✓ 90 assignations moniteurs-baptêmes conservées
  ✓ 5 prix de catégories baptême conservés
  ✓ 4 prix de base stages conservés
  ✓ 1 prix option vidéo conservés
  ✓ 1 prix acompte baptême conservés

✨ Réinitialisation terminée avec succès!
📊 La base de données est prête pour de nouvelles commandes.