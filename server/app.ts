import express from "express";
import type { Request, Response } from "express-serve-static-core";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth.js";
import { publicPlatformScript } from "./_core/publicConfig.js";
import { createContext } from "./_core/context.js";
import { appRouter } from "./routers.js";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req: Request, res: Response) => res.json({ status: "ok" }));
  app.get("/api/platform/config.js", (_req: Request, res: Response) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  return app;
}
