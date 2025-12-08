# 🎁 API Backend - Bons Cadeaux (Gift Vouchers)

## 📋 Vue d'ensemble

Ce document détaille l'API backend pour les **Bons Cadeaux** (Gift Vouchers) qui permettent d'offrir une place gratuite dans un stage ou baptême.

### 🎯 Caractéristiques principales

- **Achat** : Produit `GIFT_VOUCHER` payant qui génère un code unique
- **Utilisation** : Code appliqué à une réservation `STAGE` ou `BAPTEME` pour prix = 0€
- **Validité** : 1 an à partir de l'achat
- **Usage unique** : Un code = une seule réservation

---

## 🔌 Routes API

### 1. Validation d'un code de bon cadeau

**Route** : `POST /api/giftvouchers/validate`

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

### 2. Obtenir le prix d'un bon cadeau

**Route** : `GET /api/giftvouchers/price/:productType/:category`

**Headers requis** :
```
x-api-key: your-api-key
```

**Paramètres** :
- `productType` : `STAGE` ou `BAPTEME`
- `category` : Catégorie spécifique (ex: `INITIATION`, `AVENTURE`, etc.)

**Exemple** : `/api/giftvouchers/price/BAPTEME/AVENTURE`

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

### 3. Ajouter au panier - ACHAT d'un bon cadeau

**Route** : `POST /api/cart/add`

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
  "giftVoucherAmount": 110,
  "participantData": {
    "voucherProductType": "BAPTEME",
    "voucherBaptemeCategory": "AVENTURE",
    "recipientName": "Marie Dupont",
    "recipientEmail": "marie@example.com", // Optionnel si notifyRecipient=false
    "buyerName": "Jean Dupont",
    "buyerEmail": "jean@example.com",
    "personalMessage": "Joyeux anniversaire ! Profite bien de ton baptême de parapente.", // Optionnel
    "notifyRecipient": true // Si true, recipientEmail devient obligatoire
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
    "giftVoucherAmount": 110,
    "participantData": {
      "voucherProductType": "BAPTEME",
      "voucherBaptemeCategory": "AVENTURE",
      "recipientName": "Marie Dupont",
      "recipientEmail": "marie@example.com"
    }
  }
}
```

### 4. Ajouter au panier - UTILISATION d'un bon cadeau

**Route** : `POST /api/cart/add`

**Headers requis** :
```
x-api-key: your-api-key
x-session-id: your-session-id
Content-Type: application/json
```

**Body** :
```json
{
  "type": "BAPTEME",
  "itemId": "bapteme_id_here",
  "participantData": {
    "firstName": "Marie",
    "lastName": "Martin",
    "email": "marie@example.com",
    "phone": "+33612345678",
    "weight": 65,
    "height": 170,
    "selectedCategory": "AVENTURE",
    "hasVideo": false,
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
    "type": "BAPTEME",
    "baptemeId": "bapteme_id_here",
    "participantData": {
      "firstName": "Marie",
      "lastName": "Martin",
      "email": "marie@example.com",
      "phone": "+33612345678",
      "weight": 65,
      "height": 170,
      "selectedCategory": "AVENTURE",
      "hasVideo": false,
      "usedGiftVoucherCode": "GVSCP-ABC12345-XYZ9"
    }
  }
}
```

### 5. Récupérer le contenu du panier

**Route** : `GET /api/cart/items`

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
        "id": "item_1",
        "type": "BAPTEME",
        "baptemeId": "bapteme_123",
        "participantData": {
          "firstName": "Marie",
          "lastName": "Martin",
          "email": "marie@example.com",
          "selectedCategory": "AVENTURE",
          "usedGiftVoucherCode": "GVSCP-ABC12345-XYZ9"
        },
        "bapteme": {
          "id": "bapteme_123",
          "date": "2025-02-01T10:00:00.000Z",
          "acomptePrice": 35
        }
      },
      {
        "id": "item_2",
        "type": "GIFT_VOUCHER",
        "giftVoucherAmount": 110,
        "participantData": {
          "voucherProductType": "BAPTEME",
          "voucherBaptemeCategory": "AVENTURE",
          "recipientName": "Jean Dupont",
          "recipientEmail": "jean@example.com"
        }
      }
    ],
    "totalAmount": 110,
    "itemCount": 2
  }
}
```

