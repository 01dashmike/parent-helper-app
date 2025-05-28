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
  serviceType: text("service_type").default("classes").notNull(), // classes, services, clubs
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count").default(0),
  popularity: integer("popularity").default(0), // for sorting
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Booking system fields
  bookingEnabled: boolean("booking_enabled").default(false).notNull(),
  bookingType: text("booking_type").default("inquiry"), // 'instant', 'inquiry'
  maxCapacity: integer("max_capacity"),
  currentBookings: integer("current_bookings").default(0),
  bookingPrice: decimal("booking_price", { precision: 10, scale: 2 }),
  blockBookingAvailable: boolean("block_booking_available").default(false),
  blockBookingPrice: decimal("block_booking_price", { precision: 10, scale: 2 }),
  blockBookingSessions: integer("block_booking_sessions"),
  cancellationPolicy: text("cancellation_policy"),
  providerId: integer("provider_id"), // references providers table
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

// Booking system providers table
export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  whatsappNumber: text("whatsapp_number"),
  stripeAccountId: text("stripe_account_id"), // for commission payments
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("7.00"),
  bookingEnabled: boolean("booking_enabled").default(false),
  autoApproveBookings: boolean("auto_approve_bookings").default(false),
  responseTimeHours: integer("response_time_hours").default(2),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Booking requests table
export const bookingRequests = pgTable("booking_requests", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  providerId: integer("provider_id").notNull(),
  parentName: text("parent_name").notNull(),
  parentEmail: text("parent_email").notNull(),
  parentPhone: text("parent_phone"),
  parentWhatsapp: text("parent_whatsapp"),
  childName: text("child_name").notNull(),
  childAge: integer("child_age").notNull(), // in months
  bookingType: text("booking_type").notNull(), // 'single', 'block'
  sessionsRequested: integer("sessions_requested").default(1),
  preferredDate: timestamp("preferred_date"),
  specialRequirements: text("special_requirements"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  providerAmount: decimal("provider_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'declined', 'expired'
  paymentStatus: text("payment_status").default("pending").notNull(), // 'pending', 'paid', 'refunded'
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  providerResponse: text("provider_response"),
  respondedAt: timestamp("responded_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Confirmed bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingRequestId: integer("booking_request_id").notNull(),
  classId: integer("class_id").notNull(),
  providerId: integer("provider_id").notNull(),
  parentName: text("parent_name").notNull(),
  parentEmail: text("parent_email").notNull(),
  childName: text("child_name").notNull(),
  sessionDate: timestamp("session_date").notNull(),
  sessionsBooked: integer("sessions_booked").default(1),
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).notNull(),
  confirmationCode: text("confirmation_code").notNull(),
  status: text("status").default("confirmed").notNull(), // 'confirmed', 'cancelled', 'completed'
  reminderSent: boolean("reminder_sent").default(false),
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
  postcode: z.string().default(""),
  className: z.string().optional(), // Smart search by class name
  ageGroup: z.string().optional(),
  category: z.string().optional(),
  serviceType: z.string().optional(), // classes, services, clubs
  priceFilter: z.string().optional(),
  dayOfWeek: z.string().optional(), // Monday, Tuesday, etc.
  radius: z.coerce.number().default(10),
  includeInactive: z.coerce.boolean().default(false),
}).refine(
  (data) => data.postcode || data.className,
  {
    message: "Either postcode or className must be provided",
  }
);

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

// Booking system schemas
export const insertProviderSchema = createInsertSchema(providers).omit({
  id: true,
  createdAt: true,
});

export const insertBookingRequestSchema = createInsertSchema(bookingRequests).omit({
  id: true,
  createdAt: true,
  expiresAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

// Booking form schema for parents
export const bookingFormSchema = z.object({
  parentName: z.string().min(1, "Parent name is required"),
  parentEmail: z.string().email("Valid email is required"),
  parentPhone: z.string().min(10, "Phone number is required"),
  parentWhatsapp: z.string().optional(),
  childName: z.string().min(1, "Child's name is required"),
  childAge: z.coerce.number().min(0, "Child's age is required"),
  bookingType: z.enum(["single", "block"]),
  sessionsRequested: z.coerce.number().min(1, "At least 1 session required"),
  preferredDate: z.string().min(1, "Preferred date is required"),
  specialRequirements: z.string().optional(),
});

// Provider settings schema
export const providerSettingsSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  whatsappNumber: z.string().optional(),
  autoApproveBookings: z.boolean().default(false),
  responseTimeHours: z.coerce.number().min(1).max(24),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Newsletter = typeof newsletters.$inferSelect;
export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type Provider = typeof providers.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type BookingRequest = typeof bookingRequests.$inferSelect;
export type InsertBookingRequest = z.infer<typeof insertBookingRequestSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type SearchParams = z.infer<typeof searchSchema>;
export type ListClassData = z.infer<typeof listClassSchema>;
