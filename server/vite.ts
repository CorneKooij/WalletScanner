import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { Server } from "http";
//import viteConfig from "../vite.config"; // This import is no longer needed in the revised code.
import { nanoid } from "nanoid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function log(message: string): void {
  console.log(`[server] ${message}`);
}

export async function setupVite(
  app: express.Express,
  server: Server
): Promise<void> {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    root: path.resolve(__dirname, "../client"),
    appType: "spa",
  });

  app.use(vite.middlewares);

  // Serve index.html for any route not handled by the API
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Serve HTML with Vite transforms
      let template = path.resolve(__dirname, "../client/index.html");
      template = await vite.transformIndexHtml(
        url,
        (
          await vite.ssrLoadModule(template)
        ).code
      );
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: express.Express): void {
  const clientDir = path.resolve(__dirname, "../dist/public");
  app.use(express.static(clientDir));

  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });
}
