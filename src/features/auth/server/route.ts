import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { loginSchema, signUpSchema } from "../schemas";
import { deleteCookie, setCookie } from "hono/cookie";
import { AUTH_COOKIE } from "../constants";
import { HTTPException } from "hono/http-exception";
import { avatars } from "@/data/avatars";
import supabase from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { sessionMiddleware } from "@/lib/session-middleware";

async function signUpNewUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {},
  });
  return { data, error };
}
async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

const app = new Hono()
  .get("current", sessionMiddleware, async (c) => {
    const session = (await cookies()).get(AUTH_COOKIE);
    if (!session)
      return c.json({
        success: false,
        message: "Pas d'utilisateur connecté, redirection vers login.",
        data: null,
      });

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(session.value);

      if (user === null || error)
        return c.json({
          success: false,
          message: "Erreur lors de la récupération de l'utilisateur",
          data: null,
        });

      const userToReturn = await prisma.user.findUnique({
        where: {
          email: user.email,
        },
      });
      if (!userToReturn) {
        return c.json({
          success: false,
          message: "Utilisateur non trouvé dans la base de données",
          data: null,
        });
      }

      return c.json({ success: true, message: "", data: userToReturn });
    } catch (error) {
      console.error("Error getting user:", error);
      return c.json({
        success: false,
        message: "Erreur lors de la récupération de l'utilisateur",
        data: null,
      });
    }
  })
  // Connexion
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");
    if (!email || !password) {
      return c.json({
        success: false,
        message: "Email et mot de passe sont requis",
        data: null,
      });
    }

    const { data, error } = await signInWithEmail(email, password);
    if (error) {
      if (error.code === "invalid_credentials") {
        return c.json({
          success: false,
          message: "Email ou mot de passe incorrect !",
          data: null,
        });
      }
      if (error.code === "user_not_found") {
        return c.json({
          success: false,
          message: "Cet email n'est pas enregistré !",
          data: null,
        });
      }
      if (error.code === "invalid_email") {
        return c.json({
          success: false,
          message: "Email invalide !",
          data: null,
        });
      }
    }

    if (!data) {
      return c.json({
        success: false,
        message: "Aucune donnée reçue !",
        data: null,
      });
    }
    if (data.session?.access_token) {
      setCookie(c, AUTH_COOKIE, data.session.access_token, {
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        sameSite: "strict",
      });
    } else {
      return c.json({
        success: false,
        message: "Erreur d'authentification !",
        data: null,
      });
    }

    return c.json({
      success: true,
      message: "Connexion réussie ! Redirection vers le dashboard.",
      data: data,
    });
  })
  .post("/register", zValidator("json", signUpSchema), async (c) => {
    const { email, password, name } = c.req.valid("json");
    if (!email || !password || !name) {
      return c.json({
        success: false,
        message: "Email, mot de passe et nom sont requis",
        data: null,
      });
    }
    const { data, error } = await signUpNewUser(email, password);
    if (error) {
      if (error.code === "email_already_exists") {
        return c.json({
          success: false,
          message: "Cet email est déjà utilisé pour un compte utilisateur !",
          data: null,
        });
      }
      if (error.code === "invalid_email") {
        return c.json({
          success: false,
          message: "Email invalide !",
          data: null,
        });
      }
    }

    if (!data) {
      return c.json({
        success: false,
        message: "Aucune donnée reçue !",
        data: null,
      });
    }

    const user = await prisma.user.create({
      data: {
        id: data?.user?.id || "",
        email,
        name,
        avatarUrl: avatars[Math.floor(Math.random() * avatars.length)],
      },
    });

    if (!user) {
      return c.json({
        success: false,
        message: "Erreur lors de la création de l'utilisateur",
        data: null,
      });
    }

    const { data: dataSignIn, error: errorSignIn } = await signInWithEmail(
      email,
      password
    );
    if (!dataSignIn) {
      return c.json({
        success: false,
        message: "Aucune donnée reçue lors de la connexion !",
        data: null,
      });
    }
    if (errorSignIn) {
      if (errorSignIn.code === "invalid_credentials") {
        return c.json({
          success: false,
          message: "Email ou mot de passe incorrect !",
          data: null,
        });
      }
      if (errorSignIn.code === "user_not_found") {
        return c.json({
          success: false,
          message: "Cet email n'est pas enregistré !",
          data: null,
        });
      }
      if (errorSignIn.code === "invalid_email") {
        return c.json({
          success: false,
          message: "Email invalide !",
          data: null,
        });
      }
    }

    if (dataSignIn.session?.access_token) {
      setCookie(c, AUTH_COOKIE, dataSignIn.session.access_token, {
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        sameSite: "strict",
      });
    } else {
      return c.json({ success: false, message: "Authentication failed!", data: null });
    }

    return c.json({ success: true, message: "Inscription réussie !", data: dataSignIn });
  })
  .post("/logout", sessionMiddleware, async (c) => {
    deleteCookie(c, AUTH_COOKIE);

    return c.json({ success: true, message: "Déconnexion réussie ! Redirection", data: null });
  });

export default app;
