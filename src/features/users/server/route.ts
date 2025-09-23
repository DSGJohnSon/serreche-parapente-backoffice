import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  adminSessionMiddleware,
  sessionMiddleware,
} from "@/lib/session-middleware";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { ChangeUserRoleSchema } from "../schemas";

const app = new Hono()
  //*------------------*//
  //ALL GET REQUESTS API
  //*------------------*//
  //Get all users of the database
  .get("getAll", adminSessionMiddleware, async (c) => {
    try {
      const result = await prisma.user.findMany();
      return c.json({ success: true, message: "", data: result });
    } catch (error) {
      return c.json({
        success: false,
        message: "Error fetching users",
        data: null,
      });
    }
  })
  //
  //Get one user by id
  .get("getById/:userId", adminSessionMiddleware, async (c) => {
    const { userId } = c.req.param();
    if (!userId) {
      return c.json({
        success: false,
        message: "User ID is required",
        data: null,
      });
    }

    try {
      const result = await prisma.user.findMany({
        where: {
          id: userId,
        },
      });
      return c.json({ success: true, message: "", data: result });
    } catch (error) {
      return c.json({
        success: false,
        message: "Error fetching users by id",
        data: null,
      });
    }
  })
  //
  //Get all users by type
  .get("getByRole/:role", adminSessionMiddleware, async (c) => {
    const { role } = c.req.param();
    const typedRole = role as Role;
    if (!role || !Object.values(Role).includes(typedRole)) {
      return c.json({
        success: false,
        message: "Role ('ADMIN', 'MONITEUR', 'CUSTOMER') is required",
        data: null,
      });
    }

    try {
      const result = await prisma.user.findMany({
        where: {
          role: typedRole,
        },
      });

      return c.json({ success: true, message: "", data: result });
    } catch (error) {
      return c.json({
        success: false,
        message: "Error fetching user",
        data: null,
      });
    }
  })
  //
  // Change user role
  .post(
    "/changeRole",
    adminSessionMiddleware,
    zValidator("json", ChangeUserRoleSchema),
    async (c) => {
      const { userId, role } = c.req.valid("json");
      if (!userId || !role) {
        return c.json({
          success: false,
          message: "Un user et un role sont requis",
          data: null,
        });
      }

      try {
        const result = await prisma.user.update({
          where: { id: userId },
          data: { role: role as Role },
        });

        return c.json({
          success: true,
          message: `Compte de ${result.name} mis à jour vers le role "MONITEUR"`,
          data: result,
        });
      } catch (error) {
        return c.json({
          success: false,
          message: "Error updating user",
          data: null,
        });
      }
    }
  );
//
export default app;
