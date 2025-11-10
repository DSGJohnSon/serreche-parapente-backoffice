import "server-only";
import Stripe from 'stripe';

// Stripe optionnel pour les tests
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    })
  : null;

// Configuration des métadonnées pour traçabilité
export const createPaymentIntent = async (order: {
  id: string;
  orderNumber: string;
  totalAmount: number;
}) => {
  if (!stripe) {
    // Mode test sans Stripe
    return {
      id: `pi_test_${Date.now()}`,
      client_secret: `pi_test_${Date.now()}_secret_test`,
      amount: Math.round(order.totalAmount * 100),
    };
  }

  return await stripe!.paymentIntents.create({
    amount: Math.round(order.totalAmount * 100), // Centimes
    currency: 'eur',
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
    },
  });
};

// Fonction pour générer un numéro de commande unique
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `ORD-${year}-${timestamp}${random}`;
}

// Validation du montant de paiement
export const validatePaymentAmount = (paymentIntent: Stripe.PaymentIntent, expectedAmount: number) => {
  const expectedAmountCents = Math.round(expectedAmount * 100);
  return paymentIntent.amount === expectedAmountCents;
};

// Gestion des erreurs Stripe
export const handleStripeError = (error: any): string => {
  switch (error.code) {
    case 'card_declined':
      return 'Votre carte a été refusée. Veuillez essayer avec une autre carte.';
    case 'insufficient_funds':
      return 'Fonds insuffisants sur votre carte.';
    case 'expired_card':
      return 'Votre carte a expiré.';
    case 'incorrect_cvc':
      return 'Code de sécurité incorrect.';
    case 'processing_error':
      return 'Erreur de traitement. Veuillez réessayer.';
    default:
      return 'Une erreur de paiement est survenue. Veuillez réessayer.';
  }
};

// Créer un Payment Intent avec clé d'idempotence
export const createPaymentWithIdempotency = async (order: {
  id: string;
  orderNumber: string;
  totalAmount: number;
  customerEmail: string;
}) => {
  if (!stripe) {
    // Mode test sans Stripe
    return {
      id: `pi_test_${Date.now()}`,
      client_secret: `pi_test_${Date.now()}_secret_test`,
      amount: Math.round(order.totalAmount * 100),
    };
  }

  return await stripe.paymentIntents.create({
    amount: Math.round(order.totalAmount * 100),
    currency: 'eur',
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
    },
  }, {
    idempotencyKey: `order-${order.id}-${Date.now()}`,
  });
};