import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API routes
    if (url.startsWith('/api/')) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // Check if client template exists
      if (!fs.existsSync(clientTemplate)) {
        // Return a simple HTML page for non-API routes
        return res.status(200).set({ "Content-Type": "text/html" }).end(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Parent Helper API</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
              .method { color: #007cba; font-weight: bold; }
              .url { color: #333; font-family: monospace; }
            </style>
          </head>
          <body>
            <h1>Parent Helper API</h1>
            <p>Welcome to the Parent Helper API server. Here are the available endpoints:</p>
            
            <div class="endpoint">
              <span class="method">GET</span> <span class="url">/api/classes</span> - Get all classes
            </div>
            <div class="endpoint">
              <span class="method">GET</span> <span class="url">/api/classes/featured</span> - Get featured classes
            </div>
            <div class="endpoint">
              <span class="method">GET</span> <span class="url">/api/classes/town/:town</span> - Get classes by town
            </div>
            <div class="endpoint">
              <span class="method">GET</span> <span class="url">/api/classes/category/:category</span> - Get classes by category
            </div>
            <div class="endpoint">
              <span class="method">GET</span> <span class="url">/api/classes/:id</span> - Get single class
            </div>
            <div class="endpoint">
              <span class="method">GET</span> <span class="url">/api/classes/search/:term</span> - Search classes
            </div>
            <div class="endpoint">
              <span class="method">GET</span> <span class="url">/api/categories</span> - Get available categories
            </div>
            <div class="endpoint">
              <span class="method">GET</span> <span class="url">/api/towns</span> - Get available towns
            </div>
            <div class="endpoint">
              <span class="method">GET</span> <span class="url">/api/health</span> - Health check
            </div>
            
            <p><strong>Example:</strong> <a href="/api/classes">/api/classes</a></p>
          </body>
          </html>
        `);
      }

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
