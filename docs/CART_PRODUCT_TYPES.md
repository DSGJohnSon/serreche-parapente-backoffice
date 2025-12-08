# 🛒 Types de Produits dans le Panier

## 📋 Vue d'ensemble

Ce document détaille les différents types de produits que l'on peut retrouver dans le panier d'achat.

> **⚠️ Note importante** : Les clients ne peuvent **PAS** acheter de cartes cadeaux monétaires (`GIFT_CARD`). Seuls les administrateurs peuvent créer des cartes cadeaux monétaires.

---

## 🎯 Types de produits disponibles

### 1. STAGE - Réservation de stage de parapente

**Type** : `"STAGE"`

**Description** : Réservation pour un stage de parapente (INITIATION, PROGRESSION, AUTONOMIE)

**Prix** : Acompte seulement (le solde est payé sur place)

**Informations dans le panier** :
```typescript
{
  id: string;
  type: "STAGE";
  stageId: string; // ID du stage réservé
  quantity: number; // Toujours 1 pour les stages
  participantData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    weight: number; // 20-120 kg (requis)
    height: number; // 120-220 cm (requis)
    birthDate?: string;
    selectedStageType: "INITIATION" | "PROGRESSION" | "AUTONOMIE";
    usedGiftVoucherCode?: string; // 🎁 BON CADEAU UTILISÉ
  };
  stage: {
    id: string;
    startDate: Date;
    duration: number; // jours
    places: number;
    price: number; // Prix total du stage
    acomptePrice: number; // Acompte à payer maintenant
    type: "INITIATION" | "PROGRESSION" | "AUTONOMIE" | "DOUBLE";
  };
  expiresAt: Date; // Expiration après 1h
  isExpired: boolean;
  createdAt: Date;
}
```

**Prix affiché** :
- **Avec bon cadeau** : 0€
- **Sans bon cadeau** : `stage.acomptePrice`

---

### 2. BAPTEME - Réservation de baptême de parapente

**Type** : `"BAPTEME"`

**Description** : Réservation pour un baptême de parapente (AVENTURE, DUREE, etc.)

**Prix** : Acompte + option vidéo (le solde est payé sur place)

**Informations dans le panier** :
```typescript
{
  id: string;
  type: "BAPTEME";
  baptemeId: string; // ID du baptême réservé
  quantity: number; // Toujours 1 pour les baptêmes
  participantData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    weight: number; // 20-120 kg (requis)
    height: number; // 120-220 cm (requis)
    birthDate?: string;
    selectedCategory: "AVENTURE" | "DUREE" | "LONGUE_DUREE" | "ENFANT" | "HIVER";
    hasVideo: boolean; // Option vidéo (+25€)
    usedGiftVoucherCode?: string; // 🎁 BON CADEAU UTILISÉ
  };
  bapteme: {
    id: string;
    date: Date;
    duration: number; // minutes
    places: number;
    categories: string[]; // Catégories disponibles
    acomptePrice: number; // Acompte de base
  };
  expiresAt: Date; // Expiration après 1h
  isExpired: boolean;
  createdAt: Date;
}
```

**Prix affiché** :
- **Avec bon cadeau** : 0€
- **Sans bon cadeau** : `bapteme.acomptePrice + (hasVideo ? 25 : 0)`

---

### 3. GIFT_VOUCHER - Achat de bon cadeau pour activité

**Type** : `"GIFT_VOUCHER"`

**Description** : Achat d'un bon cadeau donnant droit à une place gratuite dans un stage ou baptême

**Prix** : Prix de l'activité correspondante

**Informations dans le panier** :
```typescript
{
  id: string;
  type: "GIFT_VOUCHER";
  giftVoucherAmount: number; // Prix du bon (= prix de l'activité)
  quantity: number; // Toujours 1 pour les bons cadeaux
  participantData: {
    voucherProductType: "STAGE" | "BAPTEME"; // Type d'activité offert
    voucherStageCategory?: "INITIATION" | "PROGRESSION" | "AUTONOMIE";
    voucherBaptemeCategory?: "AVENTURE" | "DUREE" | "LONGUE_DUREE" | "ENFANT" | "HIVER";
    recipientName: string; // Nom du bénéficiaire
    recipientEmail: string; // Email du bénéficiaire
  };
  // Pas d'expiration pour les achats
  createdAt: Date;
}
```

**Prix affiché** : `giftVoucherAmount`

---

## 🔍 Détection côté Frontend

### Identifier le type de produit

```typescript
const getProductType = (cartItem: any) => {
  switch (cartItem.type) {
    case 'STAGE':
      return 'stage-reservation';
    case 'BAPTEME':
      return 'bapteme-reservation';
    case 'GIFT_VOUCHER':
      return 'gift-voucher-purchase';
    default:
      return 'unknown';
  }
};
```

