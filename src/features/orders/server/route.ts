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

        // Calculer le total (avec acomptes pour les stages ET baptêmes)
        let subtotal = 0;
        let depositTotal = 0; // Montant à payer aujourd'hui (acomptes)
        
        for (const item of cartItems) {
          if (item.type === 'STAGE' && item.stage) {
            const participantData = item.participantData as any;
            const fullPrice = item.stage.price * item.quantity;
            
            if (participantData?.usedGiftVoucherCode) {
              // Réservation avec bon cadeau = gratuit
              subtotal += fullPrice; // Garder le prix pour historique
              depositTotal += 0; // Mais ne rien payer
            } else {
              // Réservation normale
              const depositPrice = item.stage.acomptePrice * item.quantity;
              subtotal += fullPrice;
              depositTotal += depositPrice;
            }
          } else if (item.type === 'BAPTEME' && item.bapteme) {
            const participantData = item.participantData as any;
            const basePrice = await getBaptemePrice(participantData.selectedCategory);
            const videoPrice = participantData.hasVideo ? 25 : 0;
            const fullPrice = (basePrice + videoPrice) * item.quantity;
            
            if (participantData?.usedGiftVoucherCode) {
              // Réservation avec bon cadeau = gratuit
              subtotal += fullPrice; // Garder le prix pour historique
              depositTotal += 0; // Mais ne rien payer
            } else {
              // Réservation normale
              const depositPrice = (item.bapteme.acomptePrice + videoPrice) * item.quantity;
              subtotal += fullPrice;
              depositTotal += depositPrice;
            }
          } else if (item.type === 'GIFT_CARD') {
            const amount = item.giftCardAmount || 0;
            subtotal += amount;
            depositTotal += amount; // Cartes cadeaux: paiement complet
          } else if (item.type === 'GIFT_VOUCHER') {
            const amount = item.giftVoucherAmount || 0;
            subtotal += amount;
            depositTotal += amount; // Bons cadeaux: paiement complet
          }
        }

        // Valider et appliquer les cartes cadeaux (sur le montant de l'acompte)
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
                message: `Carte cadeau invalide: ${code}`,
                data: null,
              });
            }

            // Vérifier la date d'expiration (12 mois)
            const expirationDate = new Date(giftCard.createdAt);
            expirationDate.setFullYear(expirationDate.getFullYear() + 1);

            if (new Date() > expirationDate) {
              return c.json({
                success: false,
                message: `Carte cadeau expirée: ${code}`,
                data: null,
              });
            }

            // Vérifier le montant restant
            const availableAmount = giftCard.remainingAmount || giftCard.amount;
            if (availableAmount <= 0) {
              return c.json({
                success: false,
                message: `Carte cadeau déjà utilisée: ${code}`,
                data: null,
              });
            }

            // Calculer le montant à utiliser de cette carte cadeau
            const usedAmount = Math.min(availableAmount, remainingOrderAmount);
            discountAmount += usedAmount;
            remainingOrderAmount -= usedAmount;

            validGiftCards.push({ giftCard, usedAmount });
          }
        }

        const totalAmount = subtotal - discountAmount;
        const depositAmount = depositTotal - discountAmount; // Montant à payer aujourd'hui

        // Créer ou récupérer le client si nécessaire (pour checkout à 0€)
        let client = null;
        if (depositAmount <= 0 && customerEmail && customerData) {
          // Pour les commandes gratuites, créer le client immédiatement
          client = await prisma.client.findUnique({
            where: { email: customerEmail },
          });

          if (!client) {
            client = await prisma.client.create({
              data: {
                email: customerEmail,
                firstName: customerData.firstName || '',
                lastName: customerData.lastName || '',
                phone: customerData.phone || '',
                address: customerData.address || '',
                postalCode: customerData.postalCode || '',
                city: customerData.city || '',
                country: customerData.country || 'France',
              },
            });
            console.log(`[FREE CHECKOUT] Client created: ${client.id}`);
          }
        }

        // Créer la commande
        const orderNumber = generateOrderNumber();
        
        const order = await prisma.order.create({
          data: {
            orderNumber,
            status: depositAmount <= 0 ? 'PAID' : 'PENDING', // PAID si gratuit
            subtotal,
            discountAmount,
            totalAmount,
            clientId: client?.id, // Lier le client si créé (checkout gratuit)
            appliedGiftCardId: validGiftCards.length > 0 ? validGiftCards[0].giftCard.id : null,
            orderItems: {
              create: await Promise.all(cartItems.map(async item => {
                let unitPrice = 0;
                let depositAmount: number | null = null;
                let remainingAmount: number | null = null;
                let isFullyPaid = false;
                const participantData = item.participantData as any;

                if (item.type === 'STAGE' && item.stage) {
                  unitPrice = item.stage.price;
                  
                  if (participantData?.usedGiftVoucherCode) {
                    // Réservation avec bon cadeau
                    depositAmount = 0;
                    remainingAmount = 0;
                    isFullyPaid = true; // Payé via bon cadeau
                  } else {
                    // Réservation normale
                    const depositPrice = item.stage.acomptePrice;
                    depositAmount = depositPrice * item.quantity;
                    remainingAmount = (unitPrice - depositPrice) * item.quantity;
                    isFullyPaid = false;
                  }
                } else if (item.type === 'BAPTEME' && item.bapteme) {
                  const basePrice = await getBaptemePrice(participantData.selectedCategory);
                  const videoPrice = participantData.hasVideo ? 25 : 0;
                  unitPrice = basePrice + videoPrice;
                  
                  if (participantData?.usedGiftVoucherCode) {
                    // Réservation avec bon cadeau
                    depositAmount = 0;
                    remainingAmount = 0;
                    isFullyPaid = true; // Payé via bon cadeau
                  } else {
                    // Réservation normale
                    const depositPrice = item.bapteme.acomptePrice + videoPrice;
                    depositAmount = depositPrice * item.quantity;
                    remainingAmount = (basePrice - item.bapteme.acomptePrice) * item.quantity;
                    isFullyPaid = false;
                  }
                  
                  console.log(`BAPTEME OrderItem creation: basePrice=${basePrice}, videoPrice=${videoPrice}, unitPrice=${unitPrice}, depositAmount=${depositAmount}, remainingAmount=${remainingAmount}`);
                } else if (item.type === 'GIFT_CARD') {
                  unitPrice = item.giftCardAmount || 0;
                  isFullyPaid = true;
                } else if (item.type === 'GIFT_VOUCHER') {
                  unitPrice = item.giftVoucherAmount || 0;
                  isFullyPaid = true; // Bons cadeaux: paiement complet
                }

                return {
                  type: item.type,
                  quantity: item.quantity,
                  unitPrice,
                  totalPrice: unitPrice * item.quantity,
                  depositAmount,
                  remainingAmount,
                  isFullyPaid,
                  stageId: item.stageId,
                  baptemeId: item.baptemeId,
                  giftCardAmount: item.giftCardAmount,
                  giftVoucherAmount: item.giftVoucherAmount,
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

        // Mettre à jour les cartes cadeaux utilisées
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

        // Calculer les détails des paiements restants par stage ET baptême
        const remainingPayments = [
          // Stages
          ...cartItems
            .filter(item => item.type === 'STAGE' && item.stage)
            .map(item => ({
              type: 'STAGE' as const,
              itemId: item.stage!.id,
              itemDate: item.stage!.startDate,
              remainingAmount: (item.stage!.price - item.stage!.acomptePrice) * item.quantity,
              dueDate: item.stage!.startDate, // À payer avant le début du stage
            })),
          // Baptêmes
          ...(await Promise.all(cartItems
            .filter(item => item.type === 'BAPTEME' && item.bapteme)
            .map(async item => {
              const participantData = item.participantData as any;
              const basePrice = await getBaptemePrice(participantData.selectedCategory);
              const videoPrice = participantData.hasVideo ? 25 : 0;
              const remaining = basePrice - item.bapteme!.acomptePrice; // Reste du baptême seulement (vidéo déjà payée)
              return {
                type: 'BAPTEME' as const,
                itemId: item.bapteme!.id,
                itemDate: item.bapteme!.date,
                remainingAmount: remaining * item.quantity,
                dueDate: item.bapteme!.date, // À payer le jour du baptême
              };
            })))
        ];

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
              discountAmount: order.discountAmount, // Montant des réductions (cartes cadeaux)
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
  )

  // SEARCH orders (admin only)
  .get(
    "search",
    adminSessionMiddleware,
    async (c) => {
      try {
        const query = c.req.query("q") || "";
        
        if (!query || query.length < 2) {
          return c.json({
            success: true,
            data: [],
          });
        }

        const orders = await prisma.order.findMany({
          where: {
            OR: [
              {
                orderNumber: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                client: {
                  OR: [
                    {
                      firstName: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                    {
                      lastName: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                    {
                      email: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                  ],
                },
              },
            ],
          },
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            orderItems: {
              select: {
                id: true,
                type: true,
                quantity: true,
                totalPrice: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Limiter à 10 résultats
        });

        return c.json({
          success: true,
          data: orders,
        });

      } catch (error) {
        console.error('Erreur recherche commandes:', error);
        return c.json({
          success: false,
          message: "Erreur lors de la recherche des commandes",
          data: null,
        });
      }
    }
  )

  // GET all orders (admin only)
  .get(
    "getAll",
    adminSessionMiddleware,
    async (c) => {
      try {
        // Calculate the cutoff time (6 hours ago)
        const sixHoursAgo = new Date();
        sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

        const orders = await prisma.order.findMany({
          where: {
            OR: [
              // Include all non-PENDING orders
              {
                status: {
                  not: 'PENDING',
                },
              },
              // Include PENDING orders updated within the last 6 hours
              {
                AND: [
                  {
                    status: 'PENDING',
                  },
                  {
                    updatedAt: {
                      gte: sixHoursAgo,
                    },
                  },
                ],
              },
            ],
          },
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            orderItems: {
              select: {
                id: true,
                type: true,
                quantity: true,
                totalPrice: true,
              },
            },
            payments: {
              select: {
                id: true,
                status: true,
                amount: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return c.json({
          success: true,
          data: orders,
        });

      } catch (error) {
        console.error('Erreur récupération commandes:', error);
        return c.json({
          success: false,
          message: "Erreur lors de la récupération des commandes",
          data: null,
        });
      }
    }
  )

  // CONFIRM final payment for an OrderItem (admin only)
  .post(
    "/confirmFinalPayment/:orderItemId",
    adminSessionMiddleware,
    zValidator("json", z.object({
      note: z.string().optional(),
    })),
    async (c) => {
      const orderItemId = c.req.param("orderItemId");
      const { note } = c.req.valid("json");

      if (!orderItemId) {
        return c.json({
          success: false,
          message: "ID de l'article requis",
          data: null,
        });
      }

      try {
        // 1. Récupérer l'OrderItem
        const orderItem = await prisma.orderItem.findUnique({
          where: { id: orderItemId },
          include: {
            order: {
              include: {
                orderItems: true,
              },
            },
          },
        });

        if (!orderItem) {
          return c.json({
            success: false,
            message: "Article de commande introuvable",
            data: null,
          });
        }

        // 2. Vérifier que c'est un stage ou un baptême
        if (orderItem.type !== 'STAGE' && orderItem.type !== 'BAPTEME') {
          return c.json({
            success: false,
            message: "Seuls les stages et baptêmes nécessitent un paiement final",
            data: null,
          });
        }

        // 3. Vérifier qu'il n'est pas déjà entièrement payé
        if (orderItem.isFullyPaid) {
          return c.json({
            success: false,
            message: "Cet article est déjà entièrement payé",
            data: null,
          });
        }

        // 4. Mettre à jour l'OrderItem
        const updatedOrderItem = await prisma.orderItem.update({
          where: { id: orderItemId },
          data: {
            isFullyPaid: true,
            finalPaymentDate: new Date(),
            finalPaymentNote: note,
            remainingAmount: 0,
          },
        });

        // 5. Vérifier si tous les items de la commande sont entièrement payés
        const allItemsFullyPaid = orderItem.order.orderItems.every(
          item => item.id === orderItemId || item.isFullyPaid
        );

        // 6. Mettre à jour le statut de la commande si nécessaire
        if (allItemsFullyPaid) {
          await prisma.order.update({
            where: { id: orderItem.orderId },
            data: { status: 'FULLY_PAID' },
          });
        }

        return c.json({
          success: true,
          message: `Paiement final confirmé. ${allItemsFullyPaid ? 'Commande entièrement payée.' : 'Il reste des articles à payer.'}`,
          data: {
            orderItem: updatedOrderItem,
            orderFullyPaid: allItemsFullyPaid,
          },
        });

      } catch (error) {
        console.error('Erreur confirmation paiement final:', error);
        return c.json({
          success: false,
          message: "Erreur lors de la confirmation du paiement final",
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