### 6. Créer une commande (checkout)

**Route** : `POST /api/orders/create`

**Headers requis** :
```
x-api-key: your-api-key
x-session-id: your-session-id
Content-Type: application/json
```

**Body** :
```json
{
  "customerEmail": "client@example.com",
  "customerData": {
    "firstName": "Jean",
    "lastName": "Client",
    "phone": "+33612345678",
    "address": "123 Rue de la Montagne",
    "postalCode": "75001",
    "city": "Paris",
    "country": "France"
  }
}
```

**Réponse - Commande payante** :
```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "order": {
      "id": "order_id",
      "orderNumber": "ORD-20251205-001",
      "totalAmount": 110,
      "subtotal": 110,
      "discountAmount": 0,
      "depositAmount": 110,
      "remainingAmount": 0,
      "customerEmail": "client@example.com",
      "status": "PENDING",
      "createdAt": "2025-12-05T12:00:00.000Z"
    },
    "paymentIntent": {
      "id": "pi_xxx",
      "clientSecret": "pi_xxx_secret_xxx",
      "amount": 11000
    },
    "remainingPayments": []
  }
}
```

**Réponse - Commande gratuite (avec bon cadeau)** :
```json
{
  "success": true,
  "message": "Commande gratuite créée avec succès",
  "data": {
    "order": {
      "id": "order_id",
      "orderNumber": "ORD-20251205-002",
      "totalAmount": 0,
      "subtotal": 110,
      "discountAmount": 0,
      "depositAmount": 0,
      "remainingAmount": 0,
      "customerEmail": "client@example.com",
      "status": "PAID",
      "createdAt": "2025-12-05T12:00:00.000Z"
    },
    "paymentRequired": false
  }
}
```

---

## 🎨 Détection côté Frontend

### Identifier un item avec bon cadeau appliqué

```typescript
const isUsingGiftVoucher = (cartItem: any) => {
  return cartItem.participantData?.usedGiftVoucherCode !== undefined;
};

const isGiftVoucherPurchase = (cartItem: any) => {
  return cartItem.type === 'GIFT_VOUCHER';
};
```

### Calcul du prix affiché

```typescript
const getDisplayPrice = (cartItem: any) => {
  if (isUsingGiftVoucher(cartItem)) {
    // Réservation avec bon cadeau = GRATUIT
    return { originalPrice: getOriginalPrice(cartItem), finalPrice: 0, isFree: true };
  }

  if (isGiftVoucherPurchase(cartItem)) {
    // Achat de bon cadeau = prix normal
    return { originalPrice: cartItem.giftVoucherAmount, finalPrice: cartItem.giftVoucherAmount, isFree: false };
  }

  // Réservation normale
  return { originalPrice: getOriginalPrice(cartItem), finalPrice: getOriginalPrice(cartItem), isFree: false };
};
```

### Badge dans le panier

```typescript
const getCartItemBadge = (cartItem: any) => {
  if (isUsingGiftVoucher(cartItem)) {
    return { text: "🎁 Bon Cadeau Appliqué", variant: "success" };
  }

  if (isGiftVoucherPurchase(cartItem)) {
    return { text: "🎁 Bon Cadeau à offrir", variant: "info" };
  }

  return null;
};
```

---

## 🔄 Flux d'utilisation complet

### Flux 1 : Achat d'un bon cadeau

1. **Obtenir le prix** : `GET /api/giftvouchers/price/BAPTEME/AVENTURE`
2. **Ajouter au panier** : `POST /api/cart/add` avec `type: "GIFT_VOUCHER"`
3. **Checkout** : `POST /api/orders/create` → paiement Stripe → génération du code
4. **Résultat** : Email avec code `GVSCP-XXXXXXXX-XXXX`

### Flux 2 : Utilisation d'un bon cadeau

