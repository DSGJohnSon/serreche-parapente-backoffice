import "server-only";

import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

import { AUTH_COOKIE } from "@/features/auth/constants";
import supabase from "./supabase";
import prisma from "./prisma";

export const sessionMiddleware = createMiddleware(async (c, next) => {
  const session = getCookie(c, AUTH_COOKIE);
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(session);

  if (user === null || error) return c.json({ error: "Unauthorized" }, 401);

  await next();
});

export const adminSessionMiddleware = createMiddleware(async (c, next) => {
  const session = getCookie(c, AUTH_COOKIE);
  if (!session) {
    return c.json({ error: "Unauthorized, admin only" }, 401);
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(session);

  if (user === null || error)
    return c.json({ error: "Unauthorized, admin only" }, 401);

  const userToVerify = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
  });

  if (userToVerify === null || userToVerify.role !== "ADMIN")
    return c.json({ error: "Unauthorized, admin only" }, 401);

  await next();
});

export const publicAPIMiddleware = createMiddleware(async (c, next) => {
  const correctAPIKey = process.env.PUBLIC_API_KEY;
  const apiKey = c.req.header("x-api-key");

  // Vérifier que la clé API est configurée
  if (!correctAPIKey) {
    console.error("PUBLIC_API_KEY environment variable is not set");
    return c.json({ error: "Server configuration error" }, 500);
  }

  if (!apiKey || apiKey !== correctAPIKey) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});
