import { Hono } from "hono";
import { publicAPIMiddleware } from "@/lib/session-middleware";
import { AvailabilityService } from "@/lib/availability";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const CheckAvailabilitySchema = z.object({
  type: z.enum(['stage', 'bapteme']),
  itemId: z.string(),
  quantity: z.number().default(1),
});

const ReserveTemporarySchema = z.object({
  sessionId: z.string(),
  type: z.enum(['stage', 'bapteme']),
  itemId: z.string(),
  quantity: z.number().default(1),
});

const GetAvailableMonthsSchema = z.object({
  type: z.enum(['stage', 'bapteme']),
  year: z.number().optional(),
  category: z.string().optional(),
  stageType: z.enum(['INITIATION', 'PROGRESSION', 'AUTONOMIE']).optional(),
});

const GetAvailablePeriodsSchema = z.object({
  type: z.enum(['stage', 'bapteme']),
  category: z.string().optional(),
  stageType: z.enum(['INITIATION', 'PROGRESSION', 'AUTONOMIE']).optional(),
});

const app = new Hono()
  // Check availability
  .post(
    "check",
    publicAPIMiddleware,
    zValidator("json", CheckAvailabilitySchema),
    async (c) => {
      try {
        const { type, itemId, quantity } = c.req.valid("json");

        const availability = await AvailabilityService.checkAvailability(
          type,
          itemId,
          quantity
        );

        return c.json({
          success: true,
          data: availability,
        });

      } catch (error) {
        console.error('Erreur vérification disponibilités:', error);
        return c.json({
          success: false,
          message: 'Erreur lors de la vérification des disponibilités',
          data: null,
        });
      }
    }
  )

  // Get availability for specific stage
  .get("stages/:id", publicAPIMiddleware, async (c) => {
    try {
      const stageId = c.req.param("id");
      
      const availability = await AvailabilityService.checkAvailability('stage', stageId);

      return c.json({
        success: true,
        data: {
          stageId,
          ...availability,
        },
      });

    } catch (error) {
      console.error('Erreur disponibilités stage:', error);
      return c.json({
        success: false,
        message: 'Erreur lors de la vérification des disponibilités du stage',
        data: null,
      });
    }
  })

  // Get availability for specific bapteme
  .get("baptemes/:id", publicAPIMiddleware, async (c) => {
    try {
      const baptemeId = c.req.param("id");
      
      const availability = await AvailabilityService.checkAvailability('bapteme', baptemeId);

      return c.json({
        success: true,
        data: {
          baptemeId,
          ...availability,
        },
      });

    } catch (error) {
      console.error('Erreur disponibilités baptême:', error);
      return c.json({
        success: false,
        message: 'Erreur lors de la vérification des disponibilités du baptême',
        data: null,
      });
    }
  })

  // Create temporary reservation
  .post(
    "reserve",
    publicAPIMiddleware,
    zValidator("json", ReserveTemporarySchema),
    async (c) => {
      try {
        const { sessionId, type, itemId, quantity } = c.req.valid("json");

        const reservation = await AvailabilityService.createTemporaryReservation(
          sessionId,
          type,
          itemId,
          quantity
        );

        return c.json({
          success: true,
          data: reservation,
        });

      } catch (error) {
        console.error('Erreur réservation temporaire:', error);
        return c.json({
          success: false,
          message: error instanceof Error ? error.message : 'Erreur lors de la réservation',
          data: null,
        });
      }
    }
  )

  // Release temporary reservation
  .delete(
    "release",
    publicAPIMiddleware,
    async (c) => {
      try {
        const sessionId = c.req.header("x-session-id");
        const type = c.req.query("type") as 'stage' | 'bapteme' | undefined;
        const itemId = c.req.query("itemId");

        if (!sessionId) {
          return c.json({
            success: false,
            message: "Session ID requis",
            data: null,
          });
        }

        await AvailabilityService.releaseTemporaryReservation(sessionId, type, itemId);

        return c.json({
          success: true,
          message: "Réservation temporaire libérée",
          data: null,
        });

      } catch (error) {
        console.error('Erreur libération réservation:', error);
        return c.json({
          success: false,
          message: 'Erreur lors de la libération de la réservation',
          data: null,
        });
      }
    }
  )

  // Get available months for a given year
  .post(
    "months",
    publicAPIMiddleware,
    zValidator("json", z.object({
      type: z.enum(['stage', 'bapteme']),
      year: z.number(),
      category: z.string().optional(),
      stageType: z.enum(['INITIATION', 'PROGRESSION', 'AUTONOMIE']).optional(),
    })),
    async (c) => {
      try {
        const { type, year, category, stageType } = c.req.valid("json");

        const availableMonths = await AvailabilityService.getAvailableMonths(
          type,
          year,
          category,
          stageType
        );

        return c.json({
          success: true,
          data: {
            availableMonths,
            year,
            type,
            category,
            stageType,
          },
        });

      } catch (error) {
        console.error('Erreur récupération mois disponibles:', error);
        return c.json({
          success: false,
          message: 'Erreur lors de la récupération des mois disponibles',
          data: null,
        });
      }
    }
  )

  // Get available periods with counts
  .post(
    "periods",
    publicAPIMiddleware,
    zValidator("json", GetAvailablePeriodsSchema),
    async (c) => {
      try {
        const { type, category, stageType } = c.req.valid("json");

        const periods = await AvailabilityService.getAvailablePeriodsWithCounts(
          type,
          category,
          stageType
        );

        return c.json({
          success: true,
          data: periods,
        });

      } catch (error) {
        console.error('Erreur récupération périodes disponibles:', error);
        return c.json({
          success: false,
          message: 'Erreur lors de la récupération des périodes disponibles',
          data: null,
        });
      }
    }
  );

export default app;