1. **Valider le code** : `POST /api/giftvouchers/validate`
2. **Ajouter au panier** : `POST /api/cart/add` avec `type: "BAPTEME"` + `usedGiftVoucherCode`
3. **Checkout** : `POST /api/orders/create` → traitement gratuit → réservation créée
4. **Résultat** : Réservation confirmée, bon marqué comme utilisé

---

## ⚠️ Points importants pour le Frontend

### 1. Gestion des sessions

- **Toujours inclure** `x-session-id` dans les headers
- La session expire automatiquement après inactivité
- Les réservations temporaires sont libérées après 1h

### 2. Validation des données

- **Poids** : 20-120 kg
- **Taille** : 120-220 cm
- **Email** : Format valide requis
- **Téléphone** : Format français requis

### 3. Gestion des erreurs

```typescript
// Erreurs communes
const ERROR_MESSAGES = {
  'Code de bon cadeau invalide': 'Ce code n\'existe pas',
  'Ce bon cadeau a déjà été utilisé': 'Ce bon cadeau a déjà été utilisé',
  'Ce bon cadeau a expiré': 'Ce bon cadeau n\'est plus valide',
  'Ce bon cadeau est déjà en cours d\'utilisation': 'Ce bon cadeau est déjà dans un autre panier',
  'Type/catégorie incompatible': 'Ce bon cadeau n\'est pas valable pour cette activité'
};
```

### 4. États de chargement

- **Validation du code** : Spinner pendant la requête
- **Ajout au panier** : Désactiver le bouton pendant l'ajout
- **Checkout** : Loader complet pendant la création de commande

### 5. Messages utilisateur

```typescript
const SUCCESS_MESSAGES = {
  voucherValidated: '✅ Bon cadeau validé !',
  itemAdded: 'Article ajouté au panier',
  orderCreated: 'Commande créée avec succès',
  freeOrderProcessed: 'Votre réservation avec bon cadeau est confirmée !'
};
```

---

## 📊 Structure des données

### CartItem avec bon cadeau utilisé

```typescript
interface CartItemWithVoucher {
  id: string;
  type: 'STAGE' | 'BAPTEME';
  stageId?: string;
  baptemeId?: string;
  participantData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    weight: number;
    height: number;
    selectedCategory?: string;
    selectedStageType?: string;
    hasVideo?: boolean;
    usedGiftVoucherCode: string; // 🔥 INDICATEUR PRINCIPAL
  };
  stage?: Stage;
  bapteme?: Bapteme;
}
```

### CartItem achat de bon cadeau

```typescript
interface CartItemGiftVoucherPurchase {
  id: string;
  type: 'GIFT_VOUCHER';
  giftVoucherAmount: number;
  participantData: {
    voucherProductType: 'STAGE' | 'BAPTEME';
    voucherStageCategory?: string;
    voucherBaptemeCategory?: string;
    recipientName: string;
    recipientEmail: string;
  };
}
```

---

## 🧪 Tests à effectuer

### Test 1 : Achat de bon cadeau
```typescript
// 1. Obtenir prix
const price = await fetch('/api/giftvouchers/price/BAPTEME/AVENTURE');

// 2. Ajouter au panier
await fetch('/api/cart/add', {
  method: 'POST',
  body: JSON.stringify({
    type: 'GIFT_VOUCHER',
    giftVoucherAmount: 110,
    participantData: { /* ... */ }
  })
});

// 3. Vérifier panier
const cart = await fetch('/api/cart/items');
// Doit contenir item avec type: 'GIFT_VOUCHER'
```

### Test 2 : Utilisation de bon cadeau
```typescript
// 1. Valider code
const validation = await fetch('/api/giftvouchers/validate', {
  method: 'POST',
  body: JSON.stringify({
    code: 'GVSCP-ABC12345-XYZ9',
    productType: 'BAPTEME',
    category: 'AVENTURE'
  })
});

// 2. Ajouter réservation avec bon
await fetch('/api/cart/add', {
  method: 'POST',
  body: JSON.stringify({
    type: 'BAPTEME',
    itemId: 'bapteme_id',
    participantData: {
      /* données participant */
      usedGiftVoucherCode: 'GVSCP-ABC12345-XYZ9'
    }
  })
});

// 3. Checkout gratuit
const order = await fetch('/api/orders/create', {
  method: 'POST',
  body: JSON.stringify({ customerEmail: 'test@example.com' })
});
// Doit retourner paymentRequired: false
```

