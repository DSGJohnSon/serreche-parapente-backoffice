import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { adminSessionMiddleware, sessionMiddleware } from "@/lib/session-middleware";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UpdateTarifSchema, UpdateVideoOptionPriceSchema, UpdateStageBasePriceSchema } from "../schemas";
import { BaptemeCategory, StageType } from "@prisma/client";

const app = new Hono()
  // GET all tarifs (accessible to authenticated users)
  .get("getAll", async (c) => {
    try {
      const tarifs = await prisma.baptemeCategoryPrice.findMany({
        orderBy: {
          category: "asc",
        },
      });
      return c.json({ success: true, message: "", data: tarifs });
    } catch (error) {
      return c.json({
        success: false,
        message: "Erreur lors de la récupération des tarifs",
        data: null,
      });
    }
  })
  // GET tarif by category (accessible to authenticated users)
  .get("getByCategory/:category", async (c) => {
    try {
      const category = c.req.param("category") as BaptemeCategory;
      
      if (!Object.values(BaptemeCategory).includes(category)) {
        return c.json({
          success: false,
          message: "Catégorie invalide",
          data: null,
        });
      }

      const tarif = await prisma.baptemeCategoryPrice.findUnique({
        where: {
          category,
        },
      });

      if (!tarif) {
        return c.json({
          success: false,
          message: "Tarif non trouvé pour cette catégorie",
          data: null,
        });
      }

      return c.json({ success: true, message: "", data: tarif });
    } catch (error) {
      return c.json({
        success: false,
        message: "Erreur lors de la récupération du tarif",
        data: null,
      });
    }
  })
  // UPDATE tarif (admin only)
  .post(
    "update",
    zValidator("json", UpdateTarifSchema),
    adminSessionMiddleware,
    async (c) => {
      try {
        const { category, price } = c.req.valid("json");

        const tarif = await prisma.baptemeCategoryPrice.upsert({
          where: {
            category,
          },
          update: {
            price,
          },
          create: {
            category,
            price,
          },
        });

        return c.json({
          success: true,
          message: `Tarif pour ${category} mis à jour avec succès`,
          data: tarif,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const zodErrors = error.errors.map((e) => e.message);
          return c.json({
            success: false,
            message:
              zodErrors.length > 0
                ? zodErrors[0]
                : "Erreur dans la validation des données",
            data: null,
          });
        }
        return c.json({
          success: false,
          message: "Une erreur inattendue s'est produite.",
          data: null,
        });
      }
    }
  )
  // GET video option price (accessible to authenticated users)
  .get("getVideoOptionPrice", async (c) => {
    try {
      const videoPrice = await prisma.videoOptionPrice.findFirst({
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!videoPrice) {
        return c.json({
          success: false,
          message: "Prix de l'option vidéo non trouvé",
          data: null,
        });
      }

      return c.json({ success: true, message: "", data: videoPrice });
    } catch (error) {
      return c.json({
        success: false,
        message: "Erreur lors de la récupération du prix de l'option vidéo",
        data: null,
      });
    }
  })
  // UPDATE video option price (admin only)
  .post(
    "updateVideoOptionPrice",
    zValidator("json", UpdateVideoOptionPriceSchema),
    adminSessionMiddleware,
    async (c) => {
      try {
        const { price } = c.req.valid("json");

        // Get the existing video price or create a new one
        const existingPrice = await prisma.videoOptionPrice.findFirst();

        const videoPrice = existingPrice
          ? await prisma.videoOptionPrice.update({
              where: { id: existingPrice.id },
              data: { price },
            })
          : await prisma.videoOptionPrice.create({
              data: { price },
            });

        return c.json({
          success: true,
          message: "Prix de l'option vidéo mis à jour avec succès",
          data: videoPrice,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const zodErrors = error.errors.map((e) => e.message);
          return c.json({
            success: false,
            message:
              zodErrors.length > 0
                ? zodErrors[0]
                : "Erreur dans la validation des données",
            data: null,
          });
        }
        return c.json({
          success: false,
          message: "Une erreur inattendue s'est produite.",
          data: null,
        });
      }
    }
  )
  // GET all stage base prices (accessible to authenticated users)
  .get("getStageBasePrices", async (c) => {
    try {
      const stagePrices = await prisma.stageBasePrice.findMany({
        orderBy: {
          stageType: "asc",
        },
      });
      return c.json({ success: true, message: "", data: stagePrices });
    } catch (error) {
      return c.json({
        success: false,
        message: "Erreur lors de la récupération des prix de base des stages",
        data: null,
      });
    }
  })
  // GET stage base price by type (accessible to authenticated users)
  .get("getStageBasePriceByType/:stageType", async (c) => {
    try {
      const stageType = c.req.param("stageType") as StageType;
      
      if (!Object.values(StageType).includes(stageType)) {
        return c.json({
          success: false,
          message: "Type de stage invalide",
          data: null,
        });
      }

      const stagePrice = await prisma.stageBasePrice.findUnique({
        where: {
          stageType,
        },
      });

      if (!stagePrice) {
        return c.json({
          success: false,
          message: "Prix de base non trouvé pour ce type de stage",
          data: null,
        });
      }

      return c.json({ success: true, message: "", data: stagePrice });
    } catch (error) {
      return c.json({
        success: false,
        message: "Erreur lors de la récupération du prix de base du stage",
        data: null,
      });
    }
  })
  // UPDATE stage base price (admin only)
  .post(
    "updateStageBasePrice",
    zValidator("json", UpdateStageBasePriceSchema),
    adminSessionMiddleware,
    async (c) => {
      try {
        const { stageType, price } = c.req.valid("json");

        const stagePrice = await prisma.stageBasePrice.upsert({
          where: {
            stageType,
          },
          update: {
            price,
          },
          create: {
            stageType,
            price,
          },
        });

        return c.json({
          success: true,
          message: `Prix de base pour ${stageType} mis à jour avec succès`,
          data: stagePrice,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const zodErrors = error.errors.map((e) => e.message);
          return c.json({
            success: false,
            message:
              zodErrors.length > 0
                ? zodErrors[0]
                : "Erreur dans la validation des données",
            data: null,
          });
        }
        return c.json({
          success: false,
          message: "Une erreur inattendue s'est produite.",
          data: null,
        });
      }
    }
  );

export default app;