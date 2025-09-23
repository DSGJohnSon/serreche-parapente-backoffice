import { Hono } from "hono";
import { adminSessionMiddleware, publicAPIMiddleware, sessionMiddleware } from "@/lib/session-middleware";
import prisma from "@/lib/prisma";
import { zValidator } from "@hono/zod-validator";
import { AddCustomerSchema } from "../schemas";

const app = new Hono()
  //*------------------*//
  //ALL GET REQUESTS API
  //*------------------*//
  //Get all customers of the database
  .get(
    "getAll",
    adminSessionMiddleware,
    async (c) => {
      try {
        const result = await prisma.customer.findMany({
          include: {
            stages: {
              include: {
                stage: true,
              },
            },
          },
        });
        return c.json({ success: true, message: "", data: result });
      } catch (error) {
        return c.json({
          success: false,
          message: "Error fetching customers",
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
        const result = await prisma.customer.findUnique({
          where: { id },
          include: {
            stages: {
              include: {
                stage: true,
              },
            },
            giftCards: {
              include: {
                usedByCustomer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            giftCardsUsed: {
              include: {
                customer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
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
  //
  //Create new customer
  .post(
    "/create",
    publicAPIMiddleware,
    zValidator("json", AddCustomerSchema),
    async (c) => {
      const {
        adress,
        city,
        country,
        email,
        firstname,
        height,
        lastname,
        phone,
        postalCode,
        weight,
      } = c.req.valid("json");

      if (
        !firstname ||
        !lastname ||
        !email ||
        !phone ||
        !adress ||
        !postalCode ||
        !city ||
        !country ||
        !height ||
        !weight
      ) {
        return c.json({
          success: false,
          message: "Il manque des champs",
          data: null,
        });
      }

      try {
        const result = await prisma.customer.create({
          data: {
            firstName: firstname,
            lastName: lastname,
            email,
            phone,
            adress,
            postalCode,
            city,
            country,
            height: Number(height),
            weight: Number(weight),
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
          message: "Error creating customer",
          data: null,
        });
      }
    }
  );

export default app;