---

## 🔗 Routes Admin (optionnel)

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

---

---

## 📧 Logique d'envoi d'emails

Après l'achat d'un bon cadeau, le système envoie automatiquement des emails selon les préférences de l'acheteur.

### Configuration côté frontend

```typescript
// Lors de l'ajout au panier
const giftVoucherData = {
  type: "GIFT_VOUCHER",
  giftVoucherAmount: 110,
  participantData: {
    // ... données du bénéficiaire
    buyerName: "Jean Dupont",        // Nom de l'acheteur
    buyerEmail: "jean@example.com",  // Email de l'acheteur
    personalMessage: "Joyeux anniversaire !", // Message optionnel
    notifyRecipient: true            // true = notifier le bénéficiaire
  }
};
```

### Cas 1 : Notification activée (`notifyRecipient: true`)

**Email 1 - Confirmation à l'acheteur** :
```
Objet: Votre bon cadeau a été envoyé !

Bonjour Jean,

Votre bon cadeau pour Marie Dupont a été envoyé avec succès.
Le bénéficiaire recevra un email avec son bon cadeau.

Cordialement,
L'équipe Serre Chevalier Parapente
```

**Email 2 - Bon cadeau au bénéficiaire** :
```
Objet: Bon cadeau de Jean Dupont !

Bonjour Marie,

Jean Dupont vous offre un bon cadeau pour un baptême de parapente !

Message personnel: "Joyeux anniversaire !"

Votre code: GVSCP-ABC12345-XYZ9
Valable pour: Baptême Aventure
Expire le: 15/12/2026

Réservez dès maintenant sur notre site.
```

### Cas 2 : Notification désactivée (`notifyRecipient: false`)

**Email unique à l'acheteur** :
```
Objet: Votre bon cadeau est prêt !

Bonjour Jean,

Voici votre bon cadeau pour Marie Dupont.

Code: GVSCP-ABC12345-XYZ9
Valable pour: Baptême Aventure
Expire le: 15/12/2026

Transmettez ce code à Marie Dupont pour qu'elle puisse réserver.

Cordialement,
L'équipe Serre Chevalier Parapente
```

### Champs requis pour les emails

| Champ | Type | Description | Requis |
|-------|------|-------------|--------|
| `buyerName` | string | Nom de l'acheteur | ✅ |
| `buyerEmail` | string | Email de l'acheteur | ✅ |
| `recipientName` | string | Nom du bénéficiaire | ✅ |
| `recipientEmail` | string | Email du bénéficiaire | ⚠️ (requis si `notifyRecipient: true`) |
| `personalMessage` | string | Message personnalisé | ❌ (optionnel) |
| `notifyRecipient` | boolean | Notifier le bénéficiaire | ✅ |

---

## ⚠️ Points importants

### Validation des données
- `buyerName` et `buyerEmail` sont **requis** pour l'achat de bons cadeaux
- `recipientName` est **requis**, `recipientEmail` seulement si `notifyRecipient: true`
- `notifyRecipient` détermine le flux d'emails (true = notification automatique, false = code transmis manuellement)
- `personalMessage` est inclus dans l'email au bénéficiaire uniquement si `notifyRecipient: true`

### Sécurité
- Les emails sont envoyés automatiquement après paiement réussi
- Le code du bon cadeau n'est envoyé qu'à l'acheteur (sauf notification activée)
- Les données sont stockées dans `participantData` de l'OrderItem

### Débogage
```typescript
// Vérifier les données dans le panier
const cartItem = await fetch('/api/cart/items');
console.log(cartItem.participantData); // Contient buyerName, buyerEmail, etc.
```

---

*Document généré le 05/12/2025 - Implémentation complète des bons cadeaux avec emails*