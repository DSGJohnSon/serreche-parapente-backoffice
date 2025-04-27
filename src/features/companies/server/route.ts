import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  AddCompanySchema,
  GetCompaniesByIdsSchema,
  UpdateCompanySchema,
} from "../schemas";
import prisma from "@/lib/prisma";

const app = new Hono()
  //*------------------*//
  //CREATE REQUEST API
  //*------------------*//
  .post(
    "create",
    sessionMiddleware,
    zValidator("json", AddCompanySchema),
    async (c) => {
      const { name, siret, country, users } = c.req.valid("json");

      const result = await prisma.company.create({
        data: {
          name: name,
          siret: siret,
          country: country,
          users: {
            connect: users.map((userId) => ({
              id: userId,
            })),
          },
        },
      });

      return c.json({
        success: true,
        message: `Enregistrement de l'entreprise ${result.name} réussie !`,
        data: result,
      });
    }
  )
  //*------------------*//
  //ALL GET REQUESTS API
  //*------------------*//
  //Get all companies of the database
  .get("getAll", async (c) => {
    const result = await prisma.company.findMany({
      include: {
        users: true,
      },
    });
    return c.json({ data: result });
  })
  //Get one company by id
  .get("getById/:companyId", sessionMiddleware, async (c) => {
    const { companyId } = c.req.param();
    const result = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
      include: {
        users: true,
      },
    });
    return c.json({ data: result });
  })
  //Get all companies by ids
  .post(
    "getByIds",
    sessionMiddleware,
    zValidator("json", GetCompaniesByIdsSchema),
    async (c) => {
      const { companyIds } = c.req.valid("json");
      const result = await prisma.company.findMany({
        where: {
          id: {
            in: companyIds,
          },
        },
        include: {
          users: true,
        },
      });
      return c.json({ data: result });
    }
  )
  //Get List of companies by user id
  .get("getByUserId/:userId", async (c) => {
    const { userId } = c.req.param();
    if (!userId) {
      return c.json({ error: "Missing userId" }, 400);
    }
    try {
      const result = await prisma.company.findMany({
        where: {
          users: {
            some: {
              id: userId,
            },
          },
        },
        include: {
          users: true,
        },
      });
      return c.json({ data: result });
    } catch (error: any) {
      console.error("Error stack:", error?.stack);
      console.error("Error message:", error?.message || error);
      return c.json({ error: error?.message || "Unknown error" }, 500);
    }
  })
  //*------------------*//
  //UPDATE COMPANY
  //*------------------*//
  .post(
    "update/:companyId",
    sessionMiddleware,
    zValidator("json", UpdateCompanySchema),
    async (c) => {
      const { companyId } = c.req.param();
      const { name, siret, country, users } = c.req.valid("json");

      const result = await prisma.company.update({
        where: {
          id: companyId,
        },
        data: {
          name: name,
          siret: siret,
          country: country,
          users: {
            set: users.map((userId) => ({
              id: userId,
            })),
          },
        },
      });
      return c.json({
        success: true,
        message: `Entreprise ${result.name} modifiée avec succès !`,
      });
    }
  )
  //*------------------*//
  //DELETE COMPANY
  //*------------------*//
  .delete("delete/:companyId", sessionMiddleware, async (c) => {
    const { companyId } = c.req.param();
    const result = await prisma.company.delete({
      where: {
        id: companyId,
      },
    });
    return c.json({
      success: true,
      message: `Entreprise ${result.name} supprimée avec succès !`,
    });
  });

export default app;
