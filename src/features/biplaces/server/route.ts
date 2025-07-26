import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { sessionMiddleware } from "@/lib/session-middleware";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  CreateBaptemeSchema,
  UpdateBaptemeSchema,
  DeleteBaptemeSchema,
} from "../schemas";

const app = new Hono()
  // GET all baptemes, optionally filtered by moniteurId or date
  .get("getAll", async (c) => {
    const moniteurId = c.req.query("moniteurId");
    const date = c.req.query("date");
    const where: any = {};
    if (moniteurId) where.moniteurId = moniteurId;
    if (date) where.date = new Date(date);

    try {
      const result = await prisma.bapteme.findMany({
        where,
        include: {
          bookings: true,
          moniteur: true,
        },
      });
      return c.json({ success: true, message: "", data: result });
    } catch (error) {
      return c.json({ success: false, message: "Erreur lors de la récupération des créneaux", data: null });
    }
  })
  // GET bapteme by id
  .get("getById/:id", async (c) => {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ success: false, message: "ID is required", data: null });
      }
      const result = await prisma.bapteme.findUnique({
        where: { id },
        include: {
          bookings: { include: { customer: true } },
          moniteur: true,
        },
      });
      return c.json({ success: true, message: "", data: result });
    } catch (error) {
      return c.json({ success: false, message: "Erreur lors de la récupération du créneau", data: null });
    }
  })
  // CREATE bapteme
  .post(
    "create",
    zValidator("json", CreateBaptemeSchema),
    sessionMiddleware,
    async (c) => {
      try {
        const { date, duration, places, moniteurId, price } = c.req.valid("json");
        const dateObj = new Date(date);

        const result = await prisma.bapteme.create({
          data: {
            date: dateObj,
            duration,
            places,
            moniteurId,
            price,
          },
        });
        return c.json({
          success: true,
          message: `Créneau du ${result.date.toISOString()} créé.`,
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
                message: "Un créneau avec cette date existe déjà.",
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
  // UPDATE bapteme
  .post(
    "update",
    zValidator("json", UpdateBaptemeSchema),
    sessionMiddleware,
    async (c) => {
      try {
        const { originalDate, date, duration, places, moniteurId, price } = c.req.valid("json");
        const originalDateObj = new Date(originalDate);
        const newDateObj = new Date(date);

        const previousData = await prisma.bapteme.findUnique({
          where: { date: originalDateObj },
          include: { bookings: true },
        });

        if (!previousData) {
          return c.json({
            success: false,
            message: "Aucun créneau trouvé pour cette date.",
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

        const result = await prisma.bapteme.update({
          where: { date: originalDateObj },
          data: { date: newDateObj, duration, places, moniteurId, price },
        });
        return c.json({
          success: true,
          message: `Créneau du ${result.date.toISOString()} mis à jour.`,
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
  // DELETE bapteme
  .post(
    "delete",
    zValidator("json", DeleteBaptemeSchema),
    sessionMiddleware,
    async (c) => {
      try {
        const { date } = c.req.valid("json");
        const dateObj = new Date(date);

        const baptemeToDelete = await prisma.bapteme.findUnique({
          where: { date: dateObj },
          include: { bookings: true },
        });
        if (!baptemeToDelete) {
          return c.json({
            success: false,
            message: "Aucun créneau trouvé pour cette date.",
            data: null,
          });
        }
        if (baptemeToDelete.bookings.length > 0) {
          return c.json({
            success: false,
            message: "Ce créneau ne peut pas être supprimé car il contient des réservations.",
            data: null,
          });
        }

        const result = await prisma.bapteme.delete({
          where: { date: dateObj },
        });
        return c.json({
          success: true,
          message: `Créneau du ${result.date.toISOString()} supprimé.`,
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
