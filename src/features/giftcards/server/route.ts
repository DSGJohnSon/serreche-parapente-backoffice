import { Hono } from "hono";
import { sessionMiddleware } from "@/lib/session-middleware";
import prisma from "@/lib/prisma";
import { zValidator } from "@hono/zod-validator";
import { CreateGiftCardSchema, UpdateGiftCardSchema, UseGiftCardSchema } from "../schemas";

const app = new Hono()
  //*------------------*//
  //ALL GET REQUESTS API
  //*------------------*//
  
  // Get all gift cards
  .get(
    "getAll",
    // sessionMiddleware,
    async (c) => {
      try {
        const result = await prisma.giftCard.findMany({
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            usedByCustomer: {
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
          message: "Erreur lors de la récupération des bons cadeaux",
          data: null,
        });
      }
    }
  )

  // Get gift card by ID
  .get(
    "getById/:id",
    // sessionMiddleware,
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
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            usedByCustomer: {
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
          message: "Erreur lors de la récupération du bon cadeau",
          data: null,
        });
      }
    }
  )

  // Get unused gift cards
  .get(
    "getUnused",
    // sessionMiddleware,
    async (c) => {
      try {
        const result = await prisma.giftCard.findMany({
          where: {
            isUsed: false,
          },
          include: {
            customer: {
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
          message: "Erreur lors de la récupération des bons cadeaux non utilisés",
          data: null,
        });
      }
    }
  )

  // Get used gift cards
  .get(
    "getUsed",
    // sessionMiddleware,
    async (c) => {
      try {
        const result = await prisma.giftCard.findMany({
          where: {
            isUsed: true,
          },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            usedByCustomer: {
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
          message: "Erreur lors de la récupération des bons cadeaux utilisés",
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
    // adminSessionMiddleware,
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
            customerId,
          },
          include: {
            customer: {
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
          message: `Bon cadeau ${result.code} créé avec succès`,
          data: result,
        });
      } catch (error) {
        return c.json({
          success: false,
          message: "Erreur lors de la création du bon cadeau",
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
    // adminSessionMiddleware,
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
            message: "Bon cadeau introuvable",
            data: null,
          });
        }

        if (existingGiftCard.isUsed) {
          return c.json({
            success: false,
            message: "Impossible de modifier un bon cadeau déjà utilisé",
            data: null,
          });
        }

        const result = await prisma.giftCard.update({
          where: { id },
          data: updateData,
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            usedByCustomer: {
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
          message: "Bon cadeau mis à jour avec succès",
          data: result,
        });
      } catch (error) {
        return c.json({
          success: false,
          message: "Erreur lors de la mise à jour du bon cadeau",
          data: null,
        });
      }
    }
  )

  // Use gift card
  .put(
    "/use/:id",
    // sessionMiddleware,
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
            message: "Bon cadeau introuvable",
            data: null,
          });
        }

        if (giftCard.isUsed) {
          return c.json({
            success: false,
            message: "Ce bon cadeau a déjà été utilisé",
            data: null,
          });
        }

        const result = await prisma.giftCard.update({
          where: { id },
          data: {
            isUsed: true,
            usedBy,
            usedAt: new Date(),
          },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            usedByCustomer: {
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
          message: "Bon cadeau utilisé avec succès",
          data: result,
        });
      } catch (error) {
        return c.json({
          success: false,
          message: "Erreur lors de l'utilisation du bon cadeau",
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
    // adminSessionMiddleware,
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
            message: "Bon cadeau introuvable",
            data: null,
          });
        }

        if (existingGiftCard.isUsed) {
          return c.json({
            success: false,
            message: "Impossible de supprimer un bon cadeau déjà utilisé",
            data: null,
          });
        }

        await prisma.giftCard.delete({
          where: { id },
        });

        return c.json({
          success: true,
          message: "Bon cadeau supprimé avec succès",
          data: null,
        });
      } catch (error) {
        return c.json({
          success: false,
          message: "Erreur lors de la suppression du bon cadeau",
          data: null,
        });
      }
    }
  );

export default app;