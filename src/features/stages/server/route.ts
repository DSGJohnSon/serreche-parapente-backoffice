import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { adminSessionMiddleware, publicAPIMiddleware, sessionMiddleware } from "@/lib/session-middleware";
import prisma from "@/lib/prisma";
import { CreateStageSchema, DeleteStageSchema, UpdateStageSchema } from "../schemas";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const app = new Hono()
  // Get all stages with optional filtering by moniteurId or date
  .get("getAll", publicAPIMiddleware, async (c) => {
    const moniteurId = c.req.query("moniteurId");
    const date = c.req.query("date");
    const where: any = {};
    if (moniteurId) where.moniteurId = moniteurId;
    if (date) where.startDate = new Date(date);

    try {
      const result = await prisma.stage.findMany({
        where,
        include: {
          bookings: true,
          moniteurs: {
            include: {
              moniteur: true,
            },
          },
        },
      });
      return c.json({ success: true, message: "", data: result });
    } catch (error) {
      return c.json({ success: false, message: "Erreur lors de la récupération des stages", data: null });
    }
  })
  // Get stage by id
  .get(
    "getById/:id",
    sessionMiddleware,
    async (c) => {
      try {
        const id = c.req.param("id");
        if (!id) {
          return c.json({
            success: false,
            message: "ID is required",
            data: null,
          });
        }
        const result = await prisma.stage.findUnique({
          where: { id },
          include: {
            bookings: {
              include: {
                customer: true
              },
            },
            moniteurs: {
              include: {
                moniteur: true,
              },
            },
          },
        });
        return c.json({ success: true, message: "", data: result });
      } catch (error) {
        return c.json({
          success: false,
          message: "Error fetching stage",
          data: null,
        });
      }
    }
  )
  // CREATE stage
  .post(
    "create",
    zValidator("json", CreateStageSchema),
    adminSessionMiddleware,
    async (c) => {
      try {
        const { startDate, duration, places, moniteurIds, price, acomptePrice, type } = c.req.valid("json");
        const startDateObj = new Date(startDate);

        const result = await prisma.stage.create({
          data: {
            startDate: startDateObj,
            duration,
            places,
            price,
            allTimeHighPrice: price,
            acomptePrice,
            type,
            moniteurs: {
              create: moniteurIds.map((moniteurId) => ({
                moniteurId,
              })),
            },
          },
        });
        return c.json({
          success: true,
          message: `Stage ${type} du ${result.startDate.toLocaleDateString()} créé.`,
          data: result,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const zodErrors = error.errors.map((e) => e.message);
          return c.json({
            success: false,
            message: zodErrors.length > 0 ? zodErrors[0] : "Erreur dans la validation des données",
            data: null,
          });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          switch (error.code) {
            case "P2002":
              return c.json({
                success: false,
                message: "Un stage avec ces valeurs existe déjà.",
                data: null,
              });
            case "P2003":
              return c.json({
                success: false,
                message: "Moniteur introuvable.",
                data: null,
              });
            default:
              return c.json({
                success: false,
                message: `Erreur Prisma: ${error.message}`,
                data: null,
              });
          }
        }
        return c.json({
          success: false,
          message: "Une erreur inattendue s'est produite.",
          data: null,
        });
      }
    }
  )
  // UPDATE stage
  .post(
    "update",
    zValidator("json", UpdateStageSchema),
    adminSessionMiddleware,
    async (c) => {
      try {
        const { id, startDate, duration, places, moniteurIds, price, acomptePrice, type } = c.req.valid("json");
        const startDateObj = new Date(startDate);

        const previousData = await prisma.stage.findUnique({
          where: { id },
          include: { bookings: true },
        });

        if (!previousData) {
          return c.json({
            success: false,
            message: "Aucun stage trouvé avec cet ID.",
            data: null,
          });
        }
        if (previousData.bookings.length > places) {
          return c.json({
            success: false,
            message: "Impossible de réduire le nombre de places, elles sont toutes occupées.",
            data: null,
          });
        }

        const updatedAllTimeHighPrice =Math.max(previousData.allTimeHighPrice, price)
        

        const result = await prisma.stage.update({
          where: { id },
          data: {
            startDate: startDateObj,
            duration,
            places,
            price,
            allTimeHighPrice: updatedAllTimeHighPrice,
            acomptePrice,
            type,
            moniteurs: {
              deleteMany: {},
              create: moniteurIds.map((moniteurId) => ({
                moniteurId,
              })),
            },
          },
        });
        return c.json({
          success: true,
          message: `Stage ${result.type} du ${result.startDate.toLocaleDateString()} mis à jour.`,
          data: result,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const zodErrors = error.errors.map((e) => e.message);
          return c.json({
            success: false,
            message: zodErrors.length > 0 ? zodErrors[0] : "Erreur dans la validation des données",
            data: null,
          });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          switch (error.code) {}
        }
        return c.json({
          success: false,
          message: "Une erreur inattendue s'est produite.",
          data: null,
        });
      }
    }
  )
  // DELETE stage
  .post(
    "delete",
    zValidator("json", DeleteStageSchema),
    adminSessionMiddleware,
    async (c) => {
      try {
        const { id } = c.req.valid("json");

        const stageToDelete = await prisma.stage.findUnique({
          where: { id },
          include: { bookings: true },
        });
        if (!stageToDelete) {
          return c.json({
            success: false,
            message: "Aucun stage trouvé avec cet ID.",
            data: null,
          });
        }
        if (stageToDelete.bookings.length > 0) {
          return c.json({
            success: false,
            message: "Ce stage ne peut pas être supprimé car il contient des réservations.",
            data: null,
          });
        }

        const result = await prisma.stage.delete({
          where: { id },
        });
        return c.json({
          success: true,
          message: `Stage ${result.type} du ${result.startDate.toLocaleDateString()} supprimé.`,
          data: result,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const zodErrors = error.errors.map((e) => e.message);
          return c.json({
            success: false,
            message: zodErrors.length > 0 ? zodErrors[0] : "Erreur dans la validation des données",
            data: null,
          });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          switch (error.code) {}
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
