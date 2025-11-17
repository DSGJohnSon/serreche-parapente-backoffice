import { Hono } from "hono";
import { adminSessionMiddleware } from "@/lib/session-middleware";
import prisma from "@/lib/prisma";

const app = new Hono()
  // GET dashboard statistics
  .get(
    "/stats",
    adminSessionMiddleware,
    async (c) => {
      try {
        // Get selected month from query params (format: YYYY-MM) or use current month
        const selectedMonth = c.req.query("month");
        const now = new Date();
        
        let targetDate: Date;
        if (selectedMonth) {
          const [year, month] = selectedMonth.split('-').map(Number);
          targetDate = new Date(year, month - 1, 1);
        } else {
          targetDate = now;
        }
        
        const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);
        const startOfYear = new Date(targetDate.getFullYear(), 0, 1);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Parallel queries for better performance
        const [
          // Orders statistics
          totalOrders,
          ordersThisMonth,
          ordersThisYear,
          recentOrders,
          ordersByStatus,
          
          // Revenue statistics (total orders)
          totalRevenue,
          revenueThisMonth,
          revenueThisYear,
          
          // Actual collected revenue (payments)
          totalCollectedRevenue,
          collectedRevenueThisMonth,
          collectedRevenueThisYear,
          
          // Clients statistics
          totalClients,
          clientsThisMonth,
          
          // Stagiaires statistics
          totalStagiaires,
          stagiairesThisMonth,
          
          // Stages statistics
          totalStages,
          upcomingStages,
          stagesThisMonth,
          
          // Baptemes statistics
          totalBaptemes,
          upcomingBaptemes,
          baptemesThisMonth,
          
          // Gift cards statistics
          totalGiftCards,
          activeGiftCards,
          giftCardsValue,
          
          // Reservations statistics
          totalReservations,
          reservationsThisMonth,
          
          // Payments statistics
          totalPayments,
          paymentsThisMonth,
          pendingPayments,
        ] = await Promise.all([
          // Orders
          prisma.order.count(),
          prisma.order.count({
            where: { createdAt: { gte: startOfMonth } },
          }),
          prisma.order.count({
            where: { createdAt: { gte: startOfYear } },
          }),
          prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              client: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          }),
          prisma.order.groupBy({
            by: ['status'],
            _count: true,
          }),
          
          // Revenue (total orders amount)
          prisma.order.aggregate({
            where: { status: { in: ['PAID', 'PARTIALLY_PAID', 'FULLY_PAID', 'CONFIRMED'] } },
            _sum: { totalAmount: true },
          }),
          prisma.order.aggregate({
            where: {
              status: { in: ['PAID', 'PARTIALLY_PAID', 'FULLY_PAID', 'CONFIRMED'] },
              createdAt: { gte: startOfMonth, lte: endOfMonth },
            },
            _sum: { totalAmount: true },
          }),
          prisma.order.aggregate({
            where: {
              status: { in: ['PAID', 'PARTIALLY_PAID', 'FULLY_PAID', 'CONFIRMED'] },
              createdAt: { gte: startOfYear },
            },
            _sum: { totalAmount: true },
          }),
          
          // Collected revenue (actual payments received)
          prisma.payment.aggregate({
            where: { status: 'SUCCEEDED' },
            _sum: { amount: true },
          }),
          prisma.payment.aggregate({
            where: {
              status: 'SUCCEEDED',
              createdAt: { gte: startOfMonth, lte: endOfMonth },
            },
            _sum: { amount: true },
          }),
          prisma.payment.aggregate({
            where: {
              status: 'SUCCEEDED',
              createdAt: { gte: startOfYear },
            },
            _sum: { amount: true },
          }),
          
          // Clients
          prisma.client.count(),
          prisma.client.count({
            where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
          }),
          
          // Stagiaires
          prisma.stagiaire.count(),
          prisma.stagiaire.count({
            where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
          }),
          
          // Stages
          prisma.stage.count(),
          prisma.stage.count({
            where: { startDate: { gte: now } },
          }),
          prisma.stage.count({
            where: {
              startDate: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
          
          // Baptemes
          prisma.bapteme.count(),
          prisma.bapteme.count({
            where: { date: { gte: now } },
          }),
          prisma.bapteme.count({
            where: {
              date: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
          
          // Gift cards
          prisma.giftCard.count(),
          prisma.giftCard.count({
            where: { isUsed: false },
          }),
          prisma.giftCard.aggregate({
            where: { isUsed: false },
            _sum: { remainingAmount: true },
          }),
          
          // Reservations (Stage + Bapteme bookings)
          Promise.all([
            prisma.stageBooking.count(),
            prisma.baptemeBooking.count(),
          ]).then(([stages, baptemes]) => stages + baptemes),
          Promise.all([
            prisma.stageBooking.count({
              where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
            }),
            prisma.baptemeBooking.count({
              where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
            }),
          ]).then(([stages, baptemes]) => stages + baptemes),
          
          // Payments
          prisma.payment.count({
            where: { status: 'SUCCEEDED' },
          }),
          prisma.payment.count({
            where: {
              status: 'SUCCEEDED',
              createdAt: { gte: startOfMonth, lte: endOfMonth },
            },
          }),
          prisma.payment.count({
            where: { status: 'PENDING' },
          }),
        ]);

        // Calculate growth percentages (comparing this month to last month)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = startOfMonth;
        
        const [ordersLastMonth, revenueLastMonth, collectedRevenueLastMonth, clientsLastMonth] = await Promise.all([
          prisma.order.count({
            where: {
              createdAt: {
                gte: lastMonthStart,
                lt: lastMonthEnd,
              },
            },
          }),
          prisma.order.aggregate({
            where: {
              status: { in: ['PAID', 'PARTIALLY_PAID', 'FULLY_PAID', 'CONFIRMED'] },
              createdAt: {
                gte: lastMonthStart,
                lt: lastMonthEnd,
              },
            },
            _sum: { totalAmount: true },
          }),
          prisma.payment.aggregate({
            where: {
              status: 'SUCCEEDED',
              createdAt: {
                gte: lastMonthStart,
                lt: lastMonthEnd,
              },
            },
            _sum: { amount: true },
          }),
          prisma.client.count({
            where: {
              createdAt: {
                gte: lastMonthStart,
                lt: lastMonthEnd,
              },
            },
          }),
        ]);

        // Calculate growth percentages
        const calculateGrowth = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return ((current - previous) / previous) * 100;
        };

        const ordersGrowth = calculateGrowth(ordersThisMonth, ordersLastMonth);
        const revenueGrowth = calculateGrowth(
          revenueThisMonth._sum.totalAmount || 0,
          revenueLastMonth._sum.totalAmount || 0
        );
        const collectedRevenueGrowth = calculateGrowth(
          collectedRevenueThisMonth._sum.amount || 0,
          collectedRevenueLastMonth._sum.amount || 0
        );
        const clientsGrowth = calculateGrowth(clientsThisMonth, clientsLastMonth);

        // Get daily revenue data for chart
        const dailyRevenueData = [];
        const daysInMonth = endOfMonth.getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), day, 0, 0, 0);
          const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), day, 23, 59, 59);
          
          const [ordersRevenue, paymentsRevenue] = await Promise.all([
            prisma.order.aggregate({
              where: {
                status: { in: ['PAID', 'PARTIALLY_PAID', 'FULLY_PAID', 'CONFIRMED'] },
                createdAt: { gte: dayStart, lte: dayEnd },
              },
              _sum: { totalAmount: true },
            }),
            prisma.payment.aggregate({
              where: {
                status: 'SUCCEEDED',
                createdAt: { gte: dayStart, lte: dayEnd },
              },
              _sum: { amount: true },
            }),
          ]);
          
          dailyRevenueData.push({
            day: day,
            date: dayStart.toISOString().split('T')[0],
            totalRevenue: ordersRevenue._sum.totalAmount || 0,
            collectedRevenue: paymentsRevenue._sum.amount || 0,
          });
        }

        return c.json({
          success: true,
          data: {
            selectedMonth: {
              year: targetDate.getFullYear(),
              month: targetDate.getMonth() + 1,
              isCurrentMonth: targetDate.getMonth() === now.getMonth() && targetDate.getFullYear() === now.getFullYear(),
            },
            chartData: dailyRevenueData,
            overview: {
              totalOrders,
              ordersThisMonth,
              ordersThisYear,
              ordersGrowth: Math.round(ordersGrowth * 10) / 10,
              
              totalRevenue: totalRevenue._sum.totalAmount || 0,
              revenueThisMonth: revenueThisMonth._sum.totalAmount || 0,
              revenueThisYear: revenueThisYear._sum.totalAmount || 0,
              revenueGrowth: Math.round(revenueGrowth * 10) / 10,
              
              totalCollectedRevenue: totalCollectedRevenue._sum.amount || 0,
              collectedRevenueThisMonth: collectedRevenueThisMonth._sum.amount || 0,
              collectedRevenueThisYear: collectedRevenueThisYear._sum.amount || 0,
              collectedRevenueGrowth: Math.round(collectedRevenueGrowth * 10) / 10,
              
              totalClients,
              clientsThisMonth,
              clientsGrowth: Math.round(clientsGrowth * 10) / 10,
              
              totalStagiaires,
              stagiairesThisMonth,
            },
            
            orders: {
              total: totalOrders,
              thisMonth: ordersThisMonth,
              thisYear: ordersThisYear,
              byStatus: ordersByStatus.reduce((acc, item) => {
                acc[item.status] = item._count;
                return acc;
              }, {} as Record<string, number>),
              recent: recentOrders,
            },
            
            stages: {
              total: totalStages,
              upcoming: upcomingStages,
              thisMonth: stagesThisMonth,
            },
            
            baptemes: {
              total: totalBaptemes,
              upcoming: upcomingBaptemes,
              thisMonth: baptemesThisMonth,
            },
            
            giftCards: {
              total: totalGiftCards,
              active: activeGiftCards,
              totalValue: giftCardsValue._sum.remainingAmount || 0,
            },
            
            reservations: {
              total: totalReservations,
              thisMonth: reservationsThisMonth,
            },
            
            payments: {
              total: totalPayments,
              thisMonth: paymentsThisMonth,
              pending: pendingPayments,
            },
          },
        });

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return c.json({
          success: false,
          message: "Error fetching dashboard statistics",
          data: null,
        }, 500);
      }
    }
  );

export default app;