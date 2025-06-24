import type { Express } from "express";
import { createServer, type Server } from "http";
import { ClassesService } from "../classes-service.js";

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
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const result = await ClassesService.getClassesByTown(town, limit);
      
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
        town
      });

    } catch (error) {
      console.error('Town classes route error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
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
  app.get("/api/categories", async (req, res) => {
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
  app.get("/api/towns", async (req, res) => {
    try {
      const result = await ClassesService.getTowns();
      
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
      console.error('Towns route error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  const server = createServer(app);
  return server;
};
