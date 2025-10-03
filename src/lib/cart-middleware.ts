import "server-only";

import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import prisma from "./prisma";

export const cartSessionMiddleware = createMiddleware(async (c, next) => {
  const sessionId = c.req.header("x-session-id") || getCookie(c, "cart-session");
  
  if (!sessionId) {
    return c.json({ error: "Session ID required" }, 400);
  }
  
  // Vérifier/créer session
  let session = await prisma.cartSession.findUnique({
    where: { sessionId }
  });
  
  if (!session || session.expiresAt < new Date()) {
    // Si session expirée, la supprimer d'abord
    if (session && session.expiresAt < new Date()) {
      await prisma.cartSession.delete({
        where: { id: session.id }
      });
    }
    
    // Créer une nouvelle session
    session = await prisma.cartSession.create({
      data: {
        sessionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
      }
    });
  }
  
  c.set("cartSession", session);
  await next();
});

export const cartOrAuthMiddleware = createMiddleware(async (c, next) => {
  const authCookie = getCookie(c, "auth-token");
  const sessionId = c.req.header("x-session-id");
  
  if (authCookie) {
    // Utilisateur authentifié - on peut ajouter la logique d'auth ici plus tard
    c.set("isAuthenticated", true);
    return await next();
  }
  
  if (sessionId) {
    // Session temporaire
    return await cartSessionMiddleware(c, next);
  }
  
  return c.json({ error: "Authentication or session required" }, 401);
});