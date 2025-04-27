import { Hono } from "hono";
import { handle } from "hono/vercel";
import auth from "@/features/auth/server/route";
import users from "@/features/users/server/route";
import companies from "@/features/companies/server/route";
import weeks from "@/features/weeks/server/route";
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
          "https://mdr-x-ensci-front-ix813qo0t.vercel.app",
          "https://mdr-x-ensci-front-80ehs1g4r.vercel.app",
          "https://ensci.dominiquerenaud.com",
          "https://www.ensci.dominiquerenaud.com",
          "https://mdr-x-ensci-front-manufacture-dominique-renauds-projects.vercel.app/fr",
        ].includes(origin ?? "")
          ? origin
          : "";
      },
      allowMethods: ["POST", "GET", "OPTIONS"],
      allowHeaders: ["Content-Type"],
    })
  )
  // .use("*", async (c, next) => {
  //   console.log("Incoming request:", c.req.method, c.req.path);
  //   await next();
  // })
  .route("/auth", auth)
  .route("/users", users)
  .route("/companies", companies)
  .route("/weeks", weeks)

export const GET = handle(app);
export const POST = handle(app);
export const OPTIONS = handle(app);

export type AppType = typeof routes;