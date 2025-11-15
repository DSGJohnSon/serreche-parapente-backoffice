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
        let { customerEmail, appliedGiftCardCodes, appliedGiftCardCode, customerData } = c.req.valid("json");
        const cartSession = c.get("cartSession") as any;

        // Backward compatibility: convert single code to array
        if (appliedGiftCardCode && (!appliedGiftCardCodes || appliedGiftCardCodes.length === 0)) {
          appliedGiftCardCodes = [appliedGiftCardCode];
        }

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

        // Calculer le total (avec acomptes pour les stages)
        let subtotal = 0;
        let depositTotal = 0; // Montant à payer aujourd'hui (acomptes)
        
        for (const item of cartItems) {
          if (item.type === 'STAGE' && item.stage) {
            const fullPrice = item.stage.price * item.quantity;
            const depositPrice = item.stage.acomptePrice * item.quantity;
            subtotal += fullPrice;
            depositTotal += depositPrice;
          } else if (item.type === 'BAPTEME') {
            const participantData = item.participantData as any;
            const basePrice = await getBaptemePrice(participantData.selectedCategory);
            const videoPrice = participantData.hasVideo ? 25 : 0;
            const itemTotal = (basePrice + videoPrice) * item.quantity;
            subtotal += itemTotal;
            depositTotal += itemTotal; // Baptêmes: paiement complet
          } else if (item.type === 'GIFT_CARD') {
            const amount = item.giftCardAmount || 0;
            subtotal += amount;
            depositTotal += amount; // Bons cadeaux: paiement complet
          }
        }

        // Valider et appliquer les bons cadeaux (sur le montant de l'acompte)
        let discountAmount = 0;
        const validGiftCards: Array<{ giftCard: any; usedAmount: number }> = [];

        if (appliedGiftCardCodes && appliedGiftCardCodes.length > 0) {
          let remainingOrderAmount = depositTotal;

          for (const code of appliedGiftCardCodes) {
            if (remainingOrderAmount <= 0) break;

            const giftCard = await prisma.giftCard.findUnique({
              where: { code: code.toUpperCase() },
            });

            if (!giftCard) {
              return c.json({
                success: false,
                message: `Bon cadeau invalide: ${code}`,
                data: null,
              });
            }

            // Vérifier la date d'expiration (12 mois)
            const expirationDate = new Date(giftCard.createdAt);
            expirationDate.setFullYear(expirationDate.getFullYear() + 1);

            if (new Date() > expirationDate) {
              return c.json({
                success: false,
                message: `Bon cadeau expiré: ${code}`,
                data: null,
              });
            }

            // Vérifier le montant restant
            const availableAmount = giftCard.remainingAmount || giftCard.amount;
            if (availableAmount <= 0) {
              return c.json({
                success: false,
                message: `Bon cadeau déjà utilisé: ${code}`,
                data: null,
              });
            }

            // Calculer le montant à utiliser de ce bon cadeau
            const usedAmount = Math.min(availableAmount, remainingOrderAmount);
            discountAmount += usedAmount;
            remainingOrderAmount -= usedAmount;

            validGiftCards.push({ giftCard, usedAmount });
          }
        }

        const totalAmount = subtotal - discountAmount;
        const depositAmount = depositTotal - discountAmount; // Montant à payer aujourd'hui

        // NE PAS créer le client ici - il sera créé lors du paiement réussi via webhook
        // Les données client seront stockées dans les métadonnées du PaymentIntent

        // Créer la commande SANS client (sera lié lors du webhook)
        const orderNumber = generateOrderNumber();
        
        const order = await prisma.order.create({
          data: {
            orderNumber,
            status: 'PENDING',
            subtotal,
            discountAmount,
            totalAmount,
            // clientId sera défini lors du paiement réussi via webhook
            appliedGiftCardId: validGiftCards.length > 0 ? validGiftCards[0].giftCard.id : null, // Backward compatibility
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
            orderGiftCards: {
              create: validGiftCards.map(({ giftCard, usedAmount }) => ({
                giftCardId: giftCard.id,
                usedAmount,
              })),
            },
          },
          include: {
            orderItems: true,
            appliedGiftCard: true,
            orderGiftCards: {
              include: {
                giftCard: true,
              },
            },
          },
        });

        // Mettre à jour les bons cadeaux utilisés
        for (const { giftCard, usedAmount } of validGiftCards) {
          const newRemainingAmount = (giftCard.remainingAmount || giftCard.amount) - usedAmount;
          await prisma.giftCard.update({
            where: { id: giftCard.id },
            data: {
              remainingAmount: newRemainingAmount,
              isUsed: newRemainingAmount <= 0,
              usedAt: giftCard.usedAt || new Date(),
              usedByOrderId: order.id,
            },
          });
        }

        // Créer le Payment Intent Stripe pour le montant de l'acompte
        // Inclure le sessionId ET les données client dans les métadonnées
        const paymentIntent = await createPaymentIntent({
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: depositAmount, // Utiliser le montant de l'acompte
          sessionId: cartSession.sessionId, // Pour vider le panier
          customerEmail: customerEmail, // Pour créer le client
          customerData: customerData, // Données complètes du client
        });

        console.log('PaymentIntent créé:', {
          id: paymentIntent.id,
          hasClientSecret: !!paymentIntent.client_secret,
          clientSecretFormat: paymentIntent.client_secret?.substring(0, 20) + '...',
          amount: paymentIntent.amount,
          depositAmount: depositAmount,
          fullAmount: order.totalAmount,
        });

        // Enregistrer le paiement (montant de l'acompte)
        await prisma.payment.create({
          data: {
            orderId: order.id,
            stripePaymentIntentId: paymentIntent.id,
            status: 'PENDING',
            amount: depositAmount, // Montant de l'acompte
            currency: 'eur',
          },
        });

        // NE PAS vider le panier ici - il sera vidé lors de la confirmation du paiement via webhook
        // Le panier reste disponible si l'utilisateur ferme la page et revient plus tard

        // Calculer les détails des paiements restants par stage
        const remainingPayments = cartItems
          .filter(item => item.type === 'STAGE' && item.stage)
          .map(item => ({
            stageId: item.stage!.id,
            stageStartDate: item.stage!.startDate,
            remainingAmount: (item.stage!.price - item.stage!.acomptePrice) * item.quantity,
            dueDate: item.stage!.startDate, // À payer avant le début du stage
          }));

        const totalRemainingAmount = remainingPayments.reduce((sum, payment) => sum + payment.remainingAmount, 0);

        return c.json({
          success: true,
          message: "Commande créée avec succès",
          data: {
            order: {
              id: order.id,
              orderNumber: order.orderNumber,
              totalAmount: order.totalAmount, // Montant total de la commande
              subtotal: order.subtotal, // Sous-total avant réductions
              discountAmount: order.discountAmount, // Montant des réductions (bons cadeaux)
              depositAmount: depositAmount, // Montant à payer AUJOURD'HUI
              remainingAmount: totalRemainingAmount, // Montant restant à payer plus tard
              customerEmail: customerEmail,
              status: order.status,
              createdAt: order.createdAt,
            },
            paymentIntent: {
              id: paymentIntent.id,
              clientSecret: paymentIntent.client_secret,
              amount: paymentIntent.amount, // Montant en centimes
            },
            remainingPayments: remainingPayments, // Détails des paiements restants par stage
          },
        });

      } catch (error) {
        console.error('Erreur création commande:', error);
        return c.json(
          {
            success: false,
            message: error instanceof Error ? error.message : "Erreur lors de la création de la commande",
            data: null,
          },
          500
        );
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
                    stagiaire: true,
                  },
                },
                baptemeBooking: {
                  include: {
                    stagiaire: true,
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