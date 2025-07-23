import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { sessionMiddleware } from "@/lib/session-middleware";
import prisma from "@/lib/prisma";
import { CreateStageSchema, DeleteStageSchema, UpdateStageSchema } from "../schemas";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const app = new Hono()
  // Get all stages database with optional year, month, and bookings inclusion
  // -----
  // INPUT: optional query parameters `year`, `month`, and `includeBookings`
  // OUTPUT: filtered weeks based on the parameters or all weeks if none provided
  // -----
  .get("getAll", async (c) => {
    const year = c.req.query("year");
    const month = c.req.query("month");
    const includeBookings = c.req.query("includeBookings") === "true";

    const where: any = {};
    if (year) {
      where.year = parseInt(year, 10);
    }
    if (month) {
      where.month = parseInt(month, 10);
    }
    try {
      const result = await prisma.stage.findMany({
        where,
        include: {
          bookings: true,
        },
      });

      return c.json({ success: true, message: "", data: result });
    } catch (error) {
      return c.json({ success: false, message: "Erreur lors de la récupération des semaines", data: null });
    }
  })
  .get(
    "getById/:id",
    // sessionMiddleware,
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
          },
        });
        return c.json({ success: true, message: "", data: result });
      } catch (error) {
        return c.json({
          success: false,
          message: "Error fetching customer",
          data: null,
        });
      }
    }
  )
  // Get all stages database with optional year, month, and bookings inclusion
  // -----
  // INPUT: optional query parameters `year`, `month`, and `includeBookings`
  // OUTPUT: filtered stages based on the parameters or all stages if none provided
  // -----
  .post(
    "create",
    zValidator("json", CreateStageSchema),
    sessionMiddleware,
    async (c) => {
      try {
        const { startDate, endDate, year, weekNumber, type } =
          c.req.valid("json");
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        const result = await prisma.stage.create({
          data: {
            startDate: startDateObj,
            endDate: endDateObj,
            year,
            weekNumber,
            type,
          },
        });
        return c.json({
          success: true,
          message: `Semaine ${result.weekNumber} de l'année ${result.year} paramétrée sur ${result.type}.`,
          data: result,
        });
      } catch (error) {
        //Erreur provenant de la validation des données
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
        // Erreur provenant de Prisma/Supabase
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // Gestion des erreurs spécifiques de Prisma/Supabase
          switch (error.code) {
            case "P2002":
              return c.json({
                success: false,
                message: "Une entrée avec ces valeurs existe déjà.",
                data: null,
              });
            case "P2003":
              return c.json({
                success: false,
                message: "Clé étrangère introuvable.",
                data: null,
              });
            case "P2025":
              return c.json({
                success: false,
                message: "Enregistrement introuvable.",
                data: null,
              });
            default:
              return c.json({
                success: false,
                message: `Erreur Prisma/Supabase: ${error.message}`,
                data: null,
              });
          }
        }
        // Erreur inattendue
        return c.json({
          success: false,
          message: "Une erreur inattendue s'est produite.",
          data: null,
        });
      }
    }
  )
  .post(
    "update",
    zValidator("json", UpdateStageSchema),
    sessionMiddleware,
    async (c) => {
      try {
        const { startDate, previousType, type, places } = c.req.valid("json");
        const startDateObj = new Date(startDate);

        const previousData = await prisma.stage.findUnique({
          where: {
            startDate: startDateObj,
          },
          include: {
            bookings: true,
          },
        });

        if (!previousData) {
          return c.json({
            success: false,
            message:
              "Aucune semaine n'est enregistrée en base de données pour ces dates. Contactez l'administrateur.",
            data: null,
          });
        }
        if (previousData.type !== previousType) {
          return c.json({
            success: false,
            message:
              "Une erreur est survenue, la base de donnée et le dashboard sont désynchronisés, contactez l'administrateur.",
            data: null,
          });
        }
        if (previousData.bookings.length !== 0) {
          return c.json({
            success: false,
            message:
              "Une réservation est déjà liée à cette semaine, vous ne pouvez pas changer le type de semaine.",
            data: null,
          });
        }
        if (previousData.bookings.length > places) {
          return c.json({
            success: false,
            message:
              "Vous ne pouvez pas réduire le nombre de places car elles sont toutes occupées par des réservations sur cette semaine.",
            data: null,
          });
        }

        const result = await prisma.stage.update({
          where: {
            startDate: startDateObj,
          },
          data: {
            type: type,
            places: places,
          },
        });
        return c.json({
          success: true,
          message: `Semaine ${result.weekNumber} de l'année ${result.year} paramétrée sur ${result.type}.`,
          data: result,
        });
      } catch (error) {
        //Erreur provenant de la validation des données
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
        // Erreur provenant de Prisma/Supabase
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // Gestion des erreurs spécifiques de Prisma/Supabase
          switch (error.code) {
          }
        }
        // Erreur inattendue
        return c.json({
          success: false,
          message: "Une erreur inattendue s'est produite.",
          data: null,
        });
      }
    }
  )
  .post(
    "delete",
    zValidator("json", DeleteStageSchema),
    sessionMiddleware,
    async (c) => {
      try {
        const { startDate } = c.req.valid("json");

        const stageToDelete = await prisma.stage.findUnique({
          where: {
            startDate: new Date(startDate),
          },
          include: {
            bookings: true,
          },
        });
        if (!stageToDelete) {
          return c.json({
            success: false,
            message: "Aucune semaine trouvée avec cet ID.",
            data: null,
          });
        }
        if (stageToDelete.bookings.length > 0) {
          return c.json({
            success: false,
            message:
              "Cette semaine ne peut pas être supprimée car elle contient des réservations.",
            data: null,
          });
        }

        const result = await prisma.stage.delete({
          where: {
            startDate: stageToDelete.startDate,
          },
        });
        return c.json({
          success: true,
          message: `Semaine ${result.weekNumber} de l'année ${result.year} supprimée.`,
          data: result,
        });
      } catch (error) {
        //Erreur provenant de la validation des données
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
        // Erreur provenant de Prisma/Supabase
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // Gestion des erreurs spécifiques de Prisma/Supabase
          switch (error.code) {
          }
        }
        // Erreur inattendue
        return c.json({
          success: false,
          message: "Une erreur inattendue s'est produite.",
          data: null,
        });
      }
    }
  );

export default app;
