import { Hono } from "hono";
import {
  adminSessionMiddleware,
  publicAPIMiddleware,
} from "@/lib/session-middleware";
import prisma from "@/lib/prisma";
import { zValidator } from "@hono/zod-validator";
import { AddClientSchema } from "../schemas";

const app = new Hono()
  //*------------------*//
  //ALL GET REQUESTS API
  //*------------------*//
  //Get all clients of the database with pagination, sorting and search
  .get("getAll", adminSessionMiddleware, async (c) => {
    try {
      const { page, pageSize, sortBy, sortOrder, search, nopaging } =
        c.req.query();

      const p = parseInt(page) || 1;
      const ps = parseInt(pageSize) || 25;
      const skip = (p - 1) * ps;
      const isNoPaging = nopaging === "true";

      // Define where clause for search
      const where: any = search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { city: { contains: search, mode: "insensitive" } },
              { id: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      // Special handling for sorting by number of orders
      let orderBy: any = {};
      if (sortBy === "orders") {
        orderBy = {
          orders: {
            _count: sortOrder === "asc" ? "asc" : "desc",
          },
        };
      } else if (sortBy === "createdAt") {
        orderBy = { createdAt: sortOrder === "asc" ? "asc" : "desc" };
      } else if (sortBy === "name") {
        orderBy = [
          { lastName: sortOrder === "asc" ? "asc" : "desc" },
          { firstName: sortOrder === "asc" ? "asc" : "desc" },
        ];
      } else {
        // Default: sort by orders count descending
        orderBy = {
          orders: {
            _count: "desc",
          },
        };
      }

      const [totalCount, result] = await Promise.all([
        prisma.client.count({ where }),
        prisma.client.findMany({
          where,
          include: {
            orders: true,
            giftCards: true,
          },
          orderBy,
          ...(isNoPaging ? {} : { skip, take: ps }),
        }),
      ]);

      return c.json({
        success: true,
        message: "",
        data: {
          clients: result,
          totalCount,
          page: p,
          pageSize: ps,
        },
      });
    } catch (error) {
      console.error("Error fetching clients:", error);
      return c.json({
        success: false,
        message: "Error fetching clients",
        data: null,
      });
    }
  })
  .get("getById/:id", adminSessionMiddleware, async (c) => {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({
          success: false,
          message: "ID is required",
          data: null,
        });
      }
      const result = await prisma.client.findUnique({
        where: { id },
        include: {
          orders: {
            include: {
              orderItems: {
                include: {
                  stage: true,
                  bapteme: true,
                  stageBooking: {
                    include: {
                      stagiaire: true,
                    },
                  },
                  baptemeBooking: {
                    include: {
                      stagiaire: true,
                    },
                  },
                },
              },
            },
          },
          giftCards: true,
        },
      });
      return c.json({ success: true, message: "", data: result });
    } catch (error) {
      return c.json({
        success: false,
        message: "Error fetching client",
        data: null,
      });
    }
  })
  //
  //Create new client
  .post(
    "/create",
    publicAPIMiddleware,
    zValidator("json", AddClientSchema),
    async (c) => {
      const {
        address,
        city,
        country,
        email,
        firstName,
        lastName,
        phone,
        postalCode,
      } = c.req.valid("json");

      if (
        !firstName ||
        !lastName ||
        !email ||
        !phone ||
        !address ||
        !postalCode ||
        !city ||
        !country
      ) {
        return c.json({
          success: false,
          message: "Il manque des champs",
          data: null,
        });
      }

      try {
        const result = await prisma.client.create({
          data: {
            firstName,
            lastName,
            email,
            phone,
            address,
            postalCode,
            city,
            country,
          },
        });

        return c.json({
          success: true,
          message: `Client ${result.firstName} ${result.lastName} enregistré avec succès`,
          data: result,
        });
      } catch (error) {
        return c.json({
          success: false,
          message: "Error creating client",
          data: null,
        });
      }
    }
  );

export default app;
