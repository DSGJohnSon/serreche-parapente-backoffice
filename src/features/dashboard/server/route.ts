import { Hono } from "hono";
import { adminSessionMiddleware } from "@/lib/session-middleware";
import prisma from "@/lib/prisma";

const app = new Hono()
  // GET dashboard statistics
  .get("/stats", adminSessionMiddleware, async (c) => {
    try {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      );
      const currentYearStart = new Date(now.getFullYear(), 0, 1);

      // Calculate the start date for 13 months ago
      const thirteenMonthsAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 12,
        1
      );

      // Fetch revenue data for current month (online vs total)
      const [
        onlineRevenueThisMonth,
        manualRevenueThisMonth,
        totalRevenueThisYear,
      ] = await Promise.all([
        // Online revenue (Stripe payments only) for current month
        prisma.payment.aggregate({
          where: {
            status: "SUCCEEDED",
            isManual: false,
            createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
          },
          _sum: { amount: true },
        }),

        // Manual revenue (manual payments only) for current month
        prisma.payment.aggregate({
          where: {
            status: "SUCCEEDED",
            isManual: true,
            createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
          },
          _sum: { amount: true },
        }),

        // Total revenue for current year
        prisma.payment.aggregate({
          where: {
            status: "SUCCEEDED",
            createdAt: { gte: currentYearStart },
          },
          _sum: { amount: true },
        }),
      ]);

      // Fetch monthly revenue data for the last 13 months using a single grouped query
      const monthlyRevenueRaw = await prisma.$queryRaw<
        Array<{ month: Date; total: number }>
      >`
          SELECT 
            DATE_TRUNC('month', "createdAt") as month,
            COALESCE(SUM(amount), 0) as total
          FROM "Payment"
          WHERE status = 'SUCCEEDED'
            AND "createdAt" >= ${thirteenMonthsAgo}
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY month ASC
        `;

      // Format the monthly revenue data
      const last13MonthsRevenue = [];
      for (let i = 12; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${monthDate.getFullYear()}-${String(
          monthDate.getMonth() + 1
        ).padStart(2, "0")}`;

        const monthData = monthlyRevenueRaw.find((item) => {
          const itemDate = new Date(item.month);
          return (
            itemDate.getFullYear() === monthDate.getFullYear() &&
            itemDate.getMonth() === monthDate.getMonth()
          );
        });

        last13MonthsRevenue.push({
          month: monthKey,
          monthLabel: monthDate.toLocaleDateString("fr-FR", {
            month: "short",
            year: "numeric",
          }),
          total: monthData ? Number(monthData.total) : 0,
        });
      }

      const onlineRevenue = onlineRevenueThisMonth._sum.amount || 0;
      const manualRevenue = manualRevenueThisMonth._sum.amount || 0;
      const totalRevenueMonth = onlineRevenue + manualRevenue;
      const totalRevenueYear = totalRevenueThisYear._sum.amount || 0;

      return c.json({
        success: true,
        data: {
          revenue: {
            onlineRevenueThisMonth: onlineRevenue,
            totalRevenueThisMonth: totalRevenueMonth,
            totalRevenueThisYear: totalRevenueYear,
          },
          last13MonthsRevenue,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return c.json(
        {
          success: false,
          message: "Error fetching dashboard statistics",
          data: null,
        },
        500
      );
    }
  })
  // GET monitor's daily schedule
  .get("/monitor-schedule", adminSessionMiddleware, async (c) => {
    try {
      const userId = c.get("userId");

      // Fetch user to check role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!user) {
        return c.json(
          { success: false, message: "User not found", data: null },
          404
        );
      }

      // Return schedule for any user who is assigned as a monitor to stages/baptemes

      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      );
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59
      );

      // Fetch stages where this monitor is assigned for today
      const stages = await prisma.stage.findMany({
        where: {
          startDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          moniteurs: {
            some: {
              moniteurId: user.id,
            },
          },
        },
        include: {
          bookings: {
            include: {
              stagiaire: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      // Fetch baptemes where this monitor is assigned for today
      const baptemes = await prisma.bapteme.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          moniteurs: {
            some: {
              moniteurId: user.id,
            },
          },
        },
        include: {
          bookings: {
            include: {
              stagiaire: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      // Fetch next upcoming stage (after today)
      const nextStage = await prisma.stage.findFirst({
        where: {
          startDate: {
            gt: endOfDay,
          },
          moniteurs: {
            some: {
              moniteurId: user.id,
            },
          },
        },
        orderBy: {
          startDate: "asc",
        },
        include: {
          bookings: {
            include: {
              stagiaire: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      // Fetch next upcoming bapteme (after today)
      const nextBapteme = await prisma.bapteme.findFirst({
        where: {
          date: {
            gt: endOfDay,
          },
          moniteurs: {
            some: {
              moniteurId: user.id,
            },
          },
        },
        orderBy: {
          date: "asc",
        },
        include: {
          bookings: {
            include: {
              stagiaire: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      // Format the data
      const formattedStages = stages.map((stage) => ({
        id: stage.id,
        startDate: stage.startDate,
        duration: stage.duration,
        type: stage.type,
        bookingsCount: stage.bookings.length,
        participants: stage.bookings.map((booking) => ({
          id: booking.id,
          name: `${booking.stagiaire.firstName} ${booking.stagiaire.lastName}`,
          email: booking.stagiaire.email,
          phone: booking.stagiaire.phone,
        })),
      }));

      const formattedBaptemes = baptemes.map((bapteme) => ({
        id: bapteme.id,
        date: bapteme.date,
        duration: bapteme.duration,
        bookingsCount: bapteme.bookings.length,
        participants: bapteme.bookings.map((booking) => ({
          id: booking.id,
          name: `${booking.stagiaire.firstName} ${booking.stagiaire.lastName}`,
          email: booking.stagiaire.email,
          phone: booking.stagiaire.phone,
          category: booking.category,
        })),
      }));

      // Format upcoming activities
      const formattedNextStage = nextStage
        ? {
            id: nextStage.id,
            startDate: nextStage.startDate,
            duration: nextStage.duration,
            type: nextStage.type,
            bookingsCount: nextStage.bookings.length,
            participants: nextStage.bookings.map((booking) => ({
              id: booking.id,
              name: `${booking.stagiaire.firstName} ${booking.stagiaire.lastName}`,
              email: booking.stagiaire.email,
              phone: booking.stagiaire.phone,
            })),
          }
        : null;

      const formattedNextBapteme = nextBapteme
        ? {
            id: nextBapteme.id,
            date: nextBapteme.date,
            duration: nextBapteme.duration,
            bookingsCount: nextBapteme.bookings.length,
            participants: nextBapteme.bookings.map((booking) => ({
              id: booking.id,
              name: `${booking.stagiaire.firstName} ${booking.stagiaire.lastName}`,
              email: booking.stagiaire.email,
              phone: booking.stagiaire.phone,
              category: booking.category,
            })),
          }
        : null;

      return c.json({
        success: true,
        data: {
          stages: formattedStages,
          baptemes: formattedBaptemes,
          upcoming: {
            nextStage: formattedNextStage,
            nextBapteme: formattedNextBapteme,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching monitor schedule:", error);
      return c.json(
        {
          success: false,
          message: "Error fetching monitor schedule",
          data: null,
        },
        500
      );
    }
  });

export default app;
