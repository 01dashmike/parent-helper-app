import dotenv from 'dotenv';
dotenv.config();

console.log("🧪 index.ts has been loaded");
console.log("✅ index.ts is running...");

import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes/index.js"; // ✅ No .ts extension needed";
import { setupVite, serveStatic } from "./vite.js";
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

    // Register API routes first
    const server = await registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });

    // Serve frontend for non-API routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    const port = 3000;
    const host = '127.0.0.1';
    const serverInstance = server.listen(port, host, () => {
      console.log(`🚀 Server is running on http://${host}:${port}`);
    });

    // Handle port conflicts gracefully
    serverInstance.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use.`);
        console.error('To free it, run: lsof -i :3000 and kill -9 <PID>');
        process.exit(1);
      } else {
        throw err;
      }
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
})();