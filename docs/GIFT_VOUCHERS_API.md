# API Documentation - Gift Vouchers (Bons Cadeaux)

## 📋 Vue d'ensemble

Les **Gift Vouchers** (Bons Cadeaux) permettent d'offrir une place gratuite dans un stage ou baptême. Contrairement aux Gift Cards (cartes cadeaux avec montant), les vouchers couvrent une réservation complète pour un type et une catégorie spécifiques.

---

## 🎯 Caractéristiques

- **Format du code** : `GVSCP-XXXXXXXX-XXXX` (similaire aux Gift Cards)
- **Validité** : 1 an à partir de la date d'achat
- **Types disponibles** :
  - `STAGE` : INITIATION, PROGRESSION, AUTONOMIE
  - `BAPTEME` : DUREE, LONGUE_DUREE, ENFANT, HIVER, AVENTURE
- **Prix** : Basé sur les tarifs en base de données au moment de l'achat
- **Couverture** : 100% de la place, quel que soit le prix actuel
- **Réservation temporaire** : Le bon est "réservé" dès l'ajout au panier

---

## 🔌 Endpoints API

### 1. Obtenir le prix d'un bon cadeau

**Public** - Permet de connaître le prix pour créer un bon cadeau

```http
GET /api/giftvouchers/price/:productType/:category
```

**Headers requis** :
```
x-api-key: your-api-key
```

**Paramètres** :
- `productType` : `STAGE` ou `BAPTEME`
- `category` : 
  - Pour STAGE : `INITIATION`, `PROGRESSION`, `AUTONOMIE`
  - Pour BAPTEME : `DUREE`, `LONGUE_DUREE`, `ENFANT`, `HIVER`, `AVENTURE`

**Exemple de requête** :
```typescript
const response = await fetch(
  'https://api.example.com/api/giftvouchers/price/BAPTEME/AVENTURE',
  {
    headers: {
      'x-api-key': 'your-api-key'
    }
  }
);

const data = await response.json();
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "productType": "BAPTEME",
    "category": "AVENTURE",
    "price": 110
  }
}
```

---

### 2. Valider un code de bon cadeau

**Public** - Vérifie qu'un code est valide avant de l'ajouter au panier

```http
POST /api/giftvouchers/validate
```

**Headers requis** :
```
x-api-key: your-api-key
Content-Type: application/json
```

**Body** :
```json
{
  "code": "GVSCP-ABC12345-XYZ9",
  "productType": "BAPTEME",
  "category": "AVENTURE"
}
```

**Réponse succès** :
```json
{
  "success": true,
  "message": "Bon cadeau valide",
  "data": {
    "valid": true,
    "voucher": {
      "code": "GVSCP-ABC12345-XYZ9",
      "productType": "BAPTEME",
      "category": "AVENTURE",
      "recipientName": "Jean Dupont",
      "expiryDate": "2026-01-15T10:00:00.000Z"
    }
  }
}
```

**Réponse erreur** :
```json
{
  "success": false,
  "message": "Ce bon cadeau a déjà été utilisé",
  "data": {
    "valid": false,
    "reason": "Déjà utilisé"
  }
}
```

**Raisons d'invalidité possibles** :
- `"Code invalide"` : Le code n'existe pas
- `"Déjà utilisé"` : Le bon a déjà été utilisé
- `"Expiré"` : Le bon a dépassé sa date d'expiration
- `"Déjà réservé"` : Le bon est dans le panier d'une autre session
- `"Type incompatible"` : Le type ne correspond pas (STAGE vs BAPTEME)
- `"Catégorie incompatible"` : La catégorie ne correspond pas

---

### 3. Ajouter une réservation avec bon cadeau au panier

**Public** - Ajoute une réservation gratuite en utilisant un bon cadeau

```http
POST /api/cart/add
```

**Headers requis** :
```
x-api-key: your-api-key
x-session-id: your-session-id
Content-Type: application/json
```

**Body** :
```json
{
  "type": "GIFT_VOUCHER",
  "itemId": "bapteme_id_here",
  "giftVoucherCode": "GVSCP-ABC12345-XYZ9",
  "participantData": {
    "firstName": "Marie",
    "lastName": "Martin",
    "email": "marie@example.com",
    "phone": "+33612345678",
    "weight": 65,
    "height": 170,
    "selectedCategory": "AVENTURE",
    "usedGiftVoucherCode": "GVSCP-ABC12345-XYZ9"
  },
  "quantity": 1
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Article ajouté au panier",
  "data": {
    "id": "cart_item_id",
    "type": "GIFT_VOUCHER",
    "baptemeId": "bapteme_id_here",
    "giftVoucherCode": "GVSCP-ABC12345-XYZ9",
    "participantData": { ... },
    "expiresAt": "2025-01-15T11:00:00.000Z"
  }
}
```

