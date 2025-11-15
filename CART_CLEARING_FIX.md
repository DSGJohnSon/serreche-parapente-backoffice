# Fix: Cart Clearing Logic - Moved to Webhook + Idempotence

## Problem
The cart was being cleared too early in the payment process (during order creation), causing issues when users closed the payment page and returned later - their cart would be empty and they'd have to start over.

## Additional Problem Fixed
Webhook events were being processed multiple times, causing duplicate bookings and gift cards. This is now fixed with idempotence using the `ProcessedWebhookEvent` table.

## Solution Implemented

### 1. Order Creation Route (`src/features/orders/server/route.ts`)
**Changes:**
- **REMOVED** cart clearing logic from POST `/api/orders/create` (lines 244-249)
- **ADDED** sessionId to PaymentIntent metadata for webhook tracking
- Cart now remains intact after order creation

**Benefits:**
- Users can close the payment page and return later
- Cart persists until payment is confirmed
- Better user experience aligned with e-commerce standards

### 2. Stripe Webhook Handler (`src/app/api/webhooks/stripe/route.ts`)
**Created new webhook endpoint** at `/api/webhooks/stripe`

**Handles two events:**
- `payment_intent.succeeded`: Confirms payment and clears cart
- `payment_intent.payment_failed`: Marks order as cancelled

**IDEMPOTENCE PROTECTION:**
- Checks if event has already been processed using `ProcessedWebhookEvent` table
- If already processed, returns immediately without re-processing
- After successful processing, marks event as processed

**On successful payment:**
1. **Checks idempotence** - skips if already processed
2. Updates payment status to `SUCCEEDED`
3. Updates order status to `PAID`
4. Creates bookings (stages, baptêmes, gift cards)
5. **Clears the cart** using sessionId from PaymentIntent metadata
6. **Marks event as processed** to prevent duplicates
7. Logs confirmation

### 3. Stripe Configuration (`src/lib/stripe.ts`)
**Updated `createPaymentIntent` function:**
- Added optional `sessionId` parameter
- Includes sessionId in PaymentIntent metadata
- Enables webhook to identify and clear the correct cart

### 4. Database Schema (`prisma/schema.prisma`)
**Added `ProcessedWebhookEvent` model:**
- Stores Stripe event IDs that have been processed
- Prevents duplicate processing of webhook events
- Indexed on `stripeEventId` for fast lookups

## Flow Diagram

```
User adds items to cart
         ↓
POST /api/orders/create
         ↓
Order created (status: PENDING)
PaymentIntent created with sessionId
Cart REMAINS INTACT ✓
         ↓
User completes payment
         ↓
Stripe webhook: payment_intent.succeeded
         ↓
Order status → PAID
Bookings created
Cart CLEARED ✓
```

## Configuration Required

### Environment Variables
Add to `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Stripe Dashboard Setup
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Testing

### Local Testing with Stripe CLI
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will give you a webhook secret starting with whsec_
# Add it to your .env file

# Test a payment
stripe trigger payment_intent.succeeded
```

### Manual Testing Flow
1. Add items to cart
2. Create order (cart should remain)
3. Close payment page
4. Return to site - cart should still have items
5. Complete payment
6. Webhook processes → cart should be cleared
7. Check order status → should be PAID

## Files Modified

1. **src/features/orders/server/route.ts**
   - Removed cart clearing (lines 244-249)
   - Added sessionId to PaymentIntent metadata

2. **src/lib/stripe.ts**
   - Updated `createPaymentIntent` signature
   - Added sessionId to metadata

3. **src/app/api/webhooks/stripe/route.ts** (NEW)
   - Created webhook handler
   - Implements idempotence check
   - Implements cart clearing on payment success
   - Handles payment failures
   - Records processed events

4. **prisma/schema.prisma**
   - Added `ProcessedWebhookEvent` model
   - Prevents duplicate webhook processing

## Advantages

✅ **Better UX**: Users can close and return to payment page
✅ **Cart Persistence**: Cart remains until payment confirmed
✅ **Standard Practice**: Follows e-commerce best practices
✅ **Reliable**: Uses Stripe webhooks for confirmation
✅ **Traceable**: SessionId links cart to payment
✅ **Idempotent**: Prevents duplicate processing of webhooks
✅ **No Duplicates**: Bookings and gift cards created only once

## Important Notes

- Cart is only cleared after successful payment confirmation via webhook
- If webhook fails, cart remains (manual cleanup may be needed)
- SessionId is crucial for identifying which cart to clear
- Webhook endpoint must be publicly accessible for Stripe to call it
- Always verify webhook signatures for security
- **Idempotence ensures each webhook event is processed exactly once**
- Stripe may send the same event multiple times - this is now handled correctly

## Rollback Plan

If issues occur, you can temporarily revert by:
1. Re-enabling cart clearing in order creation route
2. Disabling webhook endpoint
3. However, this brings back the original problem

## Future Improvements

- Add cart expiration cleanup job (remove carts older than X days)
- Implement retry logic for failed webhook processing
- Add monitoring/alerting for webhook failures
- Consider adding email notifications on payment success
- Add cleanup job for old `ProcessedWebhookEvent` records (e.g., older than 30 days)