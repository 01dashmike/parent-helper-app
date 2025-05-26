import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  ageGroupMin: integer("age_group_min").notNull(), // in months
  ageGroupMax: integer("age_group_max").notNull(), // in months
  price: text("price"), // text to handle both numeric and descriptive prices
  isFeatured: boolean("is_featured").default(false).notNull(),
  venue: text("venue").notNull(),
  address: text("address").notNull(),
  postcode: text("postcode").notNull(),
  town: text("town").notNull(), // nearest major town with population > 15,000
  additionalTowns: text("additional_towns").array(), // nearby towns for expanded search
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 10, scale: 8 }),
  searchRadiusKm: integer("search_radius_km").default(5),
  // Transport and accessibility information
  parkingAvailable: boolean("parking_available"),
  parkingType: text("parking_type"), // 'free', 'paid', 'street', 'none'
  parkingNotes: text("parking_notes"),
  nearestTubeStation: text("nearest_tube_station"),
  nearestBusStops: text("nearest_bus_stops").array(),
  transportAccessibility: text("transport_accessibility"), // 'step-free', 'limited', 'difficult'
  venueAccessibility: text("venue_accessibility"), // 'wheelchair-accessible', 'buggy-friendly', 'step-free', 'stairs-only'
  accessibilityNotes: text("accessibility_notes"),
  dayOfWeek: text("day_of_week").notNull(),
  time: text("time").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  whatsappNumber: text("whatsapp_number"), // for direct contact (premium feature)
  website: text("website"),
  instagramHandle: text("instagram_handle"), // for fetching photos
  facebookPage: text("facebook_page"), // for fetching events
  category: text("category").notNull(), // music, swimming, sensory, yoga, etc.
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count").default(0),
  popularity: integer("popularity").default(0), // for sorting
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const newsletters = pgTable("newsletters", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  postcode: text("postcode"),
  isActive: boolean("is_active").default(true).notNull(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: text("category").default("general").notNull(),
  imageUrl: text("image_url"),
  readTimeMinutes: integer("read_time_minutes").default(5),
  isPublished: boolean("is_published").default(false).notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
});

export const insertNewsletterSchema = createInsertSchema(newsletters).omit({
  id: true,
  subscribedAt: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
});

export const searchSchema = z.object({
  postcode: z.string().min(1, "Postcode is required"),
  ageGroup: z.string().optional(),
  category: z.string().optional(),
  priceFilter: z.string().optional(),
  dayOfWeek: z.string().optional(), // Monday, Tuesday, etc.
  className: z.string().optional(), // Search by class name
  radius: z.coerce.number().default(10),
  includeInactive: z.coerce.boolean().default(false),
});

// Schema for "List Your Class" form
export const listClassSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  website: z.string().url().optional().or(z.literal("")),
  className: z.string().min(1, "Class name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  ageGroupMin: z.coerce.number().min(0, "Minimum age is required"),
  ageGroupMax: z.coerce.number().min(0, "Maximum age is required"),
  venue: z.string().min(1, "Venue is required"),
  address: z.string().min(1, "Address is required"),
  postcode: z.string().min(1, "Postcode is required"),
  dayOfWeek: z.string().min(1, "Day of week is required"),
  time: z.string().min(1, "Time is required"),
  price: z.string().optional(),
  additionalInfo: z.string().optional(),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Newsletter = typeof newsletters.$inferSelect;
export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type SearchParams = z.infer<typeof searchSchema>;
export type ListClassData = z.infer<typeof listClassSchema>;
