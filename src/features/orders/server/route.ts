import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { publicAPIMiddleware, adminSessionMiddleware } from "@/lib/session-middleware";
import { cartSessionMiddleware } from "@/lib/cart-middleware";
import prisma from "@/lib/prisma";
import { CreateOrderSchema, UpdateOrderStatusSchema, CreatePaymentIntentSchema, ConfirmPaymentSchema } from "../schemas";
import { generateOrderNumber, createPaymentIntent } from "@/lib/stripe";
import { z } from "zod";

const app = new Hono()
  // CREATE order from cart
  .post(
    "create",
    publicAPIMiddleware,
    zValidator("json", CreateOrderSchema),
    cartSessionMiddleware,
    async (c) => {
      try {
        const { customerEmail, appliedGiftCardCode, customerData } = c.req.valid("json");
        const cartSession = c.get("cartSession") as any;

        // Récupérer les items du panier
        const cartItems = await prisma.cartItem.findMany({
          where: {
            cartSessionId: cartSession.id,
          },
          include: {
            stage: true,
            bapteme: true,
          },
        });

        if (cartItems.length === 0) {
          return c.json({
            success: false,
            message: "Votre panier est vide",
            data: null,
          });
        }

        // Calculer le total
        let subtotal = 0;
        for (const item of cartItems) {
          if (item.type === 'STAGE' && item.stage) {
            subtotal += item.stage.price * item.quantity;
          } else if (item.type === 'BAPTEME') {
            const participantData = item.participantData as any;
            const basePrice = await getBaptemePrice(participantData.selectedCategory);
            const videoPrice = participantData.hasVideo ? 25 : 0;
            subtotal += (basePrice + videoPrice) * item.quantity;
          } else if (item.type === 'GIFT_CARD') {
            subtotal += item.giftCardAmount || 0;
          }
        }

        let discountAmount = 0;
        let appliedGiftCard = null;

        // Appliquer le bon cadeau si fourni
        if (appliedGiftCardCode) {
          const giftCard = await prisma.giftCard.findUnique({
            where: { code: appliedGiftCardCode.toUpperCase() },
          });

          if (giftCard && !giftCard.isUsed) {
            // Vérifier la date d'expiration (12 mois)
            const expirationDate = new Date(giftCard.createdAt);
            expirationDate.setFullYear(expirationDate.getFullYear() + 1);

            if (new Date() <= expirationDate) {
              discountAmount = Math.min(giftCard.amount, subtotal);
              appliedGiftCard = giftCard;
            }
          }
        }

        const totalAmount = subtotal - discountAmount;

        // Créer la commande
        const orderNumber = generateOrderNumber();
        
        const order = await prisma.order.create({
          data: {
            orderNumber,
            status: 'PENDING',
            subtotal,
            discountAmount,
            totalAmount,
            customerEmail,
            customerData: customerData || {},
            appliedGiftCardId: appliedGiftCard?.id,
            orderItems: {
              create: await Promise.all(cartItems.map(async item => {
                let unitPrice = 0;
                if (item.type === 'STAGE' && item.stage) {
                  unitPrice = item.stage.price;
                } else if (item.type === 'BAPTEME') {
                  const participantData = item.participantData as any;
                  const basePrice = await getBaptemePrice(participantData.selectedCategory);
                  const videoPrice = participantData.hasVideo ? 25 : 0;
                  unitPrice = basePrice + videoPrice;
                } else if (item.type === 'GIFT_CARD') {
                  unitPrice = item.giftCardAmount || 0;
                }

                return {
                  type: item.type,
                  quantity: item.quantity,
                  unitPrice,
                  totalPrice: unitPrice * item.quantity,
                  stageId: item.stageId,
                  baptemeId: item.baptemeId,
                  giftCardAmount: item.giftCardAmount,
                  participantData: item.participantData as any,
                };
              })),
            },
          },
          include: {
            orderItems: true,
            appliedGiftCard: true,
          },
        });

        // Créer le Payment Intent Stripe
        const paymentIntent = await createPaymentIntent({
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          customerEmail: order.customerEmail,
        });

        // Enregistrer le paiement
        await prisma.payment.create({
          data: {
            orderId: order.id,
            stripePaymentIntentId: paymentIntent.id,
            status: 'PENDING',
            amount: order.totalAmount,
            currency: 'eur',
          },
        });

        // Vider le panier
        await prisma.cartItem.deleteMany({
          where: {
            cartSessionId: cartSession.id,
          },
        });

        return c.json({
          success: true,
          message: "Commande créée avec succès",
          data: {
            order: {
              ...order,
              clientSecret: paymentIntent.client_secret, // Ajouter le client secret à l'order
            },
            paymentIntent: {
              clientSecret: paymentIntent.client_secret,
              amount: paymentIntent.amount,
            },
          },
        });

      } catch (error) {
        console.error('Erreur création commande:', error);
        return c.json({
          success: false,
          message: "Erreur lors de la création de la commande",
          data: null,
        });
      }
    }
  )

  // GET order by ID
  .get(
    "getById/:id",
    publicAPIMiddleware,
    async (c) => {
      try {
        const orderId = c.req.param("id");

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            orderItems: {
              include: {
                stage: true,
                bapteme: true,
                stageBooking: {
                  include: {
                    customer: true,
                  },
                },
                baptemeBooking: {
                  include: {
                    customer: true,
                  },
                },
              },
            },
            appliedGiftCard: true,
            payments: true,
          },
        });

        if (!order) {
          return c.json({
            success: false,
            message: "Commande introuvable",
            data: null,
          });
        }

        return c.json({
          success: true,
          data: order,
        });

      } catch (error) {
        console.error('Erreur récupération commande:', error);
        return c.json({
          success: false,
          message: "Erreur lors de la récupération de la commande",
          data: null,
        });
      }
    }
  )

  // UPDATE order status (admin only)
  .put(
    "updateStatus",
    adminSessionMiddleware,
    zValidator("json", UpdateOrderStatusSchema),
    async (c) => {
      try {
        const { orderId, status } = c.req.valid("json");

        const order = await prisma.order.update({
          where: { id: orderId },
          data: { status },
          include: {
            orderItems: true,
            payments: true,
          },
        });

        return c.json({
          success: true,
          message: `Commande ${order.orderNumber} mise à jour`,
          data: order,
        });

      } catch (error) {
        console.error('Erreur mise à jour commande:', error);
        return c.json({
          success: false,
          message: "Erreur lors de la mise à jour de la commande",
          data: null,
        });
      }
    }
  );

// Fonction utilitaire pour obtenir le prix d'un baptême selon la catégorie
async function getBaptemePrice(category: string): Promise<number> {
  const defaultPrices = {
    AVENTURE: 110,
    DUREE: 150,
    LONGUE_DUREE: 185,
    ENFANT: 90,
    HIVER: 130,
  };
  
  if (!category || category === '') {
    return 110;
  }
  
  try {
    const categoryPrice = await prisma.baptemeCategoryPrice.findUnique({
      where: { category: category as any },
    });
    
    return categoryPrice?.price || defaultPrices[category as keyof typeof defaultPrices] || 110;
  } catch (error) {
    return defaultPrices[category as keyof typeof defaultPrices] || 110;
  }
}

export default app;