### Détecter l'utilisation d'un bon cadeau

```typescript
const isUsingGiftVoucher = (cartItem: any) => {
  return cartItem.participantData?.usedGiftVoucherCode !== undefined;
};
```

### Calculer le prix affiché

```typescript
const getDisplayPrice = (cartItem: any) => {
  if (isUsingGiftVoucher(cartItem)) {
    // Réservation gratuite avec bon cadeau
    return {
      originalPrice: getOriginalPrice(cartItem),
      finalPrice: 0,
      isFree: true,
      badge: "🎁 Bon Cadeau Appliqué"
    };
  }

  if (cartItem.type === 'GIFT_VOUCHER') {
    // Achat de bon cadeau
    return {
      originalPrice: cartItem.giftVoucherAmount,
      finalPrice: cartItem.giftVoucherAmount,
      isFree: false,
      badge: "🎁 Bon Cadeau à offrir"
    };
  }

  // Réservation normale
  const price = getOriginalPrice(cartItem);
  return {
    originalPrice: price,
    finalPrice: price,
    isFree: false,
    badge: null
  };
};
```

### Fonction utilitaire pour le prix original

```typescript
const getOriginalPrice = (cartItem: any) => {
  if (cartItem.type === 'STAGE' && cartItem.stage) {
    return cartItem.stage.acomptePrice * cartItem.quantity;
  }

  if (cartItem.type === 'BAPTEME' && cartItem.bapteme) {
    const basePrice = cartItem.bapteme.acomptePrice;
    const videoPrice = cartItem.participantData?.hasVideo ? 25 : 0;
    return (basePrice + videoPrice) * cartItem.quantity;
  }

  if (cartItem.type === 'GIFT_VOUCHER') {
    return cartItem.giftVoucherAmount * cartItem.quantity;
  }

  return 0;
};
```

---

## 💰 Calcul du total du panier

```typescript
const calculateCartTotal = (items: any[]) => {
  return items.reduce((total, item) => {
    if (isUsingGiftVoucher(item)) {
      // Gratuit avec bon cadeau
      return total + 0;
    }

    // Prix normal selon le type
    return total + getOriginalPrice(item);
  }, 0);
};
```

---

## ⚠️ Règles importantes

### Pour les réservations (STAGE/BAPTEME)
- **Expiration** : 1 heure après ajout au panier
- **Validation** : Poids (20-120kg), taille (120-220cm), email, téléphone requis
- **Bon cadeau** : Détecté par `usedGiftVoucherCode` → prix = 0€
- **Quantité** : Toujours 1 (réservation individuelle)

### Pour les achats de bons cadeaux (GIFT_VOUCHER)
- **Prix** : Basé sur le tarif de l'activité correspondante
- **Quantité** : Toujours 1
- **Validation** : Nom et email du bénéficiaire requis
- **Génération** : Code unique créé après paiement

### États spéciaux
- **Réservation expirée** : `isExpired: true` → supprimer automatiquement
- **Bon cadeau utilisé** : `usedGiftVoucherCode` présent → afficher badge spécial

---

## 🎨 Affichage recommandé

### Badge pour les items

```typescript
const getItemBadge = (item: any) => {
  if (isUsingGiftVoucher(item)) {
    return { text: "🎁 Bon Cadeau Appliqué", color: "green" };
  }

  if (item.type === 'GIFT_VOUCHER') {
    return { text: "🎁 Bon Cadeau à offrir", color: "blue" };
  }

  return null;
};
```

### Prix avec barré pour les bons cadeaux

```tsx
{isUsingGiftVoucher(item) ? (
  <div className="flex items-center gap-2">
    <span className="line-through text-gray-400">
      {originalPrice}€
    </span>
    <span className="text-green-600 font-bold">
      GRATUIT
    </span>
  </div>
) : (
  <span>{finalPrice}€</span>
)}
```

---

## 📊 Statistiques du panier

```typescript
const getCartStats = (items: any[]) => {
  const stats = {
    totalItems: items.length,
    totalAmount: calculateCartTotal(items),
    hasExpiredItems: items.some(item => item.isExpired),
    hasGiftVoucherItems: items.some(item => isUsingGiftVoucher(item)),
    reservationsCount: items.filter(item => ['STAGE', 'BAPTEME'].includes(item.type)).length,
    giftVouchersCount: items.filter(item => item.type === 'GIFT_VOUCHER').length,
  };

  return stats;
};
```

---

*Document généré le 05/12/2025 - Types de produits disponibles pour les clients*