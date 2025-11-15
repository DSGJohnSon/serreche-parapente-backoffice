# Multi-Gift Card Support Implementation

## Overview
This document describes the implementation of multi-gift card support in the backend API, allowing customers to apply multiple gift cards to a single order.

## Changes Made

### 1. Database Schema Updates (prisma/schema.prisma)

#### GiftCard Model
- Added `remainingAmount` field to track partial usage of gift cards
- Added `OrderGiftCard` relation for many-to-many relationship with orders
- Kept `appliedGiftCardId` for backward compatibility (deprecated)

```prisma
model GiftCard {
  remainingAmount Float @default(0.0) // New field for partial usage
  appliedToOrders OrderGiftCard[] // Many-to-many relation
  // ... other fields
}
```

#### Order Model
- Added `orderGiftCards` relation for many-to-many with gift cards
- Kept `appliedGiftCardId` for backward compatibility (deprecated)

```prisma
model Order {
  orderGiftCards OrderGiftCard[] // Many-to-many with GiftCard
  // ... other fields
}
```

#### New OrderGiftCard Junction Table
```prisma
model OrderGiftCard {
  id         String   @id @default(cuid())
  orderId    String
  order      Order    @relation(fields: [orderId], references: [id])
  giftCardId String
  giftCard   GiftCard @relation(fields: [giftCardId], references: [id])
  usedAmount Float    // Amount used from this gift card for this order
  createdAt  DateTime @default(now())
}
```

### 2. API Schema Updates (src/features/orders/schemas.ts)

Updated `CreateOrderSchema` to accept an array of gift card codes:

```typescript
export const CreateOrderSchema = z.object({
  customerEmail: z.string().email("Email invalide"),
  appliedGiftCardCodes: z.array(z.string()).optional().default([]), // NEW
  appliedGiftCardCode: z.string().optional(), // Deprecated but kept for compatibility
  customerData: z.object({...}).optional(),
});
```

### 3. Order Creation Logic (src/features/orders/server/route.ts)

#### Key Changes:
1. **Backward Compatibility**: Converts single `appliedGiftCardCode` to array format
2. **Multi-Gift Card Validation**: Validates each gift card in the array
3. **Sequential Application**: Applies gift cards in order until order amount is covered
4. **Partial Usage**: Updates `remainingAmount` for each gift card used
5. **OrderGiftCard Records**: Creates junction table records for tracking

#### Logic Flow:
```typescript
// 1. Validate all gift cards
for (const code of appliedGiftCardCodes) {
  - Find gift card by code
  - Check expiration (12 months from creation)
  - Check remaining amount > 0
  - Calculate usedAmount = min(remainingAmount, orderRemainingAmount)
  - Add to validGiftCards array
}

// 2. Create order with gift card relations
await prisma.order.create({
  data: {
    orderGiftCards: {
      create: validGiftCards.map(({ giftCard, usedAmount }) => ({
        giftCardId: giftCard.id,
        usedAmount,
      })),
    },
  },
});

// 3. Update gift cards
for (const { giftCard, usedAmount } of validGiftCards) {
  await prisma.giftCard.update({
    where: { id: giftCard.id },
    data: {
      remainingAmount: currentRemainingAmount - usedAmount,
      isUsed: newRemainingAmount <= 0,
      usedAt: giftCard.usedAt || new Date(),
    },
  });
}
```

### 4. Gift Card Validation Endpoint (src/features/giftcards/server/route.ts)

Updated `/validate` endpoint to:
- Return `remainingAmount` instead of just `amount`
- Check expiration date (12 months from creation)
- Return proper expiration date in response

## Database Migration

Migration file created: `prisma/migrations/20251115_add_multi_giftcard_support/migration.sql`

The migration:
1. Adds `remainingAmount` column to `GiftCard` table
2. Initializes `remainingAmount` = `amount` for existing gift cards
3. Creates `OrderGiftCard` junction table with indexes and foreign keys

**Status**: ✅ Migration applied successfully with `npx prisma db push`

## Required Next Steps

### 1. Regenerate Prisma Client
The Prisma client needs to be regenerated to include the new schema changes. Currently blocked by a file lock on Windows.

**Solution**: 
- Close any running development servers or processes using the Prisma client
- Run: `npx prisma generate`
- Or restart your IDE/terminal

### 2. Test the Implementation

Once Prisma client is regenerated, test the following scenarios:

#### Test Case 1: Single Gift Card (Backward Compatibility)
```json
POST /api/orders/create
{
  "customerEmail": "test@example.com",
  "appliedGiftCardCode": "SCP-12345-ABCD",
  "customerData": {...}
}
```

#### Test Case 2: Multiple Gift Cards
```json
POST /api/orders/create
{
  "customerEmail": "test@example.com",
  "appliedGiftCardCodes": ["SCP-12345-ABCD", "SCP-67890-EFGH"],
  "customerData": {...}
}
```

#### Test Case 3: Partial Gift Card Usage
- Create order with amount €150
- Apply gift card with €100 remaining
- Apply second gift card with €100 remaining
- Verify: First card used completely (€100), second card used partially (€50)
- Verify: First card `isUsed = true`, second card `remainingAmount = €50`

#### Test Case 4: Gift Card Validation
```json
POST /api/giftcards/validate
{
  "code": "SCP-12345-ABCD"
}
```
Expected response:
```json
{
  "success": true,
  "data": {
    "giftCard": {
      "code": "SCP-12345-ABCD",
      "remainingAmount": 100.0,
      "expirationDate": "2026-01-15T12:00:00.000Z",
      "isValid": true
    }
  }
}
```

## API Response Format

The order creation endpoint now returns:

```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "order": {
      "id": "...",
      "orderNumber": "ORD-2025-000123",
      "subtotal": 150.0,
      "discountAmount": 150.0,
      "totalAmount": 0.0,
      "orderGiftCards": [
        {
          "giftCardId": "...",
          "usedAmount": 100.0,
          "giftCard": {
            "code": "SCP-12345-ABCD",
            "remainingAmount": 0.0
          }
        },
        {
          "giftCardId": "...",
          "usedAmount": 50.0,
          "giftCard": {
            "code": "SCP-67890-EFGH",
            "remainingAmount": 50.0
          }
        }
      ],
      "clientSecret": "pi_xxx_secret_xxx" // Real Stripe PaymentIntent client secret
    },
    "paymentIntent": {
      "clientSecret": "pi_xxx_secret_xxx",
      "amount": 0
    }
  }
}
```

## Error Handling

The implementation includes comprehensive error handling:

1. **Invalid Gift Card Code**: Returns 400 with message "Bon cadeau invalide: {code}"
2. **Expired Gift Card**: Returns 400 with message "Bon cadeau expiré: {code}"
3. **Already Used Gift Card**: Returns 400 with message "Bon cadeau déjà utilisé: {code}"
4. **Empty Cart**: Returns 400 with message "Votre panier est vide"

## Backward Compatibility

The implementation maintains full backward compatibility:
- Old `appliedGiftCardCode` (string) parameter still works
- Old `appliedGiftCardId` field in Order model preserved
- Existing gift cards without `remainingAmount` default to using `amount` field

## Notes

- Gift cards are applied in the order they appear in the `appliedGiftCardCodes` array
- Each gift card can be partially used across multiple orders
- A gift card is marked as `isUsed = true` only when `remainingAmount = 0`
- The Stripe `clientSecret` returned is the real PaymentIntent client secret from Stripe API
- Gift cards expire 12 months after creation date