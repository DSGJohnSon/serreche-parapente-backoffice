# API Cart Update Endpoint

## Endpoint
`PATCH /api/cart/update/:itemId`

## Description
Met à jour les informations d'un participant dans le panier avec recalcul automatique du prix total. Supporte la modification des données personnelles et des options (vidéo pour baptêmes, informations bénéficiaire pour cartes cadeaux).

## ✅ CORS Configuration
Le endpoint supporte maintenant la méthode PATCH avec la configuration CORS appropriée.

## Headers Requis

```
x-session-id: <session-id>
x-api-key: <api-key>
Content-Type: application/json
```

## Paramètres URL

- `itemId` (string, required): L'ID de l'item dans le panier à mettre à jour

## Body de la Requête

### Pour BAPTEME et STAGE
```json
{
  "participantData": {
    "firstName": "string (optional)",
    "lastName": "string (optional)",
    "email": "string (optional)",
    "phone": "string (optional)",
    "weight": number (optional),
    "height": number (optional),
    "birthDate": "string (optional)",
    "hasVideo": boolean (optional)",
    "selectedCategory": "AVENTURE|DUREE|LONGUE_DUREE|ENFANT|HIVER (optional)",
    "selectedStageType": "INITIATION|PROGRESSION|AUTONOMIE (optional)"
  },
  "quantity": number (optional)
}
```

### Pour GIFT_CARD
```json
{
  "participantData": {
    "recipientName": "string (optional)",
    "recipientEmail": "string (optional)",
    "notifyRecipient": boolean (optional)",
    "personalMessage": "string (optional)"
  }
}
```

**Note**: Tous les champs sont optionnels. Seuls les champs fournis seront mis à jour (fusion avec les données existantes).

## Validations

### Pour BAPTEME et STAGE

#### Poids (si fourni)
- Minimum: 20 kg
- Maximum: 120 kg

#### Taille (si fournie)
- Minimum: 120 cm
- Maximum: 220 cm

#### Email (si fourni)
- Format valide requis (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)

#### Téléphone (si fourni)
- Format français accepté
- Regex: `/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/`
- Exemples valides:
  - `0612345678`
  - `06 12 34 56 78`
  - `+33612345678`
  - `+33 6 12 34 56 78`

### Pour GIFT_CARD

#### Nom du bénéficiaire (si fourni)
- Ne peut pas être vide
- Doit contenir au moins un caractère non-espace

#### Email du bénéficiaire (si fourni)
- Format valide requis

## Logique de Recalcul du Prix

### Pour les Baptêmes
1. Prix de base selon la catégorie sélectionnée
2. Ajout de 25€ si `hasVideo === true`
3. Formule: `(basePrice + videoPrice) * quantity`

### Pour les Stages
- Prix fixe du stage × quantité
- Pas d'options supplémentaires

### Pour les Cartes Cadeaux
- Montant fixe défini lors de l'ajout

## Réponses

### Succès (200)

```json
{
  "success": true,
  "message": "Article mis à jour avec succès",
  "data": {
    "item": {
      "id": "string",
      "type": "STAGE|BAPTEME|GIFT_CARD",
      "quantity": number,
      "participantData": {...},
      "stage": {...},
      "bapteme": {...}
    },
    "cart": {
      "id": "string",
      "items": [...],
      "totalAmount": number,
      "itemCount": number
    }
  }
}
```

### Erreurs

#### 400 - Validation échouée

```json
{
  "success": false,
  "message": "Le poids doit être entre 20 et 120 kg",
  "data": null
}
```

Messages possibles:
- "Le poids doit être entre 20 et 120 kg"
- "La taille doit être entre 120 et 220 cm"
- "Format d'email invalide"
- "Format de téléphone invalide"

#### 401 - Session invalide

```json
{
  "success": false,
  "message": "Session invalide ou expirée",
  "data": null
}
```

#### 404 - Item non trouvé

```json
{
  "success": false,
  "message": "Article introuvable dans votre panier",
  "data": null
}
```

#### 500 - Erreur serveur

```json
{
  "success": false,
  "message": "Erreur lors de la mise à jour",
  "data": null
}
```

## Exemples d'Utilisation

### Exemple 1: Modification des informations personnelles

```bash
curl -X PATCH https://api.example.com/api/cart/update/item_123 \
  -H "x-session-id: session_abc" \
  -H "x-api-key: key_xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "participantData": {
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean.dupont@email.com",
      "phone": "0612345678",
      "weight": 75,
      "height": 180
    }
  }'
```

