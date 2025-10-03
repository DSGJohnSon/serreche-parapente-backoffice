import { Hono } from "hono";
import { adminSessionMiddleware } from "@/lib/session-middleware";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const GetReservationsSchema = z.object({
  month: z.string().optional(),
  year: z.string().optional(),
});

const app = new Hono()
  // GET all reservations with filters
  .get(
    "/",
    adminSessionMiddleware,
    zValidator("query", GetReservationsSchema),
    async (c) => {
      try {
        const { month, year } = c.req.valid("query");
        
        // Définir les dates de début et fin pour le filtre
        const now = new Date();
        const currentYear = year ? parseInt(year) : now.getFullYear();
        const currentMonth = month ? parseInt(month) - 1 : now.getMonth(); // JavaScript months are 0-indexed
        
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

        // Récupérer les réservations de stages
        const stageBookings = await prisma.stageBooking.findMany({
          where: {
            stage: {
              startDate: {
                gte: startDate,
                lte: endDate,
              },
            },
            orderItem: {
              order: {
                status: {
                  in: ['PAID', 'CONFIRMED'],
                },
              },
            },
          },
          include: {
            customer: true,
            stage: {
              include: {
                moniteurs: {
                  include: {
                    moniteur: true,
                  },
                },
              },
            },
            orderItem: {
              include: {
                order: true,
              },
            },
          },
          orderBy: {
            stage: {
              startDate: 'asc',
            },
          },
        });

        // Récupérer les réservations de baptêmes
        const baptemeBookings = await prisma.baptemeBooking.findMany({
          where: {
            bapteme: {
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
            orderItem: {
              order: {
                status: {
                  in: ['PAID', 'CONFIRMED'],
                },
              },
            },
          },
          include: {
            customer: true,
            bapteme: {
              include: {
                moniteurs: {
                  include: {
                    moniteur: true,
                  },
                },
              },
            },
            orderItem: {
              include: {
                order: true,
              },
            },
          },
          orderBy: {
            bapteme: {
              date: 'asc',
            },
          },
        });

        // Calculer les statistiques vidéo pour les baptêmes
        const videoStats = {
          totalVideos: baptemeBookings.filter(booking => booking.hasVideo).length,
          videosByDate: baptemeBookings.reduce((acc, booking) => {
            if (booking.hasVideo) {
              const dateKey = booking.bapteme.date.toISOString().split('T')[0];
              acc[dateKey] = (acc[dateKey] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>),
        };

        return c.json({
          success: true,
          data: {
            stageBookings,
            baptemeBookings,
            videoStats,
            period: {
              month: currentMonth + 1,
              year: currentYear,
              startDate,
              endDate,
            },
          },
        });

      } catch (error) {
        console.error('Erreur récupération réservations:', error);
        return c.json({
          success: false,
          message: "Erreur lors de la récupération des réservations",
          data: null,
        });
      }
    }
  )

  // GET reservations for today
  .get(
    "/today",
    adminSessionMiddleware,
    async (c) => {
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        // Réservations de stages pour aujourd'hui
        const todayStageBookings = await prisma.stageBooking.findMany({
          where: {
            stage: {
              startDate: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
            orderItem: {
              order: {
                status: {
                  in: ['PAID', 'CONFIRMED'],
                },
              },
            },
          },
          include: {
            customer: true,
            stage: {
              include: {
                moniteurs: {
                  include: {
                    moniteur: true,
                  },
                },
              },
            },
            orderItem: {
              include: {
                order: true,
              },
            },
          },
        });

        // Réservations de baptêmes pour aujourd'hui
        const todayBaptemeBookings = await prisma.baptemeBooking.findMany({
          where: {
            bapteme: {
              date: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
            orderItem: {
              order: {
                status: {
                  in: ['PAID', 'CONFIRMED'],
                },
              },
            },
          },
          include: {
            customer: true,
            bapteme: {
              include: {
                moniteurs: {
                  include: {
                    moniteur: true,
                  },
                },
              },
            },
            orderItem: {
              include: {
                order: true,
              },
            },
          },
        });

        const todayVideoCount = todayBaptemeBookings.filter(booking => booking.hasVideo).length;

        return c.json({
          success: true,
          data: {
            stageBookings: todayStageBookings,
            baptemeBookings: todayBaptemeBookings,
            videoCount: todayVideoCount,
            date: today,
          },
        });

      } catch (error) {
        console.error('Erreur récupération réservations du jour:', error);
        return c.json({
          success: false,
          message: "Erreur lors de la récupération des réservations du jour",
          data: null,
        });
      }
    }
  );

export default app;