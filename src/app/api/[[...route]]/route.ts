import { Hono } from "hono";
import { handle } from "hono/vercel";
import auth from "@/features/auth/server/route";
import users from "@/features/users/server/route";
import customers from "@/features/customers/server/route";
import stages from "@/features/stages/server/route";
import reservationStages from "@/features/reservations/stages/server/route";
import reservations from "@/features/reservations/server/route";
import baptemes from "@/features/biplaces/server/route";
import giftcards from "@/features/giftcards/server/route";
import cart from "@/features/cart/server/route";
import availability from "@/features/availability/server/route";
import orders from "@/features/orders/server/route";
import checkout from "@/features/checkout/server/route";
import { cors } from "hono/cors";

const app = new Hono().basePath("/api");

const routes = app
  .use(
    "*",
    cors({
      origin: (origin) => {
        return [
          "http://localhost:3000",
          "http://localhost:3001",
        ].includes(origin ?? "")
          ? origin
          : "";
      },
      allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "x-api-key", "x-session-id"],
    })
  )
  // .use("*", async (c, next) => {
  //   console.log("Incoming request:", c.req.method, c.req.path);
  //   await next();
  // })
  .route("/auth", auth)
  .route("/users", users)
  .route("/customers", customers)
  .route("/stages", stages)
  .route("/reservationStages", reservationStages)
  .route("/reservations", reservations)
  .route("/baptemes", baptemes)
  .route("/giftcards", giftcards)
  .route("/cart", cart)
  .route("/availability", availability)
  .route("/orders", orders)
  .route("/checkout", checkout)

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);

export type AppType = typeof routes;