### Exemple 2: Activation de l'option vidéo (baptême)

```bash
curl -X PATCH https://api.example.com/api/cart/update/item_456 \
  -H "x-session-id: session_abc" \
  -H "x-api-key: key_xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "participantData": {
      "firstName": "Marie",
      "lastName": "Martin",
      "email": "marie.martin@email.com",
      "phone": "+33 6 12 34 56 78",
      "weight": 65,
      "height": 170,
      "hasVideo": true,
      "selectedCategory": "AVENTURE"
    }
  }'
```

### Exemple 3: Changement de catégorie de baptême

```bash
curl -X PATCH https://api.example.com/api/cart/update/item_789 \
  -H "x-session-id: session_abc" \
  -H "x-api-key: key_xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "participantData": {
      "firstName": "Pierre",
      "lastName": "Durand",
      "email": "pierre.durand@email.com",
      "phone": "0698765432",
      "weight": 80,
      "height": 185,
      "hasVideo": false,
      "selectedCategory": "LONGUE_DUREE"
    }
  }'
```

### Exemple 4: Modification d'une carte cadeau

```bash
curl -X PATCH https://api.example.com/api/cart/update/item_101 \
  -H "x-session-id: session_abc" \
  -H "x-api-key: key_xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "participantData": {
      "recipientName": "Sophie Bernard",
      "recipientEmail": "sophie.bernard@email.com",
      "notifyRecipient": true,
      "personalMessage": "Joyeux anniversaire ! Profite bien de ton vol !"
    }
  }'
```

### Exemple 5: Modification partielle (seulement l'option vidéo)

```bash
curl -X PATCH https://api.example.com/api/cart/update/item_202 \
  -H "x-session-id: session_abc" \
  -H "x-api-key: key_xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "participantData": {
      "hasVideo": true
    }
  }'
```

## Exemple de Réponse Complète

```json
{
  "success": true,
  "message": "Article mis à jour avec succès",
  "data": {
    "item": {
      "id": "clx123abc",
      "type": "BAPTEME",
      "quantity": 1,
      "baptemeId": "clx456def",
      "participantData": {
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean.dupont@email.com",
        "phone": "0612345678",
        "weight": 75,
        "height": 180,
        "hasVideo": true,
        "selectedCategory": "AVENTURE"
      },
      "bapteme": {
        "id": "clx456def",
        "date": "2025-06-15T10:00:00.000Z",
        "duration": 120,
        "places": 6,
        "categories": ["AVENTURE", "DUREE"]
      },
      "createdAt": "2025-11-10T10:00:00.000Z",
      "updatedAt": "2025-11-10T11:00:00.000Z"
    },
    "cart": {
      "id": "clx789ghi",
      "items": [
        {
          "id": "clx123abc",
          "type": "BAPTEME",
          "quantity": 1,
          "participantData": {...},
          "bapteme": {...}
        }
      ],
      "totalAmount": 135,
      "itemCount": 1
    }
  }
}
```

## Notes Importantes

1. **Atomicité**: La mise à jour est atomique - soit toutes les modifications sont appliquées, soit aucune.

2. **Recalcul automatique**: Le prix total du panier est recalculé automatiquement après chaque modification.

3. **Fusion des données**: Les nouvelles données participant sont fusionnées avec les anciennes. Seuls les champs fournis sont mis à jour.

4. **Logs**: Toutes les modifications sont loggées pour le suivi et le débogage.

5. **Validation stricte**: Toutes les données sont validées avant la mise à jour. En cas d'erreur de validation, aucune modification n'est appliquée.

6. **Prix vidéo**: L'option vidéo ajoute systématiquement 25€ au prix de base du baptême.

## Calcul des Prix par Catégorie

| Catégorie | Prix de Base | Avec Vidéo |
|-----------|--------------|------------|
| AVENTURE | 110€ | 135€ |
| DUREE | 150€ | 175€ |
| LONGUE_DUREE | 185€ | 210€ |
| ENFANT | 90€ | 115€ |
| HIVER | 130€ | 155€ |

## Sécurité

- L'endpoint vérifie que l'item appartient bien à la session du client
- Les données sensibles ne sont jamais exposées dans les logs
- La validation stricte empêche l'injection de données malveillantes
- Le middleware d'authentification API protège l'endpoint

## Performance

- Utilisation de transactions Prisma pour garantir la cohérence
- Recalcul optimisé du total du panier
- Logs structurés pour faciliter le monitoring