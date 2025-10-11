import type { Express } from "express";
import { createServer, type Server } from "http";
import { ClassesService } from "../classes-service.js";
import { claimListingSchema } from "@shared/schema";
import { sendClaimListingNotification } from "../email-service.js";
import { storage } from "../storage.js";
import localContextRouter from "./local-context.js";
import providersRouter from "./providers.js";
import franchisesRouter from "./franchises.js";

export const registerRoutes = async (app: Express): Promise<Server> => {
  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Test endpoint
  app.get("/api/test", (_req, res) => {
    res.json({ message: "Server is working!" });
  });

  // Get all classes with optional filtering
  app.get("/api/classes", async (req, res) => {
    try {
      const { town, category, ageGroup, featured, limit, offset } = req.query;

      const filters = {
        town: town as string,
        category: category as string,
        ageGroup: ageGroup as 'baby' | 'toddler' | 'preschool',
        featured: featured === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };

      const result = await ClassesService.getClasses(filters);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        data: result.data,
        count: result.data?.length || 0
      });

    } catch (error) {
      console.error('Classes route error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get featured classes
  app.get("/api/classes/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const result = await ClassesService.getFeaturedClasses(limit);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        data: result.data,
        count: result.data?.length || 0
      });

    } catch (error) {
      console.error('Featured classes route error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get classes by town
  app.get("/api/classes/town/:town", async (req, res) => {
    try {
      const { town } = req.params;
      const classes = await storage.searchClasses({
        postcode: town.toLowerCase(),
        includeInactive: false,
      });
      res.json(classes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  });

  // Get classes by category
  app.get("/api/classes/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const result = await ClassesService.getClassesByCategory(category, limit);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        data: result.data,
        count: result.data?.length || 0,
        category
      });

    } catch (error) {
      console.error('Category classes route error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get single class by ID
  app.get("/api/classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid class ID'
        });
      }

      const result = await ClassesService.getClassById(id);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('Single class route error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  app.post("/api/classes/:id/claim", async (req, res) => {
    try {
      const classId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(classId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid class ID",
        });
      }

      const validation = claimListingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid form data",
          fieldErrors: validation.error.flatten().fieldErrors,
        });
      }

      const classResult = await ClassesService.getClassById(classId);
      if (!classResult.success || !classResult.data) {
        return res.status(404).json({
          success: false,
          error: "Class not found",
        });
      }

      const { consentToEmail: _consent, ...claimData } = validation.data;

      const emailSent = await sendClaimListingNotification({
        classId,
        className: classResult.data.name,
        ...claimData,
      });

      return res.json({
        success: true,
        message: "Claim submitted",
        emailSent,
      });
    } catch (error) {
      console.error("Claim listing route error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  });

  // Search classes
  app.get("/api/classes/search/:term", async (req, res) => {
    try {
      const { term } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      if (!term || term.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Search term is required'
        });
      }

      const result = await ClassesService.searchClasses(term.trim(), limit);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        data: result.data,
        count: result.data?.length || 0,
        searchTerm: term
      });

    } catch (error) {
      console.error('Search classes route error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get available categories
  app.get("/api/categories", async (_req, res) => {
    try {
      const result = await ClassesService.getCategories();

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        data: result.data,
        count: result.data?.length || 0
      });

    } catch (error) {
      console.error('Categories route error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get available towns
  app.get("/api/towns", async (_req, res) => {
    try {
      const search = typeof _req.query.q === "string" ? _req.query.q : undefined;
      const limit = _req.query.limit ? parseInt(_req.query.limit as string, 10) : 25;
      const result = await ClassesService.getTowns(search, limit);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        data: result.data,
        count: result.data?.length || 0
      });
      // Force redeploy
    } catch (error) {
      console.error('Towns route error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
  app.use(franchisesRouter);
  app.use(providersRouter);
  app.use(localContextRouter);

  const server = createServer(app);
  return server;
};
