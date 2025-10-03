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

        // Marquer les bons cadeaux comme utilisés si applicable
        if (order.appliedGiftCardId) {
          await prisma.giftCard.update({
            where: { id: order.appliedGiftCardId },
            data: {
              isUsed: true,
              usedAt: new Date(),
              usedBy: order.customerEmail,
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
async function createBookingsFromOrder(order: any) {
  for (const item of order.orderItems) {
    if (item.type === 'STAGE' && item.stageId) {
      // Créer ou récupérer le customer
      const customer = await findOrCreateCustomer(item.participantData);
      
      // Créer la réservation de stage
      const booking = await prisma.stageBooking.create({
        data: {
          stageId: item.stageId,
          customerId: customer.id,
          type: item.stage.type,
        },
      });

      // Lier la réservation à l'order item
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { stageBookingId: booking.id },
      });
    }

    if (item.type === 'BAPTEME' && item.baptemeId) {
      // Créer ou récupérer le customer
      const customer = await findOrCreateCustomer(item.participantData);
      
      // Créer la réservation de baptême
      const selectedCategory = item.participantData.selectedCategory;
      
      // Vérifier que la catégorie est valide
      if (!selectedCategory || selectedCategory === '') {
        console.error('Catégorie de baptême manquante pour item:', item.id);
        continue; // Passer à l'item suivant
      }

      const booking = await prisma.baptemeBooking.create({
        data: {
          baptemeId: item.baptemeId,
          customerId: customer.id,
          category: selectedCategory as any,
          hasVideo: item.participantData.hasVideo || false,
        },
      });

      // Lier la réservation à l'order item
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { baptemeBookingId: booking.id },
      });
    }

    if (item.type === 'GIFT_CARD') {
      // Générer un code unique pour le bon cadeau
      const code = await generateUniqueGiftCardCode();
      
      const giftCard = await prisma.giftCard.create({
        data: {
          code,
          amount: item.giftCardAmount!,
          customerId: null, // Sera assigné lors de l'utilisation
        },
      });

      // Lier le bon cadeau à l'order item
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { generatedGiftCardId: giftCard.id },
      });
    }
  }
}

// Fonction pour trouver ou créer un customer
async function findOrCreateCustomer(participantData: any) {
  // Chercher d'abord par email
  let customer = await prisma.customer.findUnique({
    where: { email: participantData.email },
  });

  if (!customer) {
    // Créer un nouveau customer
    customer = await prisma.customer.create({
      data: {
        firstName: participantData.firstName,
        lastName: participantData.lastName,
        email: participantData.email,
        phone: participantData.phone,
        adress: participantData.address || '',
        postalCode: participantData.postalCode || '',
        city: participantData.city || '',
        country: participantData.country || 'France',
        weight: participantData.weight,
        height: participantData.height,
        birthDate: participantData.birthDate ? new Date(participantData.birthDate) : null,
      },
    });
  }

  return customer;
}

// Fonction pour générer un code unique de bon cadeau
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