---

### 4. Récupérer le panier

**Public** - Obtenir tous les items du panier avec indication des bons cadeaux

```http
GET /api/cart/items
```

**Headers requis** :
```
x-api-key: your-api-key
x-session-id: your-session-id
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cart_item_1",
        "type": "BAPTEME",
        "baptemeId": "bapteme_123",
        "giftVoucherCode": null,
        "participantData": { ... },
        "bapteme": {
          "id": "bapteme_123",
          "date": "2025-02-01T10:00:00.000Z",
          "acomptePrice": 35
        }
      },
      {
        "id": "cart_item_2",
        "type": "GIFT_VOUCHER",
        "baptemeId": "bapteme_456",
        "giftVoucherCode": "GVSCP-ABC12345-XYZ9",
        "participantData": { ... },
        "bapteme": {
          "id": "bapteme_456",
          "date": "2025-02-15T14:00:00.000Z",
          "acomptePrice": 35
        }
      }
    ],
    "totalAmount": 35,
    "itemCount": 2
  }
}
```

**💡 Identification d'une réservation avec bon cadeau** :
```typescript
const isUsingVoucher = cartItem.giftVoucherCode !== null;
const isFreeReservation = cartItem.type === 'GIFT_VOUCHER';
```

---

### 5. Supprimer un item du panier

**Public** - Supprime un item et libère le bon cadeau si applicable

```http
DELETE /api/cart/remove/:id
```

**Headers requis** :
```
x-api-key: your-api-key
x-session-id: your-session-id
```

**Comportement** :
- Si l'item utilise un bon cadeau, celui-ci est automatiquement libéré
- Le bon redevient disponible pour une autre utilisation

---

## 🛒 Flux d'achat d'un bon cadeau

### Étape 1 : Obtenir le prix

```typescript
const priceResponse = await fetch(
  '/api/giftvouchers/price/BAPTEME/AVENTURE',
  {
    headers: { 'x-api-key': API_KEY }
  }
);
const { data: { price } } = await priceResponse.json();
// price = 110
```

### Étape 2 : Ajouter au panier comme GIFT_CARD

```typescript
await fetch('/api/cart/add', {
  method: 'POST',
  headers: {
    'x-api-key': API_KEY,
    'x-session-id': SESSION_ID,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'GIFT_CARD',
    giftCardAmount: price, // 110
    participantData: {
      recipientName: 'Jean Dupont',
      recipientEmail: 'jean@example.com',
      voucherProductType: 'BAPTEME',
      voucherBaptemeCategory: 'AVENTURE'
    }
  })
});
```

### Étape 3 : Paiement via Stripe

Le webhook Stripe génère automatiquement le bon cadeau après paiement réussi.

---

## 🎁 Flux d'utilisation d'un bon cadeau

### Étape 1 : Valider le code

```typescript
const validateResponse = await fetch('/api/giftvouchers/validate', {
  method: 'POST',
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    code: 'GVSCP-ABC12345-XYZ9',
    productType: 'BAPTEME',
    category: 'AVENTURE'
  })
});

const { data } = await validateResponse.json();
if (data.valid) {
  // Le bon est valide, on peut l'utiliser
}
```

### Étape 2 : Ajouter au panier avec le bon

```typescript
await fetch('/api/cart/add', {
  method: 'POST',
  headers: {
    'x-api-key': API_KEY,
    'x-session-id': SESSION_ID,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'GIFT_VOUCHER',
    itemId: 'bapteme_id',
    giftVoucherCode: 'GVSCP-ABC12345-XYZ9',
    participantData: {
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie@example.com',
      phone: '+33612345678',
      weight: 65,
      height: 170,
      selectedCategory: 'AVENTURE',
      usedGiftVoucherCode: 'GVSCP-ABC12345-XYZ9'
    }
  })
});
```

### Étape 3 : Checkout (montant = 0€)

Le panier affiche un montant de 0€ pour cette réservation.

### Étape 4 : Confirmation

Après paiement réussi (ou validation si montant total = 0€), le bon est marqué comme utilisé.

---

## 🎨 Composants UI suggérés

### Badge "Bon Cadeau"

```tsx
{cartItem.giftVoucherCode && (
  <Badge variant="success">
    🎁 Bon Cadeau Appliqué
  </Badge>
)}
```

### Affichage du prix

```tsx
{cartItem.type === 'GIFT_VOUCHER' ? (
  <div>
    <span className="line-through text-gray-400">
      {originalPrice}€
    </span>
    <span className="text-green-600 font-bold ml-2">
      GRATUIT
    </span>
  </div>
) : (
  <span>{price}€</span>
)}
```

