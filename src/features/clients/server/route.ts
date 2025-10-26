import { Hono } from "hono";
import { adminSessionMiddleware, publicAPIMiddleware } from "@/lib/session-middleware";
import prisma from "@/lib/prisma";
import { zValidator } from "@hono/zod-validator";
import { AddClientSchema } from "../schemas";

const app = new Hono()
  //*------------------*//
  //ALL GET REQUESTS API
  //*------------------*//
  //Get all clients of the database
  .get(
    "getAll",
    adminSessionMiddleware,
    async (c) => {
      try {
        const result = await prisma.client.findMany({
          include: {
            orders: {
              include: {
                orderItems: true,
              },
            },
            giftCards: true,
          },
        });
        return c.json({ success: true, message: "", data: result });
      } catch (error) {
        return c.json({
          success: false,
          message: "Error fetching clients",
          data: null,
        });
      }
    }
  )
  .get(
    "getById/:id",
    adminSessionMiddleware,
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
    }
  )
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