import dotenv from 'dotenv';
dotenv.config();

console.log("🧪 index.ts has been loaded");
console.log("✅ index.ts is running...");

import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";

const app = express();

// Log all requests
app.use((req, res, next) => {
  res.on("finish", () => {
    const logLine = `${req.method} ${req.originalUrl} ${res.statusCode}`;
    console.log(logLine.length > 80 ? logLine.slice(0, 79) + "…" : logLine);
  });
  next();
});

(async () => {
  try {
    console.log("✅ Entered async startup...");
    console.log("🚀 Server setup starting...");

    // Health check route
    app.get("/", (_req, res) => {
      res.send("✅ Server is live!");
    });

    // Register app routes
    const server = await registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });

    // Serve frontend
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    const port = 5000;
    server.listen(port, '127.0.0.1', () => {
      console.log(`🚀 Server is running on http://127.0.0.1:${port}`);
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
})();