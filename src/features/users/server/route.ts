import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { GetUsersByIdsSchema } from "../schemas";
import { sessionMiddleware } from "@/lib/session-middleware";
import prisma from "@/lib/prisma";

const app = new Hono()
  //*------------------*//
  //ALL GET REQUESTS API
  //*------------------*//
  //Get all users of the database
  .get("getAll", sessionMiddleware, async (c) => {
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
  .get("getById/:userId", sessionMiddleware, async (c) => {
    const { userId } = c.req.param();
    if (!userId) {
      return c.json({
        success: false,
        message: "User ID is required",
        data: null,
      });
    }

    try {
      const result = await prisma.user.findUnique({
        where: {
          id: userId,
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
  //Get all users by ids
  .post(
    "getByIds",
    sessionMiddleware,
    zValidator("json", GetUsersByIdsSchema),
    async (c) => {
      const { userIds } = c.req.valid("json");
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return c.json({
          success: false,
          message: "User IDs are required",
          data: null,
        });
      }
      if (userIds.some((id) => typeof id !== "string")) {
        return c.json({
          success: false,
          message: "Invalid User IDs",
          data: null,
        });
      }

      try {
        const result = await prisma.user.findMany({
          where: {
            id: {
              in: userIds,
            },
          },
        });
        return c.json({ success: true, message: "", data: result });
      } catch (error) {
        return c.json({
          success: false,
          message: "Error fetching users",
          data: null,
        });
      }
    }
  );

export default app;
