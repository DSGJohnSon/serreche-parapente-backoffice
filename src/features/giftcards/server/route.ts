import { Hono } from "hono";
import { adminSessionMiddleware, sessionMiddleware } from "@/lib/session-middleware";
import prisma from "@/lib/prisma";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { CreateGiftCardSchema, UpdateGiftCardSchema, UseGiftCardSchema, ValidateGiftCardSchema } from "../schemas";

const app = new Hono()
  //*------------------*//
  //ALL GET REQUESTS API
  //*------------------*//
  
  // Get all gift cards
  .get(
    "getAll",
    adminSessionMiddleware,
    async (c) => {
      try {
        const result = await prisma.giftCard.findMany({
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        return c.json({ success: true, message: "", data: result });
      } catch (error) {
        return c.json({
          success: false,
          message: "Erreur lors de la récupération des cartes cadeaux",
          data: null,
        });
      }
    }
  )

  // Get gift card by ID
  .get(
    "getById/:id",
    adminSessionMiddleware,
    async (c) => {
      try {
        const id = c.req.param("id");
        if (!id) {
          return c.json({
            success: false,
            message: "ID requis",
            data: null,
          });
        }
        
        const result = await prisma.giftCard.findUnique({
          where: { id },
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });
        
        return c.json({ success: true, message: "", data: result });
      } catch (error) {
        return c.json({
          success: false,
          message: "Erreur lors de la récupération de la carte cadeau",
          data: null,
        });
      }
    }
  )

  // Get gift card usage history
  .get(
    "getHistory/:id",
    adminSessionMiddleware,
    async (c) => {
      try {
        const id = c.req.param("id");
        if (!id) {
          return c.json({
            success: false,
            message: "ID requis",
            data: null,
          });
        }
        
        // Get gift card with all its usage history
        const giftCard = await prisma.giftCard.findUnique({
          where: { id },
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            appliedToOrders: {
              include: {
                order: {
                  select: {
                    id: true,
                    orderNumber: true,
                    createdAt: true,
                    status: true,
                    client: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        });

        if (!giftCard) {
          return c.json({
            success: false,
            message: "Carte cadeau introuvable",
            data: null,
          });
        }
        
        return c.json({ 
          success: true, 
          message: "", 
          data: giftCard 
        });
      } catch (error) {
        console.error("Error fetching gift card history:", error);
        return c.json({
          success: false,
          message: "Erreur lors de la récupération de l'historique",
          data: null,
        });
      }
    }
  )

  // Get unused gift cards
  .get(
    "getUnused",
    adminSessionMiddleware,
    async (c) => {
      try {
        const result = await prisma.giftCard.findMany({
          where: {
            isUsed: false,
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
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        return c.json({ success: true, message: "", data: result });
      } catch (error) {
        return c.json({
          success: false,
          message: "Erreur lors de la récupération des cartes cadeaux non utilisées",
          data: null,
        });
      }
    }
  )

  // Get used gift cards
  .get(
    "getUsed",
    adminSessionMiddleware,
    async (c) => {
      try {
        const result = await prisma.giftCard.findMany({
          where: {
            isUsed: true,
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
          },
          orderBy: {
            usedAt: 'desc',
          },
        });
        return c.json({ success: true, message: "", data: result });
      } catch (error) {
        return c.json({
          success: false,
          message: "Erreur lors de la récupération des cartes cadeaux utilisées",
          data: null,
        });
      }
    }
  )

  //*------------------*//
  //POST REQUESTS API
  //*------------------*//

  // Create new gift card
  .post(
    "/create",
    adminSessionMiddleware,
    zValidator("json", CreateGiftCardSchema),
    async (c) => {
      const { code, amount, customerId } = c.req.valid("json");

      try {
        // Check if code already exists
        const existingGiftCard = await prisma.giftCard.findUnique({
          where: { code },
        });

        if (existingGiftCard) {
          return c.json({
            success: false,
            message: "Ce code existe déjà",
            data: null,
          });
        }
        
        const result = await prisma.giftCard.create({
          data: {
            code,
            amount,
            remainingAmount: amount,
            clientId: customerId,
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
          },
        });

        return c.json({
          success: true,
          message: `Carte cadeau ${result.code} créée avec succès`,
          data: result,
        });
      } catch (error) {
        return c.json({
          success: false,
          message: "Erreur lors de la création de la carte cadeau",
          data: null,
        });
      }
    }
  )

  // Validate gift card
  .post(
    "/validate",
    zValidator("json", ValidateGiftCardSchema),
    async (c) => {
      const { code } = c.req.valid("json");

      try {
        // Find gift card by code
        const giftCard = await prisma.giftCard.findUnique({
          where: { code },
        });

        // Check if gift card exists
        if (!giftCard) {
          return c.json({
            success: false,
            message: "Carte cadeau invalide",
          }, 404);
        }
        
        // Calculate remaining amount (use remainingAmount if set, otherwise use amount)
        const remainingAmount = giftCard.remainingAmount || giftCard.amount;
        
        // Check if gift card is already fully used
        if (giftCard.isUsed || remainingAmount <= 0) {
          return c.json({
            success: false,
            message: "Carte cadeau déjà utilisée",
          }, 400);
        }
        
        // Check expiration date (12 months from creation)
        const expirationDate = new Date(giftCard.createdAt);
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        
        if (new Date() > expirationDate) {
          return c.json({
            success: false,
            message: "Carte cadeau expirée",
          }, 400);
        }

        // Return gift card information
        return c.json({
          success: true,
          data: {
            giftCard: {
              code: giftCard.code,
              remainingAmount: remainingAmount,
              expirationDate: expirationDate.toISOString(),
              isValid: true,
            },
          },
        });
      } catch (error) {
        return c.json({
          success: false,
          message: "Erreur lors de la validation de la carte cadeau",
        }, 500);
      }
    }
  )

  // Add manual usage to gift card
  .post(
    "/addUsage/:id",
    adminSessionMiddleware,
    zValidator("json", z.object({
      orderId: z.string().min(1, { message: "L'ID de commande est requis" }),
      usedAmount: z.number().min(0.01, { message: "Le montant doit être supérieur à 0" }),
    })),
    async (c) => {
      const id = c.req.param("id");
      const { orderId, usedAmount } = c.req.valid("json");

      if (!id) {
        return c.json({
          success: false,
          message: "ID requis",
          data: null,
        });
      }

      try {
        // Check if gift card exists
        const giftCard = await prisma.giftCard.findUnique({
          where: { id },
        });

        if (!giftCard) {
          return c.json({
            success: false,
            message: "Carte cadeau introuvable",
            data: null,
          });
        }

        // Check if order exists
        const order = await prisma.order.findUnique({
          where: { id: orderId },
        });

        if (!order) {
          return c.json({
            success: false,
            message: "Commande introuvable",
            data: null,
          });
        }

        // Calculate remaining amount
        const currentRemaining = giftCard.remainingAmount || giftCard.amount;

        // Check if there's enough balance
        if (usedAmount > currentRemaining) {
          return c.json({
            success: false,
            message: `Solde insuffisant. Montant disponible: ${currentRemaining.toFixed(2)}€`,
            data: null,
          });
        }

        // Check if this gift card is already applied to this order
        const existingUsage = await prisma.orderGiftCard.findUnique({
          where: {
            orderId_giftCardId: {
              orderId,
              giftCardId: id,
            },
          },
        });

        if (existingUsage) {
          return c.json({
            success: false,
            message: "Cette carte cadeau est déjà appliquée à cette commande",
            data: null,
          });
        }

        // Create the usage record and update gift card in a transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create OrderGiftCard record
          const orderGiftCard = await tx.orderGiftCard.create({
            data: {
              orderId,
              giftCardId: id,
              usedAmount,
            },
          });

          // Update gift card remaining amount
          const newRemainingAmount = currentRemaining - usedAmount;
          const updatedGiftCard = await tx.giftCard.update({
            where: { id },
            data: {
              remainingAmount: newRemainingAmount,
              isUsed: newRemainingAmount <= 0,
              usedAt: giftCard.usedAt || new Date(), // Set usedAt on first usage
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
              appliedToOrders: {
                include: {
                  order: {
                    select: {
                      id: true,
                      orderNumber: true,
                      createdAt: true,
                      status: true,
                    },
                  },
                },
              },
            },
          });

          return { orderGiftCard, updatedGiftCard };
        });

        return c.json({
          success: true,
          message: `Utilisation de ${usedAmount.toFixed(2)}€ ajoutée avec succès. Solde restant: ${result.updatedGiftCard.remainingAmount.toFixed(2)}€`,
          data: result.updatedGiftCard,
        });
      } catch (error) {
        console.error("Error adding gift card usage:", error);
        return c.json({
          success: false,
          message: "Erreur lors de l'ajout de l'utilisation",
          data: null,
        });
      }
    }
  )

  //*------------------*//
  //PUT REQUESTS API
  //*------------------*//

  // Update gift card (only unused cards can be updated)
  .put(
    "/update/:id",
    adminSessionMiddleware,
    zValidator("json", UpdateGiftCardSchema),
    async (c) => {
      const id = c.req.param("id");
      const updateData = c.req.valid("json");

      if (!id) {
        return c.json({
          success: false,
          message: "ID requis",
          data: null,
        });
      }

      try {
        // Check if gift card exists and is not used
        const existingGiftCard = await prisma.giftCard.findUnique({
          where: { id },
        });

        if (!existingGiftCard) {
          return c.json({
            success: false,
            message: "Carte cadeau introuvable",
            data: null,
          });
        }

        if (existingGiftCard.isUsed) {
          return c.json({
            success: false,
            message: "Impossible de modifier une carte cadeau déjà utilisée",
            data: null,
          });
        }

        const result = await prisma.giftCard.update({
          where: { id },
          data: updateData,
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        return c.json({
          success: true,
          message: "Carte cadeau mise à jour avec succès",
          data: result,
        });
      } catch (error) {
        return c.json({
          success: false,
          message: "Erreur lors de la mise à jour de la carte cadeau",
          data: null,
        });
      }
    }
  )

  // Use gift card
  .put(
    "/use/:id",
    sessionMiddleware,
    zValidator("json", UseGiftCardSchema),
    async (c) => {
      const id = c.req.param("id");
      const { usedBy } = c.req.valid("json");

      if (!id) {
        return c.json({
          success: false,
          message: "ID requis",
          data: null,
        });
      }

      try {
        // Check if gift card exists and is not already used
        const giftCard = await prisma.giftCard.findUnique({
          where: { id },
        });

        if (!giftCard) {
          return c.json({
            success: false,
            message: "Carte cadeau introuvable",
            data: null,
          });
        }

        if (giftCard.isUsed) {
          return c.json({
            success: false,
            message: "Cette carte cadeau a déjà été utilisée",
            data: null,
          });
        }

        const result = await prisma.giftCard.update({
          where: { id },
          data: {
            isUsed: true,
            usedByOrderId: usedBy,
            usedAt: new Date(),
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
          },
        });

        return c.json({
          success: true,
          message: "Carte cadeau utilisée avec succès",
          data: result,
        });
      } catch (error) {
        return c.json({
          success: false,
          message: "Erreur lors de l'utilisation de la carte cadeau",
          data: null,
        });
      }
    }
  )

  //*------------------*//
  //DELETE REQUESTS API
  //*------------------*//

  // Delete gift card (only unused cards can be deleted)
  .delete(
    "/delete/:id",
    adminSessionMiddleware,
    async (c) => {
      const id = c.req.param("id");

      if (!id) {
        return c.json({
          success: false,
          message: "ID requis",
          data: null,
        });
      }

      try {
        // Check if gift card exists and is not used
        const existingGiftCard = await prisma.giftCard.findUnique({
          where: { id },
        });

        if (!existingGiftCard) {
          return c.json({
            success: false,
            message: "Carte cadeau introuvable",
            data: null,
          });
        }

        if (existingGiftCard.isUsed) {
          return c.json({
            success: false,
            message: "Impossible de supprimer une carte cadeau déjà utilisée",
            data: null,
          });
        }

        await prisma.giftCard.delete({
          where: { id },
        });

        return c.json({
          success: true,
          message: "Carte cadeau supprimée avec succès",
          data: null,
        });
      } catch (error) {
        return c.json({
          success: false,
          message: "Erreur lors de la suppression de la carte cadeau",
          data: null,
        });
      }
    }
  );

export default app;