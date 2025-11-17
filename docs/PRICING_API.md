# API de Gestion des Tarifs

Ce document décrit les endpoints disponibles pour gérer les tarifs dans le système.

## Vue d'ensemble

Le système de tarification comprend trois types de prix configurables :

1. **Prix des baptêmes par catégorie** - Prix de base pour chaque catégorie de baptême
2. **Prix de l'option vidéo** - Prix supplémentaire pour l'option vidéo des baptêmes
3. **Prix de base des stages** - Prix de base pour chaque type de stage (INITIATION, PROGRESSION, AUTONOMIE)

## Endpoints Disponibles

### 1. Prix des Baptêmes par Catégorie

#### GET `/api/tarifs/getAll`
Récupère tous les prix des catégories de baptêmes.

**Réponse :**
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": "...",
      "category": "AVENTURE",
      "price": 85.0,
      "createdAt": "2025-11-17T12:00:00.000Z",
      "updatedAt": "2025-11-17T12:00:00.000Z"
    }
  ]
}
```

#### GET `/api/tarifs/getByCategory/:category`
Récupère le prix d'une catégorie spécifique.

**Paramètres :**
- `category` : AVENTURE | DUREE | LONGUE_DUREE | ENFANT | HIVER

**Réponse :**
```json
{
  "success": true,
  "message": "",
  "data": {
    "id": "...",
    "category": "AVENTURE",
    "price": 85.0,
    "createdAt": "2025-11-17T12:00:00.000Z",
    "updatedAt": "2025-11-17T12:00:00.000Z"
  }
}
```

#### POST `/api/tarifs/update` (Admin uniquement)
Met à jour le prix d'une catégorie de baptême.

**Body :**
```json
{
  "category": "AVENTURE",
  "price": 90.0
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Tarif pour AVENTURE mis à jour avec succès",
  "data": {
    "id": "...",
    "category": "AVENTURE",
    "price": 90.0,
    "createdAt": "2025-11-17T12:00:00.000Z",
    "updatedAt": "2025-11-17T13:00:00.000Z"
  }
}
```

### 2. Prix de l'Option Vidéo

#### GET `/api/tarifs/getVideoOptionPrice`
Récupère le prix de l'option vidéo.

**Réponse :**
```json
{
  "success": true,
  "message": "",
  "data": {
    "id": "default",
    "price": 30.0,
    "createdAt": "2025-11-17T12:00:00.000Z",
    "updatedAt": "2025-11-17T12:00:00.000Z"
  }
}
```

#### POST `/api/tarifs/updateVideoOptionPrice` (Admin uniquement)
Met à jour le prix de l'option vidéo.

**Body :**
```json
{
  "price": 35.0
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Prix de l'option vidéo mis à jour avec succès",
  "data": {
    "id": "default",
    "price": 35.0,
    "createdAt": "2025-11-17T12:00:00.000Z",
    "updatedAt": "2025-11-17T13:00:00.000Z"
  }
}
```

### 3. Prix de Base des Stages

#### GET `/api/tarifs/getStageBasePrices`
Récupère tous les prix de base des stages.

**Réponse :**
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": "...",
      "stageType": "INITIATION",
      "price": 350.0,
      "createdAt": "2025-11-17T12:00:00.000Z",
      "updatedAt": "2025-11-17T12:00:00.000Z"
    },
    {
      "id": "...",
      "stageType": "PROGRESSION",
      "price": 400.0,
      "createdAt": "2025-11-17T12:00:00.000Z",
      "updatedAt": "2025-11-17T12:00:00.000Z"
    },
    {
      "id": "...",
      "stageType": "AUTONOMIE",
      "price": 450.0,
      "createdAt": "2025-11-17T12:00:00.000Z",
      "updatedAt": "2025-11-17T12:00:00.000Z"
    }
  ]
}
```

#### GET `/api/tarifs/getStageBasePriceByType/:stageType`
Récupère le prix de base d'un type de stage spécifique.

**Paramètres :**
- `stageType` : INITIATION | PROGRESSION | AUTONOMIE

**Réponse :**
```json
{
  "success": true,
  "message": "",
  "data": {
    "id": "...",
    "stageType": "INITIATION",
    "price": 350.0,
    "createdAt": "2025-11-17T12:00:00.000Z",
    "updatedAt": "2025-11-17T12:00:00.000Z"
  }
}
```

#### POST `/api/tarifs/updateStageBasePrice` (Admin uniquement)
Met à jour le prix de base d'un type de stage.

**Body :**
```json
{
  "stageType": "INITIATION",
  "price": 375.0
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Prix de base pour INITIATION mis à jour avec succès",
  "data": {
    "id": "...",
    "stageType": "INITIATION",
    "price": 375.0,
    "createdAt": "2025-11-17T12:00:00.000Z",
    "updatedAt": "2025-11-17T13:00:00.000Z"
  }
}
```

## Utilisation dans le Frontend

### Exemple avec fetch

```typescript
// Récupérer tous les prix des baptêmes
const response = await fetch('/api/tarifs/getAll');
const { data } = await response.json();

// Récupérer le prix de l'option vidéo
const videoResponse = await fetch('/api/tarifs/getVideoOptionPrice');
const { data: videoPrice } = await videoResponse.json();

// Récupérer les prix de base des stages
const stagesResponse = await fetch('/api/tarifs/getStageBasePrices');
const { data: stagePrices } = await stagesResponse.json();
```

### Exemple avec React Query (dans le backoffice)

```typescript
import { useGetTarifs } from '@/features/tarifs/api/use-get-tarifs';
import { useGetVideoOptionPrice } from '@/features/tarifs/api/use-get-video-option-price';
import { useGetStageBasePrices } from '@/features/tarifs/api/use-get-stage-base-prices';

function PricingComponent() {
  const { data: baptemePrices } = useGetTarifs();
  const { data: videoPrice } = useGetVideoOptionPrice();
  const { data: stagePrices } = useGetStageBasePrices();

  // Utiliser les données...
}
```

## Authentification

- Les endpoints **GET** sont accessibles à tous les utilisateurs authentifiés
- Les endpoints **POST** (mise à jour) nécessitent un rôle **ADMIN**

## Notes Importantes

1. **Valeurs par défaut** : Les prix par défaut sont initialisés via le script `prisma/seed-pricing.ts`
2. **Utilisation** : Ces prix sont utilisés comme valeurs initiales dans le backoffice et peuvent être affichés sur le site frontend
3. **Mise à jour** : Seuls les administrateurs peuvent modifier les prix via l'interface `/dashboard/tarifs`
4. **Cache** : Les prix sont mis en cache côté client via React Query pour optimiser les performances

## Initialisation des Prix

Pour initialiser les prix par défaut dans la base de données :

```bash
npx tsx prisma/seed-pricing.ts
```

Cela créera :
- Prix de l'option vidéo : 30€
- Prix stage INITIATION : 350€
- Prix stage PROGRESSION : 400€
- Prix stage AUTONOMIE : 450€