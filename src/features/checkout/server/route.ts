import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { publicAPIMiddleware } from "@/lib/session-middleware";
import prisma from "@/lib/prisma";
import { z } from "zod";

const ConfirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  orderId: z.string(),
});

const app = new Hono()
  // Confirm payment
  .post(
    "confirm",
    publicAPIMiddleware,
    zValidator("json", ConfirmPaymentSchema),
    async (c) => {
      try {
        const { paymentIntentId, orderId } = c.req.valid("json");

        // Mettre à jour le statut du paiement
        const payment = await prisma.payment.update({
          where: { stripePaymentIntentId: paymentIntentId },
          data: { 
            status: 'SUCCEEDED',
          },
        });

        // Mettre à jour le statut de la commande
        const order = await prisma.order.update({
          where: { id: orderId },
          data: { status: 'PAID' },
          include: {
            orderItems: {
              include: {
                stage: true,
                bapteme: true,
              },
            },
          },
        });

        // Créer les réservations pour chaque item
        await createBookingsFromOrder(order);

        // Marquer les cartes cadeaux comme utilisées si applicable
        if (order.appliedGiftCardId) {
          await prisma.giftCard.update({
            where: { id: order.appliedGiftCardId },
            data: {
              isUsed: true,
              usedAt: new Date(),
              usedByOrderId: order.id,
            },
          });
        }

        return c.json({
          success: true,
          message: "Paiement confirmé avec succès",
          data: { order, payment },
        });

      } catch (error) {
        console.error('Erreur confirmation paiement:', error);
        return c.json({
          success: false,
          message: "Erreur lors de la confirmation du paiement",
          data: null,
        });
      }
    }
  );

// Fonction pour créer les réservations à partir d'une commande
// NOTE: Cette fonction est OBSOLÈTE et ne devrait JAMAIS être appelée pour les paiements Stripe
// Les réservations et gift cards sont créées par le webhook Stripe
async function createBookingsFromOrder(order: any) {
  // console.log(`[CHECKOUT] ⚠️⚠️⚠️ createBookingsFromOrder called in checkout/server - THIS IS OBSOLETE FOR STRIPE PAYMENTS - Order: ${order.id} - Timestamp: ${new Date().toISOString()}`);
  
  // NE RIEN FAIRE - Tout est géré par le webhook Stripe
  // Cette fonction est conservée uniquement pour compatibilité avec d'anciens paiements manuels
  return;
}

// Fonction pour trouver ou créer un stagiaire
async function findOrCreateStagiaire(participantData: any) {
  // Chercher d'abord par email
  let stagiaire = await prisma.stagiaire.findFirst({
    where: { email: participantData.email },
  });

  if (!stagiaire) {
    // Créer un nouveau stagiaire
    stagiaire = await prisma.stagiaire.create({
      data: {
        firstName: participantData.firstName,
        lastName: participantData.lastName,
        email: participantData.email,
        phone: participantData.phone,
        weight: participantData.weight,
        height: participantData.height,
        birthDate: participantData.birthDate ? new Date(participantData.birthDate) : null,
      },
    });
  }

  return stagiaire;
}

// Fonction pour générer un code unique de carte cadeau
async function generateUniqueGiftCardCode(): Promise<string> {
  let code: string;
  let exists = true;

  do {
    const prefix = 'SCP';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `${prefix}-${timestamp}-${random}`;
    
    const existing = await prisma.giftCard.findUnique({
      where: { code },
    });
    exists = !!existing;
  } while (exists);

  return code;
}

export default app;