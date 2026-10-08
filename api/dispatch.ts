import type { Request, Response } from "express-serve-static-core";
import { createApp } from "../server/app.js";

const app = createApp();

export default function handler(req: Request, res: Response) {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const apiPath = requestUrl.searchParams.get("__path");

  if (apiPath) {
    requestUrl.searchParams.delete("__path");
    const originalPath = apiPath.replace(/^\/+/, "");
    const query = requestUrl.searchParams.toString();
    req.url = `/api/${originalPath}${query ? `?${query}` : ""}`;
  }

  return app(req, res);
}
