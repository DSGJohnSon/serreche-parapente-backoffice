import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  AddCompanySchema,
  GetCompaniesByIdsSchema,
  UpdateCompanySchema,
} from "../schemas";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const app = new Hono()
  //*------------------*//
  //CREATE REQUEST API
  //*------------------*//
  .post(
    "create",
    sessionMiddleware,
    zValidator("json", AddCompanySchema),
    async (c) => {
      try {
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
  //*------------------*//
  //ALL GET REQUESTS API
  //*------------------*//
  //Get all companies of the database
  .get("getAll", async (c) => {
    try {
      const result = await prisma.company.findMany({
        include: {
          users: true,
        },
      });
      return c.json({ success: true, message: "", data: result });
    } catch (error) {
      return c.json({
        success: false,
        message: "Error fetching companies",
        data: null,
      });
    }
  })
  //Get one company by id
  .get("getById/:companyId", sessionMiddleware, async (c) => {
    const { companyId } = c.req.param();
    if (!companyId) {
      return c.json({
        success: false,
        message: "Company ID is required",
        data: null,
      });
    }
    try {
      const result = await prisma.company.findUnique({
        where: {
          id: companyId,
        },
        include: {
          users: true,
        },
      });
      return c.json({ success: true, message: "", data: result });
    } catch (error) {
      return c.json({
        success: false,
        message: "Error fetching company",
        data: null,
      });
    }
  })
  //Get all companies by ids
  .post(
    "getByIds",
    sessionMiddleware,
    zValidator("json", GetCompaniesByIdsSchema),
    async (c) => {
      const { companyIds } = c.req.valid("json");
      if (
        !companyIds ||
        !Array.isArray(companyIds) ||
        companyIds.length === 0
      ) {
        return c.json({
          success: false,
          message: "Company IDs are required",
          data: null,
        });
      }
      if (companyIds.length > 50) {
        return c.json({
          success: false,
          message: "Too many company IDs provided",
          data: null,
        });
      }
      if (companyIds.some((id) => typeof id !== "string")) {
        return c.json({
          success: false,
          message: "Invalid Company IDs",
          data: null,
        });
      }

      try {
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
        return c.json({ success: true, message: "", data: result });
      } catch (error) {
        return c.json({
          success: false,
          message: "Error fetching companies",
          data: null,
        });
      }
    }
  )
  //Get List of companies by user id
  .get("getByUserId/:userId", async (c) => {
    const { userId } = c.req.param();
    if (!userId) {
      return c.json({
        success: false,
        message: "User ID is required",
        data: null,
      });
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
      return c.json({ success: true, message: "", data: result });
    } catch (error) {
      return c.json({
        success: false,
        message: "Error fetching companies",
        data: null,
      });
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
      if (!companyId) {
        return c.json({
          success: false,
          message: "Company ID is required",
          data: null,
        });
      }

      try {
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
  //*------------------*//
  //DELETE COMPANY
  //*------------------*//
  .delete("delete/:companyId", sessionMiddleware, async (c) => {
    const { companyId } = c.req.param();
    if (!companyId) {
      return c.json({
        success: false,
        message: "Company ID is required",
        data: null,
      });
    }

    try {
      const result = await prisma.company.delete({
        where: {
          id: companyId,
        },
      });
      return c.json({
        success: true,
        message: `Entreprise ${result.name} supprimée avec succès !`,
        data: result,
      });
    } catch (error) {
      return c.json({
        success: false,
        message: "Erreur lors de la suppression de l'entreprise. Suppression interrompue.",
        data: null,
      });
    }
  });

export default app;
