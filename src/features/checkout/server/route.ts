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
            status: "SUCCEEDED",
          },
        });

        // Mettre à jour le statut de la commande
        const order = await prisma.order.update({
          where: { id: orderId },
          data: { status: "PAID" },
          include: {
            orderItems: {
              include: {
                stage: true,
                bapteme: true,
              },
            },
          },
        });

        // Note: La mise à jour des cartes/bons cadeaux est gérée par le webhook Stripe

        return c.json({
          success: true,
          message: "Paiement confirmé avec succès",
          data: { order, payment },
        });
      } catch (error) {
        console.error("Erreur confirmation paiement:", error);
        return c.json({
          success: false,
          message: "Erreur lors de la confirmation du paiement",
          data: null,
        });
      }
    },
  );

export default app;
