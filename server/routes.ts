import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchSchema, insertNewsletterSchema, listClassSchema } from "@shared/schema";
import { sendClassSubmissionNotification } from "./email-service";
import { parseSmartSearch } from "./smart-search";
// Newsletter automation temporarily disabled
// import { sendNewsletterToAllSubscribers, sendNewsletterToSubscriber, scheduleWeeklyNewsletter } from "./newsletter-automation";
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
  // Smart search endpoint for class names
  app.get("/api/smart-search", async (req, res) => {
    try {
      const classNameQuery = req.query.q as string;
      if (!classNameQuery) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      console.log(`Smart search for: "${classNameQuery}"`);
      const classes = await storage.searchByClassName(classNameQuery);
      console.log(`Found ${classes.length} classes for "${classNameQuery}"`);
      return res.json(classes);
    } catch (error) {
      console.error('Smart search error:', error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Search classes (supports both postcodes and town names)
  app.get("/api/classes/search", async (req, res) => {
    try {
      console.log('Search request query:', req.query);
      
      let params = searchSchema.parse(req.query);
      console.log('Initial search params:', params);
      
      // Handle smart search if className is provided
      if (params.className) {
        const smartSearchResult = parseSmartSearch(params.className);
        console.log('Smart search result:', smartSearchResult);
        
        // Apply smart search results to params
        if (smartSearchResult.category && !params.category) {
          params.category = smartSearchResult.category;
        }
        if (smartSearchResult.ageGroup && !params.ageGroup) {
          params.ageGroup = smartSearchResult.ageGroup;
        }
        
        // If className contains a location, extract it to postcode
        const locationKeywords = ['andover', 'winchester', 'basingstoke', 'southampton', 'portsmouth'];
        const searchText = params.className.toLowerCase();
        for (const location of locationKeywords) {
          if (searchText.includes(location) && !params.postcode) {
            params.postcode = location;
            break;
          }
        }
        
        console.log('Enhanced params after smart search:', params);
      }
      
      // Ensure we have either postcode or className for search
      if (!params.postcode && !params.className) {
        return res.status(400).json({ 
          message: "Either location or class name is required for search" 
        });
      }
      
      // If postcode doesn't look like a postcode, try to find it as a town name
      if (params.postcode) {
        const postcodePattern = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;
        const partialPostcodePattern = /^[A-Z]{1,2}[0-9]/i;
        
        if (!postcodePattern.test(params.postcode) && !partialPostcodePattern.test(params.postcode)) {
          // This looks like a town name, try to convert to postcode
          const normalizedSearch = params.postcode.toLowerCase().trim();
          
          // Define major towns directly in server for reliable lookup
          const majorTowns = [
            { name: "Winchester", postcode: "SO23" },
            { name: "Southampton", postcode: "SO14" },
            { name: "Portsmouth", postcode: "PO1" },
            { name: "Basingstoke", postcode: "RG21" },
            { name: "Andover", postcode: "SP10" },
            { name: "Fareham", postcode: "PO14" },
            { name: "Eastleigh", postcode: "SO50" },
            { name: "Fleet", postcode: "GU51" },
            { name: "Aldershot", postcode: "GU11" },
            { name: "Farnborough", postcode: "GU14" },
            { name: "Gosport", postcode: "PO12" },
            { name: "Havant", postcode: "PO9" },
            { name: "Waterlooville", postcode: "PO7" },
            { name: "Reading", postcode: "RG1" },
            { name: "Guildford", postcode: "GU1" },
            { name: "Woking", postcode: "GU21" },
            { name: "Salisbury", postcode: "SP1" },
            { name: "Bournemouth", postcode: "BH1" },
            { name: "Poole", postcode: "BH15" }
          ];
          
          let foundPostcode = null;
          
          // Try exact match first
          for (const town of majorTowns) {
            if (town.name.toLowerCase() === normalizedSearch) {
              foundPostcode = town.postcode;
              break;
            }
          }
          
          // Try partial match if no exact match
          if (!foundPostcode) {
            for (const town of majorTowns) {
              if (town.name.toLowerCase().startsWith(normalizedSearch)) {
                foundPostcode = town.postcode;
                break;
              }
            }
          }
          
          // Try contains match if still no match
          if (!foundPostcode) {
            for (const town of majorTowns) {
              if (town.name.toLowerCase().includes(normalizedSearch)) {
                foundPostcode = town.postcode;
                break;
              }
            }
          }
          
          if (foundPostcode) {
            console.log(`Converted town "${params.postcode}" to postcode "${foundPostcode}"`);
            params = { ...params, postcode: foundPostcode };
          }
        }
      }
      
      console.log('Final search params:', params);
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

  // Newsletter automation endpoints - temporarily disabled
  app.post("/api/newsletter/send-campaign", async (req, res) => {
    res.json({
      success: false,
      message: "Newsletter functionality temporarily disabled - SendGrid configuration needed"
    });
  });

  // Send test newsletter to specific subscriber - temporarily disabled
  app.post("/api/newsletter/send-test", async (req, res) => {
    res.json({
      success: false,
      message: "Newsletter functionality temporarily disabled - SendGrid configuration needed"
    });
  });

  // Trigger weekly newsletter schedule - temporarily disabled
  app.post("/api/newsletter/weekly", async (req, res) => {
    res.json({
      success: false,
      message: "Newsletter functionality temporarily disabled - SendGrid configuration needed"
    });
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
