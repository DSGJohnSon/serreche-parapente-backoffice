import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cartSessionMiddleware, cartOrAuthMiddleware } from "@/lib/cart-middleware";
import { publicAPIMiddleware } from "@/lib/session-middleware";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { AvailabilityService } from "@/lib/availability";

// Schémas de validation
const AddToCartSchema = z.object({
  type: z.enum(['STAGE', 'BAPTEME', 'GIFT_CARD']),
  itemId: z.string().optional(),
  giftCardAmount: z.number().optional(),
  participantData: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    weight: z.number(),
    height: z.number(),
    birthDate: z.string().optional(),
    // Pour baptêmes
    selectedCategory: z.string().optional(),
    hasVideo: z.boolean().optional(),
    // Pour bons cadeaux
    recipientName: z.string().optional(),
    recipientEmail: z.string().optional(),
    personalMessage: z.string().optional(),
    deliveryDate: z.string().optional(),
  }),
  quantity: z.number().default(1),
});

const UpdateCartItemSchema = z.object({
  quantity: z.number().optional(),
  participantData: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    weight: z.number(),
    height: z.number(),
    birthDate: z.string().optional(),
    selectedCategory: z.string().optional(),
    hasVideo: z.boolean().optional(),
  }).optional(),
});

const app = new Hono()
  // GET cart items
  .get("items", publicAPIMiddleware, cartSessionMiddleware, async (c) => {
    try {
      const cartSession = c.get("cartSession");
      
      const cartItems = await prisma.cartItem.findMany({
        where: {
          cartSessionId: cartSession.id,
        },
        include: {
          stage: true,
          bapteme: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calculer le total
      let totalAmount = 0;
      for (const item of cartItems) {
        if (item.type === 'STAGE' && item.stage) {
          totalAmount += item.stage.price * item.quantity;
        } else if (item.type === 'BAPTEME' && item.bapteme) {
          // Calculer le prix selon la catégorie
          const participantData = item.participantData as any;
          if (participantData.selectedCategory) {
            const basePrice = await getBaptemePrice(participantData.selectedCategory);
            const videoPrice = participantData.hasVideo ? 25 : 0;
            totalAmount += (basePrice + videoPrice) * item.quantity;
          } else {
            // Prix par défaut si pas de catégorie
            totalAmount += 110 * item.quantity;
          }
        } else if (item.type === 'GIFT_CARD') {
          totalAmount += item.giftCardAmount || 0;
        }
      }

      return c.json({
        success: true,
        data: {
          items: cartItems,
          totalAmount,
          itemCount: cartItems.length,
        },
      });
    } catch (error) {
      console.error('Erreur récupération panier:', error);
      return c.json({
        success: false,
        message: "Erreur lors de la récupération du panier",
        data: null,
      });
    }
  })

  // ADD item to cart
  .post(
    "add",
    publicAPIMiddleware,
    zValidator("json", AddToCartSchema),
    cartSessionMiddleware,
    async (c) => {
      try {
        const { type, itemId, giftCardAmount, participantData, quantity } = c.req.valid("json");
        const cartSession = c.get("cartSession");

        // Validation selon le type
        if (type === 'GIFT_CARD') {
          if (!giftCardAmount || giftCardAmount < 50) {
            return c.json({
              success: false,
              message: "Montant minimum pour un bon cadeau : 50€",
              data: null,
            });
          }
        } else {
          if (!itemId) {
            return c.json({
              success: false,
              message: "ID de l'activité requis",
              data: null,
            });
          }

          // Vérifier les disponibilités
          const availability = await AvailabilityService.checkAvailability(type.toLowerCase() as 'stage' | 'bapteme', itemId, quantity);
          
          if (!availability.available) {
            return c.json({
              success: false,
              message: availability.reason || "Places non disponibles",
              data: null,
            });
          }

          // Créer une réservation temporaire
          await AvailabilityService.createTemporaryReservation(
            cartSession.sessionId,
            type.toLowerCase() as 'stage' | 'bapteme',
            itemId,
            quantity
          );
        }

        // Créer l'item dans le panier
        const cartItem = await prisma.cartItem.create({
          data: {
            type,
            quantity,
            stageId: type === 'STAGE' ? itemId : null,
            baptemeId: type === 'BAPTEME' ? itemId : null,
            giftCardAmount: type === 'GIFT_CARD' ? giftCardAmount : null,
            participantData,
            cartSessionId: cartSession.id,
          },
          include: {
            stage: true,
            bapteme: true,
          },
        });

        return c.json({
          success: true,
          message: "Article ajouté au panier",
          data: cartItem,
        });

      } catch (error) {
        console.error('Erreur ajout panier:', error);
        return c.json({
          success: false,
          message: error instanceof Error ? error.message : "Erreur lors de l'ajout au panier",
          data: null,
        });
      }
    }
  )

  // UPDATE cart item
  .put(
    "update/:id",
    publicAPIMiddleware,
    zValidator("json", UpdateCartItemSchema),
    cartSessionMiddleware,
    async (c) => {
      try {
        const itemId = c.req.param("id");
        const updateData = c.req.valid("json");
        const cartSession = c.get("cartSession");

        // Vérifier que l'item appartient à cette session
        const existingItem = await prisma.cartItem.findFirst({
          where: {
            id: itemId,
            cartSessionId: cartSession.id,
          },
        });

        if (!existingItem) {
          return c.json({
            success: false,
            message: "Article introuvable dans votre panier",
            data: null,
          });
        }

        // Mettre à jour l'item
        const updatedItem = await prisma.cartItem.update({
          where: { id: itemId },
          data: updateData,
          include: {
            stage: true,
            bapteme: true,
          },
        });

        return c.json({
          success: true,
          message: "Article mis à jour",
          data: updatedItem,
        });

      } catch (error) {
        console.error('Erreur mise à jour panier:', error);
        return c.json({
          success: false,
          message: "Erreur lors de la mise à jour",
          data: null,
        });
      }
    }
  )

  // REMOVE item from cart
  .delete(
    "remove/:id",
    publicAPIMiddleware,
    cartSessionMiddleware,
    async (c) => {
      try {
        const itemId = c.req.param("id");
        const cartSession = c.get("cartSession");

        // Vérifier que l'item appartient à cette session
        const existingItem = await prisma.cartItem.findFirst({
          where: {
            id: itemId,
            cartSessionId: cartSession.id,
          },
        });

        if (!existingItem) {
          return c.json({
            success: false,
            message: "Article introuvable dans votre panier",
            data: null,
          });
        }

        // Libérer la réservation temporaire si applicable
        if (existingItem.type !== 'GIFT_CARD' && existingItem.stageId) {
          await AvailabilityService.releaseTemporaryReservation(
            cartSession.sessionId,
            'stage',
            existingItem.stageId
          );
        } else if (existingItem.type !== 'GIFT_CARD' && existingItem.baptemeId) {
          await AvailabilityService.releaseTemporaryReservation(
            cartSession.sessionId,
            'bapteme',
            existingItem.baptemeId
          );
        }

        // Supprimer l'item
        await prisma.cartItem.delete({
          where: { id: itemId },
        });

        return c.json({
          success: true,
          message: "Article supprimé du panier",
          data: null,
        });

      } catch (error) {
        console.error('Erreur suppression panier:', error);
        return c.json({
          success: false,
          message: "Erreur lors de la suppression",
          data: null,
        });
      }
    }
  )

  // CLEAR cart
  .delete(
    "clear",
    publicAPIMiddleware,
    cartSessionMiddleware,
    async (c) => {
      try {
        const cartSession = c.get("cartSession");

        // Libérer toutes les réservations temporaires
        await AvailabilityService.releaseTemporaryReservation(cartSession.sessionId);

        // Supprimer tous les items
        await prisma.cartItem.deleteMany({
          where: {
            cartSessionId: cartSession.id,
          },
        });

        return c.json({
          success: true,
          message: "Panier vidé",
          data: null,
        });

      } catch (error) {
        console.error('Erreur vidage panier:', error);
        return c.json({
          success: false,
          message: "Erreur lors du vidage du panier",
          data: null,
        });
      }
    }
  );

// Fonction utilitaire pour obtenir le prix d'un baptême selon la catégorie
async function getBaptemePrice(category: string): Promise<number> {
  // Prix par défaut si catégorie vide ou invalide
  const defaultPrices = {
    AVENTURE: 110,
    DUREE: 150,
    LONGUE_DUREE: 185,
    ENFANT: 90,
    HIVER: 130,
  };
  
  if (!category || category === '') {
    return 110; // Prix par défaut
  }
  
  try {
    const categoryPrice = await prisma.baptemeCategoryPrice.findUnique({
      where: { category: category as any },
    });
    
    return categoryPrice?.price || defaultPrices[category as keyof typeof defaultPrices] || 110;
  } catch (error) {
    console.error('Erreur récupération prix catégorie:', error);
    return defaultPrices[category as keyof typeof defaultPrices] || 110;
  }
}

export default app;