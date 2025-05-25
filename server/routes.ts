import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchSchema, insertNewsletterSchema } from "@shared/schema";
import { z } from "zod";

// Google Sheets integration for server-side
interface SheetsClassData {
  town: string;
  name: string;
  ageRange: string;
  time: string;
  cost: string;
  link: string;
  tags: string;
}

async function fetchGoogleSheetsData(): Promise<SheetsClassData[]> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const sheetId = '1Eu-Ei6Pou3Q1K9wsVeoxpQNWSfT-bvNXiYNckZAq2u4';
  
  if (!apiKey) {
    console.warn('Google Sheets API key not configured');
    return [];
  }

  try {
    const range = 'Classes!A1:G1000'; // Fetch from Classes sheet
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Google Sheets API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const rows = data.values || [];

    return rows.map((row: string[]) => ({
      town: row[0] || '',
      name: row[1] || '',
      ageRange: row[2] || '',
      time: row[3] || '',
      cost: row[4] || '',
      link: row[5] || '',
      tags: row[6] || '',
    })).filter((item: SheetsClassData) => item.name && item.town);
  } catch (error) {
    console.error('Failed to fetch Google Sheets data:', error);
    return [];
  }
}

// Helper functions to transform Google Sheets data
function parseAgeRange(ageRange: string): { min: number; max: number } {
  // Parse age ranges like "0-6 months", "1-2 years", etc.
  const monthsMatch = ageRange.match(/(\d+)-(\d+)\s*months?/i);
  if (monthsMatch) {
    return { min: parseInt(monthsMatch[1]), max: parseInt(monthsMatch[2]) };
  }
  
  const yearsMatch = ageRange.match(/(\d+)-(\d+)\s*years?/i);
  if (yearsMatch) {
    return { min: parseInt(yearsMatch[1]) * 12, max: parseInt(yearsMatch[2]) * 12 };
  }
  
  // Default fallback
  return { min: 0, max: 60 };
}

function extractPrice(cost: string): string | null {
  if (cost.toLowerCase().includes('free') || cost.toLowerCase().includes('£0')) {
    return null;
  }
  
  const priceMatch = cost.match(/£?(\d+(?:\.\d{2})?)/);
  return priceMatch ? priceMatch[1] : null;
}

function extractDayFromTime(time: string): string {
  // Extract day of week from time string
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  for (const day of days) {
    if (time.toLowerCase().includes(day)) {
      return day.charAt(0).toUpperCase() + day.slice(1);
    }
  }
  return 'Monday'; // Default
}

function categorizeFromTags(tags: string): string {
  const tagLower = tags.toLowerCase();
  if (tagLower.includes('music') || tagLower.includes('sing')) return 'music';
  if (tagLower.includes('swim')) return 'swimming';
  if (tagLower.includes('yoga') || tagLower.includes('movement')) return 'yoga';
  if (tagLower.includes('sensory') || tagLower.includes('play')) return 'sensory';
  return 'general';
}