### Formulaire de validation

```tsx
<form onSubmit={handleValidateVoucher}>
  <Input
    placeholder="Code du bon cadeau (ex: GVSCP-ABC12345-XYZ9)"
    value={voucherCode}
    onChange={(e) => setVoucherCode(e.target.value)}
  />
  <Button type="submit">Valider le code</Button>
  
  {validationResult && (
    <Alert variant={validationResult.valid ? "success" : "error"}>
      {validationResult.message}
    </Alert>
  )}
</form>
```

---

## ⚠️ Points importants

### Réservation temporaire

- Le bon est **réservé** dès l'ajout au panier
- Il ne peut pas être utilisé par une autre session pendant 1h
- Si l'item est supprimé du panier, le bon est **libéré automatiquement**

### Validation stricte

- Le type (STAGE/BAPTEME) doit correspondre
- La catégorie doit correspondre exactement
- Le bon ne peut être utilisé qu'une seule fois
- Le bon doit être valide (non expiré, non utilisé)

### Prix

- Le prix du bon est fixé au moment de l'achat
- Lors de l'utilisation, le bon couvre 100% de la place
- Même si le prix actuel est différent, le bon reste valide

---

## 📊 Modèle de données

### GiftVoucher

```typescript
interface GiftVoucher {
  id: string;
  code: string; // Format: GVSCP-XXXXXXXX-XXXX
  
  // Type et catégorie
  productType: 'STAGE' | 'BAPTEME';
  stageCategory?: 'INITIATION' | 'PROGRESSION' | 'AUTONOMIE';
  baptemeCategory?: 'DUREE' | 'LONGUE_DUREE' | 'ENFANT' | 'HIVER' | 'AVENTURE';
  
  // Prix et statut
  purchasePrice: number;
  isUsed: boolean;
  usedAt?: Date;
  
  // Bénéficiaire
  recipientName: string;
  recipientEmail: string;
  
  // Validité
  expiryDate: Date;
  
  // Réservation temporaire
  reservedBySessionId?: string;
  reservedAt?: Date;
  
  // Relations
  clientId?: string;
  generatedFromOrderItem?: OrderItem;
  usedInOrderItem?: OrderItem;
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔗 Endpoints Admin (Backoffice uniquement)

### Lister tous les bons cadeaux

```http
GET /api/giftvouchers
Authorization: Bearer <admin-token>
```

### Créer un bon cadeau manuellement

```http
POST /api/giftvouchers
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "productType": "BAPTEME",
  "baptemeCategory": "AVENTURE",
  "recipientName": "Jean Dupont",
  "recipientEmail": "jean@example.com",
  "purchasePrice": 110
}
```

### Obtenir les détails d'un bon

```http
GET /api/giftvouchers/:id
Authorization: Bearer <admin-token>
```

---

## 📝 Notes de migration

Avant d'utiliser cette fonctionnalité, vous devez :

1. **Exécuter la migration Prisma** :
```bash
npx prisma migrate dev --name add_gift_vouchers
```

2. **Régénérer le client Prisma** :
```bash
npx prisma generate
```

3. **Vérifier les types TypeScript** :
Les nouveaux types `VoucherProductType`, `GiftVoucher`, etc. seront disponibles après la génération.

---

## 🐛 Gestion des erreurs

### Erreurs courantes

| Code | Message | Solution |
|------|---------|----------|
| 404 | Code de bon cadeau invalide | Vérifier que le code existe |
| 409 | Bon déjà en cours d'utilisation | Attendre ou utiliser un autre bon |
| 400 | Type/catégorie incompatible | Vérifier la correspondance |
| 410 | Bon expiré | Utiliser un bon valide |

### Exemple de gestion

```typescript
try {
  const response = await validateVoucher(code, type, category);
  if (response.data.valid) {
    // Ajouter au panier
  }
} catch (error) {
  if (error.status === 404) {
    toast.error("Code invalide");
  } else if (error.status === 409) {
    toast.error("Ce bon est déjà utilisé par quelqu'un d'autre");
  }
}
```

---

## ✅ Checklist d'intégration

- [ ] Migration Prisma exécutée
- [ ] Types TypeScript générés
- [ ] Endpoints API testés
- [ ] Formulaire de validation créé
- [ ] Affichage dans le panier implémenté
- [ ] Gestion des erreurs en place
- [ ] Tests end-to-end effectués

---

Pour toute question, consulter le code source dans :
- `src/features/giftvouchers/` (backend + hooks)
- `prisma/schema.prisma` (modèle de données)
- `src/app/api/webhooks/stripe/route.ts` (génération automatique)