import type { Express } from "express";
import { createServer, type Server } from "http";
import { readFileSync } from "fs";
import { join } from "path";
import { storage } from "./storage";
import { pool } from "./db";
import { searchSchema, insertNewsletterSchema, listClassSchema, bookingFormSchema, insertBookingRequestSchema } from "@shared/schema";
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
      console.error("Database error:", error);
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

  // Franchise directory endpoints
  app.get("/api/franchise-stats", async (req, res) => {
    try {
      const query = `
        SELECT 
          provider_name,
          COUNT(*) as total_classes,
          COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as enhanced_classes,
          ROUND(100.0 * COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) / COUNT(*), 1) as percentage_enhanced,
          COUNT(DISTINCT town) as towns_covered
        FROM classes 
        WHERE provider_name IN ('Baby Sensory', 'Water Babies', 'Monkey Music', 'Sing and Sign', 'Toddler Sense', 'Tumble Tots')
        GROUP BY provider_name
        ORDER BY total_classes DESC
      `;
      
      const result = await pool.query(query);
      
      // Get sample locations for each provider
      const statsWithSamples = await Promise.all(
        result.rows.map(async (stat) => {
          const sampleQuery = `
            SELECT venue, town, latitude, longitude
            FROM classes 
            WHERE provider_name = $1 
            AND latitude IS NOT NULL 
            AND longitude IS NOT NULL
            ORDER BY RANDOM()
            LIMIT 3
          `;
          
          const sampleResult = await pool.query(sampleQuery, [stat.provider_name]);
          
          return {
            ...stat,
            sample_locations: sampleResult.rows
          };
        })
      );
      
      res.json(statsWithSamples);
    } catch (error) {
      console.error("Error fetching franchise stats:", error);
      res.status(500).json({ message: "Failed to fetch franchise statistics" });
    }
  });

  app.get("/api/franchise-classes", async (req, res) => {
    try {
      const { provider } = req.query;
      
      if (!provider) {
        return res.status(400).json({ message: "Provider parameter is required" });
      }
      
      const query = `
        SELECT 
          id, name, description, venue, town, postcode, address,
          latitude, longitude, dayOfWeek, time, 
          ageGroupMin, ageGroupMax, price, website
        FROM classes 
        WHERE provider_name = $1
        ORDER BY town, venue
      `;
      
      const result = await pool.query(query, [provider]);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching franchise classes:", error);
      res.status(500).json({ message: "Failed to fetch franchise classes" });
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

  // Preview placeholder page
  app.get("/preview", (req, res) => {
    res.sendFile("preview.html", { root: "." });
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

  // Revolutionary Booking System API Routes
  
  // Create booking request (handles both instant booking and availability checks)
  app.post("/api/booking-requests", async (req, res) => {
    try {
      const bookingData = bookingFormSchema.parse(req.body);
      const { classId } = req.body;

      // Get class details
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Calculate pricing
      let totalAmount = 0;
      if (bookingData.bookingType === 'block' && classItem.blockBookingAvailable && classItem.blockBookingPrice) {
        totalAmount = Number(classItem.blockBookingPrice);
      } else {
        totalAmount = Number(classItem.bookingPrice || 0) * bookingData.sessionsRequested;
      }

      const commissionRate = 0.07; // 7% commission
      const commissionAmount = totalAmount * commissionRate;
      const providerAmount = totalAmount - commissionAmount;

      // Create booking request
      const bookingRequest = await storage.createBookingRequest({
        classId,
        providerId: classItem.providerId || 0,
        parentName: bookingData.parentName,
        parentEmail: bookingData.parentEmail,
        parentPhone: bookingData.parentPhone,
        parentWhatsapp: bookingData.parentWhatsapp,
        childName: bookingData.childName,
        childAge: bookingData.childAge,
        bookingType: bookingData.bookingType,
        sessionsRequested: bookingData.sessionsRequested,
        preferredDate: new Date(bookingData.preferredDate),
        specialRequirements: bookingData.specialRequirements,
        totalAmount: totalAmount.toString(),
        commissionAmount: commissionAmount.toString(),
        providerAmount: providerAmount.toString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      // For instant bookings, auto-approve and create booking
      if (classItem.bookingType === 'instant') {
        const confirmationCode = `PH${Date.now().toString().slice(-6)}`;
        
        const booking = await storage.createBooking({
          bookingRequestId: bookingRequest.id,
          classId,
          providerId: classItem.providerId || 0,
          parentName: bookingData.parentName,
          parentEmail: bookingData.parentEmail,
          childName: bookingData.childName,
          sessionDate: new Date(bookingData.preferredDate),
          sessionsBooked: bookingData.sessionsRequested,
          totalPaid: totalAmount.toString(),
          confirmationCode,
        });

        return res.json({
          success: true,
          type: 'instant',
          confirmationCode,
          bookingId: booking.id,
          message: 'Booking confirmed instantly!'
        });
      }

      // For availability checks, send notification to provider
      // TODO: Send WhatsApp/Email notification to provider
      
      res.json({
        success: true,
        type: 'inquiry',
        requestId: bookingRequest.id,
        message: 'Availability check sent to provider. You\'ll hear back within 2 hours.'
      });

    } catch (error: any) {
      console.error('Booking request error:', error);
      res.status(500).json({ 
        message: error.message || "Failed to process booking request" 
      });
    }
  });

  // Get booking requests for a provider
  app.get("/api/provider/booking-requests", async (req, res) => {
    try {
      // TODO: Add provider authentication
      const requests = await storage.getBookingRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking requests" });
    }
  });

  // Approve/decline booking request
  app.post("/api/booking-requests/:id/respond", async (req, res) => {
    try {
      const { id } = req.params;
      const { action, response } = req.body; // 'approve' or 'decline'

      const bookingRequest = await storage.getBookingRequest(Number(id));
      if (!bookingRequest) {
        return res.status(404).json({ message: "Booking request not found" });
      }

      if (action === 'approve') {
        const confirmationCode = `PH${Date.now().toString().slice(-6)}`;
        
        const booking = await storage.createBooking({
          bookingRequestId: bookingRequest.id,
          classId: bookingRequest.classId,
          providerId: bookingRequest.providerId,
          parentName: bookingRequest.parentName,
          parentEmail: bookingRequest.parentEmail,
          childName: bookingRequest.childName,
          sessionDate: bookingRequest.preferredDate!,
          sessionsBooked: bookingRequest.sessionsRequested,
          totalPaid: bookingRequest.totalAmount,
          confirmationCode,
        });

        await storage.updateBookingRequestStatus(Number(id), 'approved', response);
        
        // TODO: Send confirmation email to parent
        
        res.json({
          success: true,
          message: 'Booking approved and confirmed',
          confirmationCode,
          bookingId: booking.id
        });
      } else {
        await storage.updateBookingRequestStatus(Number(id), 'declined', response);
        
        // TODO: Send decline notification to parent
        
        res.json({
          success: true,
          message: 'Booking request declined'
        });
      }

    } catch (error: any) {
      res.status(500).json({ 
        message: error.message || "Failed to respond to booking request" 
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

  // AI Chatbot endpoint
  app.post("/ask", async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ answer: "Please ask a question about baby and toddler classes." });
      }

      // Search for relevant classes based on the question
      const searchTerms = question.toLowerCase();
      let searchParams: any = {};
      
      // Extract location from question
      const locationKeywords = ['andover', 'winchester', 'basingstoke', 'southampton', 'portsmouth', 'fareham', 'eastleigh', 'fleet', 'aldershot', 'guildford', 'woking', 'reading', 'salisbury', 'bournemouth', 'poole'];
      for (const location of locationKeywords) {
        if (searchTerms.includes(location)) {
          searchParams.postcode = location;
          break;
        }
      }
      
      // Extract age-related keywords
      if (searchTerms.includes('baby') || searchTerms.includes('newborn') || searchTerms.includes('0-6 months')) {
        searchParams.ageGroup = 'baby';
      } else if (searchTerms.includes('toddler') || searchTerms.includes('1 year') || searchTerms.includes('2 year')) {
        searchParams.ageGroup = 'toddler';
      }
      
      // Extract activity categories
      if (searchTerms.includes('swim') || searchTerms.includes('water')) {
        searchParams.category = 'swimming';
      } else if (searchTerms.includes('music') || searchTerms.includes('sing')) {
        searchParams.category = 'music';
      } else if (searchTerms.includes('yoga') || searchTerms.includes('movement')) {
        searchParams.category = 'yoga';
      } else if (searchTerms.includes('sensory') || searchTerms.includes('play')) {
        searchParams.category = 'sensory';
      }

      // Search using the same logic as the search endpoint
      try {
        console.log('Chatbot search params:', searchParams);
        
        // Use the same search logic as /api/classes/search
        let params = searchParams;
        
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
            
            // Try exact match first
            for (const town of majorTowns) {
              if (town.name.toLowerCase() === normalizedSearch) {
                params.postcode = town.postcode;
                break;
              }
            }
          }
        }
        
        // Use smart search to find classes in your authentic database
        let smartSearchParams = params;
        
        // If we have sensory in the query, also try className search
        if (searchTerms.includes('sensory') || searchTerms.includes('baby sensory')) {
          smartSearchParams.className = question;
        }
        
        // Search for classes using existing search methods
        const classes = await storage.searchByClassName(question);
        console.log(`Chatbot found ${classes.length} classes using className search`);
        
        // Generate response with actual search results
        let answer = "";
        
        if (classes.length === 0) {
          answer = "I couldn't find any classes matching your search. Try asking about classes in a different town or with different activities. For example: 'baby classes in Southampton' or 'toddler music classes'.";
        } else {
          const topClasses = classes.slice(0, 8); // Show up to 8 results
          
          answer = `I found ${classes.length} classes matching your search:\n\n`;
          
          topClasses.forEach((cls, index) => {
            // Create clean, clickable links to class pages
            const classUrl = `/class/${cls.id}`;
            answer += `• [${cls.name}](${classUrl}) - ${cls.town} (${cls.dayOfWeek} ${cls.time})\n`;
          });
          
          if (classes.length > 8) {
            answer += `\n[View all ${classes.length} results →](/search)`;
          }
        }
        
        res.json({ answer });
        
      } catch (searchError) {
        console.error('Chatbot search error:', searchError);
        
        // Fallback response if search fails
        let answer = "I'm having trouble searching the database right now, but I can help you find the right classes! ";
        
        if (searchParams.postcode) {
          answer += `For classes in ${searchParams.postcode.charAt(0).toUpperCase() + searchParams.postcode.slice(1)}, `;
        }
        
        if (searchParams.ageGroup === 'baby') {
          answer += "try looking for Baby Sensory, swimming lessons, or baby massage classes. ";
        } else if (searchParams.ageGroup === 'toddler') {
          answer += "try looking for music classes, soft play, or toddler activities. ";
        }
        
        if (searchParams.category) {
          answer += `For ${searchParams.category} activities, check local community centers and leisure facilities. `;
        }
        
        answer += "Use the search function above to find specific classes in your area.";
        
        res.json({ answer });
      }
      
    } catch (error) {
      console.error('Chatbot error:', error);
      res.status(500).json({ 
        answer: "Sorry, I'm having trouble right now. Please try asking about baby and toddler classes in your area." 
      });
    }
  });

  // Simple test page
  app.get("/test", (req, res) => {
    res.send('<html><body><h1>Test Page Working</h1><p>This is a simple test.</p></body></html>');
  });

  // Serve static HTML file directly
  app.get("/parent-helper", (req, res) => {
    try {
      const htmlContent = readFileSync('./public/parent-helper.html', 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
    } catch (error) {
      console.error('Error serving parent-helper.html:', error);
      res.status(404).send('File not found');
    }
  });

  // Alternative route for testing
  app.get("/landing", (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Parent Helper - Coming Soon</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background: #F5F1ED;
            line-height: 1.6;
        }

        .header {
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px 0;
        }

        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            text-align: center;
            padding: 0 20px;
        }

        .logo {
            display: inline-flex;
            align-items: center;
            gap: 15px;
        }

        .logo-text {
            font-size: 2rem;
            font-weight: bold;
            color: #4A6B66;
        }

        .hero {
            background: linear-gradient(135deg, #7FB3B3, #B8A5C7, #F4A688, #7FB3B3, #F5F1ED);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            text-align: center;
        }

        .hero-container {
            max-width: 900px;
            margin: 0 auto;
        }

        .hero-title {
            font-size: 4rem;
            font-weight: bold;
            margin-bottom: 20px;
            color: #1f2937;
        }

        .hero-subtitle {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 15px;
            color: #1f2937;
        }

        .hero-description {
            font-size: 1.25rem;
            margin-bottom: 30px;
            color: #374151;
        }

        .features-box {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid #e5e7eb;
        }

        .features-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 25px;
            color: #1f2937;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            text-align: left;
        }

        .feature-item {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 15px;
        }

        .feature-icon {
            font-size: 1.5rem;
        }

        .feature-text {
            font-size: 1.1rem;
            color: #374151;
        }

        .contact-form {
            background: white;
            border-radius: 15px;
            padding: 30px;
            color: #374151;
            max-width: 400px;
            margin: 0 auto;
        }

        .contact-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 15px;
            color: #4A6B66;
        }

        .contact-description {
            color: #6b7280;
            margin-bottom: 25px;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-input, .form-select, .form-textarea {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 1rem;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
            outline: none;
            border-color: #4A6B66;
            box-shadow: 0 0 0 3px rgba(74, 107, 102, 0.1);
        }

        .form-textarea {
            resize: none;
            font-family: inherit;
        }

        .submit-button {
            width: 100%;
            background: #F4A688;
            color: white;
            font-weight: 600;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
        }

        .submit-button:hover {
            background: #e89970;
        }

        .form-status {
            margin-top: 15px;
            text-align: center;
            display: none;
            color: #059669;
        }

        .form-privacy {
            font-size: 0.9rem;
            color: #6b7280;
            margin-top: 15px;
        }

        .features-section {
            padding: 80px 20px;
            background: white;
        }

        .features-section-container {
            max-width: 1200px;
            margin: 0 auto;
            text-align: center;
        }

        .features-section-title {
            font-size: 2.5rem;
            font-weight: bold;
            color: #4A6B66;
            margin-bottom: 15px;
        }

        .features-section-description {
            font-size: 1.25rem;
            color: #374151;
            max-width: 800px;
            margin: 0 auto 60px;
        }

        .features-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }

        .feature-card {
            text-align: center;
            padding: 25px;
            border-radius: 15px;
            border: 1px solid rgba(127, 179, 179, 0.2);
        }

        .feature-card.sage {
            background: linear-gradient(to bottom right, rgba(127, 179, 179, 0.1), #F5F1ED);
        }

        .feature-card.coral {
            background: linear-gradient(to bottom right, rgba(244, 166, 136, 0.2), #F5F1ED);
            border-color: rgba(244, 166, 136, 0.3);
        }

        .feature-card.lavender {
            background: linear-gradient(to bottom right, rgba(184, 165, 199, 0.2), #F5F1ED);
            border-color: rgba(184, 165, 199, 0.3);
        }

        .feature-card-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            font-size: 1.5rem;
            color: white;
        }

        .feature-card-icon.teal {
            background: #4A6B66;
        }

        .feature-card-icon.coral-bg {
            background: #F4A688;
        }

        .feature-card-icon.lavender-bg {
            background: #B8A5C7;
        }

        .feature-card-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #4A6B66;
            margin-bottom: 12px;
        }

        .feature-card-text {
            color: #374151;
        }

        .contact-section {
            padding: 60px 20px;
            background: #F5F1ED;
        }

        .contact-section-container {
            max-width: 1000px;
            margin: 0 auto;
            text-align: center;
        }

        .contact-section-title {
            font-size: 2rem;
            font-weight: bold;
            color: #4A6B66;
            margin-bottom: 30px;
        }

        .contact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }

        .contact-card-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #4A6B66;
            margin-bottom: 15px;
        }

        .contact-card-text {
            color: #374151;
            margin-bottom: 15px;
        }

        .contact-link {
            color: #4A6B66;
            font-weight: 600;
            text-decoration: none;
        }

        .contact-link:hover {
            color: #7FB3B3;
        }

        .contact-button {
            color: #4A6B66;
            font-weight: 600;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1rem;
        }

        .contact-button:hover {
            color: #7FB3B3;
        }

        .footer {
            background: #4A6B66;
            color: white;
            padding: 50px 20px;
            text-align: center;
        }

        .footer-container {
            max-width: 1000px;
            margin: 0 auto;
        }

        .footer-title {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 20px;
        }

        .footer-description {
            color: rgba(255, 255, 255, 0.8);
            max-width: 600px;
            margin: 0 auto 30px;
        }

        .footer-bottom {
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            padding-top: 25px;
        }

        .footer-copyright {
            color: rgba(255, 255, 255, 0.6);
        }

        @media (max-width: 768px) {
            .hero-title {
                font-size: 3rem;
            }
            .features-grid {
                grid-template-columns: 1fr;
            }
            .features-cards {
                grid-template-columns: 1fr;
            }
            .contact-grid {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 480px) {
            .hero-title {
                font-size: 2.5rem;
            }
            .logo-text {
                font-size: 1.5rem;
            }
            .contact-form {
                padding: 25px;
            }
        }
    </style>
</head>

<body>
    <header class="header">
        <div class="header-content">
            <div class="logo">
                <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <!-- Parent figure (lavender) - left side -->
                    <circle cx="30" cy="20" r="10" fill="#B8A5C7" stroke="#4A6B66" stroke-width="2"/>
                    <path d="M20 30 Q30 50 40 30 Q35 45 30 60 Q25 45 20 30 Z" fill="#B8A5C7" stroke="#4A6B66" stroke-width="2"/>
                    
                    <!-- Child figure (sage) - right side -->
                    <circle cx="70" cy="25" r="8" fill="#7FB3B3" stroke="#4A6B66" stroke-width="2"/>
                    <path d="M62 33 Q70 48 78 33 Q75 43 70 55 Q65 43 62 33 Z" fill="#7FB3B3" stroke="#4A6B66" stroke-width="2"/>
                    
                    <!-- Heart in center (coral) -->
                    <path d="M45 40 Q47 37 50 40 Q53 37 55 40 Q55 45 50 52 Q45 45 45 40 Z" fill="#F4A688" stroke="#4A6B66" stroke-width="1.5"/>
                    
                    <!-- Arms embracing around heart -->
                    <path d="M40 30 Q47 38 55 33" stroke="#4A6B66" stroke-width="3" fill="none" stroke-linecap="round"/>
                    <path d="M60 30 Q53 38 45 33" stroke="#4A6B66" stroke-width="3" fill="none" stroke-linecap="round"/>
                </svg>
                <h1 class="logo-text">Parent Helper</h1>
            </div>
        </div>
    </header>

    <main>
        <section class="hero">
            <div class="hero-container">
                <h1 class="hero-title">Coming Soon</h1>
                <h2 class="hero-subtitle">Parent Helper</h2>
                <p class="hero-description">The UK's Premier Family Activity Directory</p>
                
                <div class="features-box">
                    <h3 class="features-title">What We're Building</h3>
                    <div class="features-grid">
                        <div>
                            <div class="feature-item">
                                <span class="feature-icon">👶</span>
                                <span class="feature-text">Baby & Toddler Classes</span>
                            </div>
                            <div class="feature-item">
                                <span class="feature-icon">🎓</span>
                                <span class="feature-text">After School Clubs</span>
                            </div>
                            <div class="feature-item">
                                <span class="feature-icon">📸</span>
                                <span class="feature-text">Photography & Keepsakes</span>
                            </div>
                        </div>
                        <div>
                            <div class="feature-item">
                                <span class="feature-icon">🎁</span>
                                <span class="feature-text">Free Baby Samples</span>
                            </div>
                            <div class="feature-item">
                                <span class="feature-icon">❤️</span>
                                <span class="feature-text">Additional Needs Support</span>
                            </div>
                            <div class="feature-item">
                                <span class="feature-icon">👥</span>
                                <span class="feature-text">Parent Support Groups</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="contact-form">
                    <h3 class="contact-title">Get in Touch</h3>
                    <p class="contact-description">
                        Be the first to know when we launch, or send us your questions and suggestions.
                    </p>
                    <form id="contactForm">
                        <div class="form-group">
                            <input type="text" name="name" placeholder="Your name" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <input type="email" name="email" placeholder="Your email address" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <select name="type" class="form-select" required>
                                <option value="">Select message type</option>
                                <option value="early-access">Early Access Notification</option>
                                <option value="provider">I'm an Activity Provider</option>
                                <option value="question">General Question</option>
                                <option value="suggestion">Suggestion</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <textarea name="message" rows="3" placeholder="Your message (optional)" class="form-textarea"></textarea>
                        </div>
                        <button type="submit" class="submit-button">Send Message</button>
                    </form>
                    <div id="formStatus" class="form-status"></div>
                    <p class="form-privacy">No spam, ever. We respect your privacy.</p>
                </div>
            </div>
        </section>

        <section class="features-section">
            <div class="features-section-container">
                <h2 class="features-section-title">What Makes Parent Helper Special</h2>
                <p class="features-section-description">
                    We're building the most comprehensive and user-friendly platform for UK families to discover activities, services, and support.
                </p>

                <div class="features-cards">
                    <div class="feature-card sage">
                        <div class="feature-card-icon teal">🗺️</div>
                        <h3 class="feature-card-title">Location-Based Search</h3>
                        <p class="feature-card-text">
                            Find activities and services near you with our advanced postcode search and interactive maps.
                        </p>
                    </div>

                    <div class="feature-card coral">
                        <div class="feature-card-icon coral-bg">✨</div>
                        <h3 class="feature-card-title">Curated Quality</h3>
                        <p class="feature-card-text">
                            Every activity and service is carefully reviewed and verified to ensure the highest standards for your family.
                        </p>
                    </div>

                    <div class="feature-card lavender">
                        <div class="feature-card-icon lavender-bg">🎯</div>
                        <h3 class="feature-card-title">Age-Specific Filtering</h3>
                        <p class="feature-card-text">
                            Filter activities by your child's exact age and developmental stage for perfect matches.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <section class="contact-section">
            <div class="contact-section-container">
                <h2 class="contact-section-title">Get In Touch</h2>
                <div class="contact-grid">
                    <div>
                        <h3 class="contact-card-title">For Activity Providers</h3>
                        <p class="contact-card-text">
                            Want to list your classes or services? We'd love to feature quality providers on our platform.
                        </p>
                        <a href="mailto:notification@parenthelper.co.uk" class="contact-link">
                            notification@parenthelper.co.uk
                        </a>
                    </div>
                    <div>
                        <h3 class="contact-card-title">For Parents</h3>
                        <p class="contact-card-text">
                            Have questions, suggestions, or want early access? We'd love to hear from you!
                        </p>
                        <button onclick="scrollToContact()" class="contact-button">
                            Use our contact form above
                        </button>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="footer-container">
            <h3 class="footer-title">Parent Helper</h3>
            <p class="footer-description">
                The UK's premier directory for family activities and services. 
                Helping parents discover the best experiences for their children across the United Kingdom.
            </p>
            <div class="footer-bottom">
                <p class="footer-copyright">
                    © 2024 Parent Helper. Coming Soon to parenthelper.co.uk
                </p>
            </div>
        </div>
    </footer>

    <script>
        document.getElementById('contactForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const type = formData.get('type');
            const message = formData.get('message');
            
            const subject = 'Parent Helper Contact: ' + type;
            const body = 'Name: ' + name + '\\nEmail: ' + email + '\\nType: ' + type + '\\n\\nMessage:\\n' + (message || 'No additional message');
            const mailtoLink = 'mailto:notification@parenthelper.co.uk?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
            
            window.location.href = mailtoLink;
            
            const statusDiv = document.getElementById('formStatus');
            statusDiv.textContent = 'Opening your email client...';
            statusDiv.style.display = 'block';
            
            setTimeout(function() {
                document.getElementById('contactForm').reset();
                statusDiv.style.display = 'none';
            }, 3000);
        });

        function scrollToContact() {
            document.getElementById('contactForm').scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
            
            setTimeout(function() {
                document.querySelector('#contactForm input[name="name"]').focus();
            }, 500);
        }
    </script>
</body>
</html>`);
  });

  const httpServer = createServer(app);
  return httpServer;
}
