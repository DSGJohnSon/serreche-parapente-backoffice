import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { adminSessionMiddleware, sessionMiddleware } from "@/lib/session-middleware";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UpdateTarifSchema } from "../schemas";
import { BaptemeCategory } from "@prisma/client";

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
  );

export default app;