async function getPostcodeForTown(town: string): Promise<string> {
  // Simple mapping of towns to postcodes - in production this would use a proper geocoding service
  const townPostcodes: Record<string, string> = {
    'london': 'SW1A 1AA',
    'manchester': 'M1 1AA',
    'birmingham': 'B1 1AA',
    'leeds': 'LS1 1AA',
    'glasgow': 'G1 1AA',
    'liverpool': 'L1 1AA',
    'bristol': 'BS1 1AA',
    'edinburgh': 'EH1 1AA',
    'cardiff': 'CF1 1AA',
    'belfast': 'BT1 1AA',
    'cambridge': 'CB1 1AA',
    'oxford': 'OX1 1AA',
  };
  
  return townPostcodes[town.toLowerCase()] || 'SW1A 1AA';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Search classes
  app.get("/api/classes/search", async (req, res) => {
    try {
      console.log('Search request query:', req.query);
      const params = searchSchema.parse(req.query);
      console.log('Parsed search params:', params);
      const classes = await storage.searchClasses(params);
      console.log('Found classes:', classes.length);
      res.json(classes);
    } catch (error) {
      console.error('Search validation error:', error);
      res.status(400).json({ 
        message: "Invalid search parameters",
        error: error instanceof z.ZodError ? error.errors : String(error)
      });
    }
  });

  // Get all classes
  app.get("/api/classes", async (req, res) => {
    try {
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  // Get featured classes
  app.get("/api/classes/featured", async (req, res) => {
    try {
      const classes = await storage.getFeaturedClasses();
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured classes" });
    }
  });

  // Get classes by category
  app.get("/api/classes/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const classes = await storage.getClassesByCategory(category);
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes by category" });
    }
  });

  // Get single class
  app.get("/api/classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid class ID" });
      }
      
      const classItem = await storage.getClass(id);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      res.json(classItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch class" });
    }
  });

  // Google Places API proxy
  app.get("/api/google-places-proxy", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "URL parameter required" });
      }

      const response = await fetch(url);
      const data = await response.json();
      
      res.json(data);
    } catch (error) {
      console.error("Google Places API error:", error);
      res.status(500).json({ error: "Failed to fetch from Google Places API" });
    }
  });

  // Update class reviews from Google Places
  app.post("/api/classes/:id/update-reviews", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid class ID" });
      }

      const classItem = await storage.getClass(id);
      if (!classItem) {
        return res.status(404).json({ error: "Class not found" });
      }

      // Search for the business on Google Places
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Google Places API key not configured" });
      }

      const query = `${classItem.name} ${classItem.address}`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const place = data.results[0];
        const rating = place.rating ? place.rating.toString() : null;
        const reviewCount = place.user_ratings_total || 0;

        // Update the class with new review data
        const updatedClass = await storage.updateClass(id, {
          rating: rating,
          reviewCount: reviewCount
        });

        res.json({
          success: true,
          rating: rating,
          reviewCount: reviewCount,
          updatedClass: updatedClass
        });
      } else {
        res.status(404).json({ error: "Business not found on Google Places" });
      }

    } catch (error) {
      console.error("Error updating reviews:", error);
      res.status(500).json({ error: "Failed to update reviews" });
    }
  });

  // Bulk update all class reviews from Google Places
  app.post("/api/classes/update-all-reviews", async (req, res) => {
    try {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Google Places API key not configured" });
      }

      const allClasses = await storage.getAllClasses();
      const results = [];

      for (const classItem of allClasses) {
        try {
          const query = `${classItem.name} ${classItem.address}`;
          const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
          
          const response = await fetch(searchUrl);
          const data = await response.json();

          if (data.results && data.results.length > 0) {
            const place = data.results[0];
            const rating = place.rating ? place.rating.toString() : null;
            const reviewCount = place.user_ratings_total || 0;

            await storage.updateClass(classItem.id, {
              rating: rating,
              reviewCount: reviewCount
            });

            results.push({
              id: classItem.id,
              name: classItem.name,
              rating: rating,
              reviewCount: reviewCount,
              updated: true
            });
          } else {
            results.push({
              id: classItem.id,
              name: classItem.name,
              updated: false,
              reason: "Not found on Google Places"
            });
          }
        } catch (error) {
          results.push({
            id: classItem.id,
            name: classItem.name,
            updated: false,
            reason: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `Updated reviews for ${results.filter(r => r.updated).length} classes`,
        results: results
      });

    } catch (error) {
      console.error("Error bulk updating reviews:", error);
      res.status(500).json({ error: "Failed to bulk update reviews" });
    }
  });

  // Newsletter subscription
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const subscriptionData = insertNewsletterSchema.parse(req.body);
      const subscription = await storage.subscribeNewsletter(subscriptionData);
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid subscription data",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to subscribe to newsletter" });
    }
  });

  // Newsletter unsubscribe
  app.post("/api/newsletter/unsubscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const success = await storage.unsubscribeNewsletter(email);
      if (!success) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      res.json({ message: "Successfully unsubscribed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to unsubscribe" });
    }
  });

  // Get blog posts
  app.get("/api/blog/posts", async (req, res) => {
    try {
      const posts = await storage.getPublishedBlogPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Get single blog post by slug
  app.get("/api/blog/posts/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post || !post.isPublished) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  // Clear all classes
  app.post("/api/classes/clear", async (req, res) => {
    try {
      await storage.clearAllClasses();
      res.json({ message: "All classes cleared successfully" });
    } catch (error) {
      console.error('Failed to clear classes:', error);
      res.status(500).json({ message: "Failed to clear classes" });
    }
  });

  // Sync classes from Google Sheets
  app.post("/api/classes/sync", async (req, res) => {
    try {
      const sheetData = await fetchGoogleSheetsData();
      console.log('Fetched sheet data:', sheetData);
      
      // Clear existing data first
      await storage.clearAllClasses();
      
      // Transform sheet data to our class format
      for (const item of sheetData) {
        const ageRange = parseAgeRange(item.ageRange);
        const postcode = await getPostcodeForTown(item.town);
        
        const classData = {
          name: item.name,
          description: `${item.name} in ${item.town}. ${item.tags ? `Features: ${item.tags}` : ''}`,
          ageGroupMin: ageRange.min,
          ageGroupMax: ageRange.max,
          price: item.cost.toLowerCase().includes('free') ? null : extractPrice(item.cost),
          isFeatured: false,
          venue: item.town,
          address: item.town,
          postcode: postcode,
          latitude: null,
          longitude: null,
          dayOfWeek: extractDayFromTime(item.time),
          time: item.time,
          contactEmail: null,
          contactPhone: null,
          website: item.link || null,
          category: categorizeFromTags(item.tags),
          rating: null,
          reviewCount: 0,
          popularity: Math.floor(Math.random() * 100),
          isActive: true,
        };
        
        console.log('Creating class:', classData.name);
        await storage.createClass(classData);
      }
      
      res.json({ message: `Synced ${sheetData.length} classes from Google Sheets` });
    } catch (error) {
      console.error('Failed to sync classes:', error);
      res.status(500).json({ message: "Failed to sync classes from Google Sheets" });
    }
  });

  // Postcode validation and geocoding endpoint
  app.get("/api/postcode/:postcode", async (req, res) => {
    try {
      const { postcode } = req.params;
      
      // Basic postcode format validation
      const postcodeRegex = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;
      if (!postcodeRegex.test(postcode)) {
        return res.status(400).json({ 
          message: "Invalid postcode format. Please use format like 'SW1A 1AA'" 
        });
      }

      // Mock geocoding response - in production this would call a real geocoding API
      const mockGeocodingResponse = {
        postcode: postcode.toUpperCase(),
        latitude: 51.5074,
        longitude: -0.1278,
        district: "Westminster",
        region: "Greater London",
        country: "England"
      };

      res.json(mockGeocodingResponse);
    } catch (error) {
      res.status(500).json({ message: "Failed to validate postcode" });
    }
  });

  // Submit class listing
  app.post("/api/list-class", async (req, res) => {
    try {
      const validatedData = listClassSchema.parse(req.body);
      
      console.log("Class listing submitted:", validatedData);
      
      // Send email notification
      const emailSent = await sendClassSubmissionNotification({
        businessName: validatedData.businessName,
        contactName: validatedData.contactName,
        email: validatedData.email,
        phone: validatedData.phone,
        className: validatedData.className,
        description: validatedData.description,
        ageRange: `${validatedData.ageGroupMin}-${validatedData.ageGroupMax} years`,
        dayTime: `${validatedData.dayOfWeek} at ${validatedData.time}`,
        cost: validatedData.price || 'Not specified',
        postcode: validatedData.postcode,
        website: validatedData.website,
        socialMedia: validatedData.additionalInfo,
      });
      
      if (!emailSent) {
        console.warn("Failed to send email notification for class submission");
      }
      
      res.json({ 
        success: true, 
        message: "Class listing submitted successfully. We'll review your submission and get back to you soon!" 
      });
    } catch (error: any) {
      console.error("Error submitting class listing:", error);
      res.status(400).json({ 
        error: error.message || "Failed to submit class listing" 
      });
    }
  });

  // Newsletter automation endpoints
  app.post("/api/newsletter/send-campaign", async (req, res) => {
    try {
      console.log("Starting newsletter campaign...");
      const results = await sendNewsletterToAllSubscribers();
      
      res.json({
        success: true,
        message: `Newsletter campaign completed: ${results.sent} sent, ${results.failed} failed`,
        results: results
      });
    } catch (error: any) {
      console.error("Newsletter campaign failed:", error);
      res.status(500).json({
        error: "Failed to send newsletter campaign",
        details: error.message
      });
    }
  });

  // Send test newsletter to specific subscriber
  app.post("/api/newsletter/send-test", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find subscriber by email
      const subscribers = await storage.getNewsletterSubscribers();
      const subscriber = subscribers.find(s => s.email === email);
      
      if (!subscriber) {
        return res.status(404).json({ error: "Subscriber not found" });
      }

      const success = await sendNewsletterToSubscriber(subscriber);
      
      if (success) {
        res.json({ success: true, message: `Test newsletter sent to ${email}` });
      } else {
        res.status(500).json({ error: "Failed to send test newsletter" });
      }
    } catch (error: any) {
      console.error("Test newsletter failed:", error);
      res.status(500).json({
        error: "Failed to send test newsletter",
        details: error.message
      });
    }
  });

  // Trigger weekly newsletter schedule (in production this would be called by a cron job)
  app.post("/api/newsletter/weekly", async (req, res) => {
    try {
      await scheduleWeeklyNewsletter();
      res.json({
        success: true,
        message: "Weekly newsletter campaign triggered successfully"
      });
    } catch (error: any) {
      console.error("Weekly newsletter failed:", error);
      res.status(500).json({
        error: "Failed to trigger weekly newsletter",
        details: error.message
      });
    }
  });

  // Get newsletter statistics
  app.get("/api/newsletter/stats", async (req, res) => {
    try {
      const subscribers = await storage.getNewsletterSubscribers();
      
      // Group subscribers by postcode area for geographic distribution
      const postcodeAreas = subscribers.reduce((acc: any, sub) => {
        if (sub.postcode) {
          const area = sub.postcode.split(' ')[0];
          acc[area] = (acc[area] || 0) + 1;
        }
        return acc;
      }, {});

      const stats = {
        totalSubscribers: subscribers.length,
        subscribersWithPostcodes: subscribers.filter(s => s.postcode).length,
        topPostcodeAreas: Object.entries(postcodeAreas)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 10)
          .map(([area, count]) => ({ area, count }))
      };

      res.json(stats);
    } catch (error) {
      console.error("Failed to get newsletter stats:", error);
      res.status(500).json({ error: "Failed to get newsletter statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
