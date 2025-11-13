# Résumé de l'implémentation - Système de réservation temporaire

## Date d'implémentation
13 janvier 2025

## Vue d'ensemble
Implémentation d'un système de réservation temporaire de places dans le panier avec expiration automatique après 1 heure pour les stages et baptêmes.

## Modifications effectuées

### 1. Schéma de base de données (prisma/schema.prisma)

**Modèle CartItem - Nouveaux champs ajoutés :**
```prisma
expiresAt DateTime? // Date d'expiration (createdAt + 1h pour STAGE/BAPTEME, null pour GIFT_CARD)
isExpired Boolean   @default(false) // Flag pour identifier les items expirés

@@index([expiresAt])
@@index([isExpired])
```

### 2. API Cart (src/features/cart/server/route.ts)

#### POST /api/cart/add
- **Modification :** Calcul automatique de l'expiration à +1 heure pour STAGE et BAPTEME
- **Comportement :** Les bons cadeaux (GIFT_CARD) n'ont pas d'expiration (expiresAt = null)

```typescript
const expiresAt = (type === 'STAGE' || type === 'BAPTEME') 
  ? new Date(now.getTime() + 60 * 60 * 1000) // +1 heure
  : null; // Pas d'expiration pour GIFT_CARD
```

#### GET /api/cart/items
- **Modification :** Nettoyage automatique des items expirés avant de retourner le panier
- **Comportement :** 
  - Filtre les items dont `expiresAt <= now`
  - Supprime automatiquement ces items de la base de données
  - Retourne uniquement les items valides
  - Log le nombre d'items supprimés

### 3. Service de disponibilité (src/lib/availability.ts)

#### checkAvailability()
- **Modification :** 
  - Nettoyage préventif des items expirés avant vérification
  - Calcul des disponibilités incluant les items du panier non expirés
- **Comportement :**
  - Supprime les items expirés pour l'item spécifique vérifié
  - Compte les CartItem avec `expiresAt > now` au lieu des TemporaryReservation
  - Retourne les places disponibles = total - confirmées - temporaires

```typescript
// Compter les réservations temporaires (items dans les paniers non expirés)
const temporaryCartItems = await prisma.cartItem.count({
  where: {
    type: 'STAGE',
    stageId: itemId,
    expiresAt: { gt: now },
    isExpired: false,
  }
});
```

### 4. API Stages (src/features/stages/server/route.ts)

#### GET /api/stages/getAll
- **Modification :** Enrichissement avec les disponibilités en temps réel
- **Comportement :**
  - Calcule pour chaque stage : `availablePlaces`, `confirmedBookings`, `temporaryReservations`
  - Retourne les places disponibles en tenant compte des paniers actifs

### 5. API Baptêmes (src/features/biplaces/server/route.ts)

#### GET /api/baptemes/getAll
- **Modification :** Enrichissement avec les disponibilités en temps réel
- **Comportement :**
  - Calcule pour chaque baptême : `availablePlaces`, `confirmedBookings`, `temporaryReservations`
  - Retourne les places disponibles en tenant compte des paniers actifs

## Flux de données

### Scénario 1 : Ajout au panier
1. Client appelle `POST /api/cart/add` avec un stage ou baptême
2. Backend vérifie la disponibilité (nettoie les expirés + compte les places)
3. Si disponible : crée un CartItem avec `expiresAt = now + 1h`
4. Si non disponible : retourne une erreur

### Scénario 2 : Consultation du panier
1. Client appelle `GET /api/cart/items`
2. Backend filtre les items où `expiresAt <= now`
3. Supprime ces items de la base de données
4. Retourne uniquement les items valides avec leur `expiresAt`

### Scénario 3 : Vérification de disponibilité
1. Client appelle `POST /api/availability/check`
2. Backend nettoie d'abord les items expirés pour cet item
3. Calcule : places confirmées + places temporaires (paniers actifs)
4. Retourne les places disponibles

### Scénario 4 : Consultation des stages/baptêmes
1. Client appelle `GET /api/stages/getAll` ou `GET /api/baptemes/getAll`
2. Backend enrichit chaque item avec les disponibilités en temps réel
3. Retourne la liste avec `availablePlaces`, `confirmedBookings`, `temporaryReservations`

### Scénario 5 : Suppression manuelle
1. Client appelle `DELETE /api/cart/remove/:itemId`
2. Backend supprime l'item
3. La place est immédiatement libérée (disponible pour d'autres)

## Stratégie de nettoyage

### Nettoyage à la demande (implémenté)
- **GET /api/cart/items** : Nettoie les items expirés du panier consulté
- **checkAvailability()** : Nettoie les items expirés pour l'item vérifié
- **Avantages :**
  - Pas de configuration CRON nécessaire
  - Compatible avec Vercel serverless
  - Nettoyage ciblé et efficace
  - Garantit des disponibilités toujours à jour

### Alternative CRON (non implémentée)
Si besoin d'un nettoyage global périodique, utiliser Vercel Cron Jobs :
1. Créer un endpoint `/api/cron/cleanup`
2. Configurer `vercel.json` pour l'appeler toutes les 5 minutes
3. Implémenter la suppression globale des items expirés

## Points d'attention

### Performance
- Index créés sur `expiresAt` et `isExpired` pour optimiser les requêtes
- Nettoyage ciblé par item lors des vérifications de disponibilité

### Sécurité
- Validation du `sessionId` via middleware
- Vérification que l'item appartient à la session avant suppression

### Compatibilité
- Les bons cadeaux (GIFT_CARD) ne sont pas affectés (pas d'expiration)
- Le système existant de TemporaryReservation reste en place mais n'est plus utilisé pour le calcul des disponibilités

## Tests recommandés

1. **Test d'ajout au panier :**
   - Ajouter un stage/baptême au panier
   - Vérifier que `expiresAt` est défini à +1h
   - Vérifier que les disponibilités sont mises à jour

2. **Test d'expiration :**
   - Ajouter un item au panier
   - Attendre 1 heure (ou modifier manuellement `expiresAt` en base)
   - Consulter le panier : l'item doit être supprimé automatiquement

3. **Test de disponibilité :**
   - Ajouter un item au panier
   - Vérifier que les places disponibles diminuent
   - Supprimer l'item : les places doivent être libérées

4. **Test de nettoyage préventif :**
   - Créer un item expiré en base
   - Appeler `checkAvailability` : l'item doit être supprimé
   - Les disponibilités doivent refléter la suppression

## Compatibilité Frontend

Le système est compatible avec le frontend implémenté qui attend :
- `expiresAt` : Date d'expiration de l'item
- `createdAt` : Date de création de l'item
- Nettoyage automatique côté serveur

Le frontend affiche :
- Timer en temps réel du temps restant
- Badge "Expiré" pour les items dont le temps est écoulé
- Alerte visuelle quand il reste moins de 5 minutes
- Toast de notification lors des expirations

## Conclusion

Le système de réservation temporaire est maintenant pleinement opérationnel avec :
- ✅ Blocage automatique des places pendant 1 heure
- ✅ Nettoyage automatique à la demande (pas de CRON nécessaire)
- ✅ Calcul des disponibilités en temps réel
- ✅ Libération automatique des places expirées
- ✅ Compatible avec l'hébergement Vercel serverless
- ✅ Performance optimisée avec indexes