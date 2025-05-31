import { pgTable, text, serial, integer, boolean, decimal, timestamp, date, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  ageGroupMin: integer("age_group_min").notNull(),
  ageGroupMax: integer("age_group_max").notNull(),
  price: text("price"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  venue: text("venue").notNull(),
  address: text("address").notNull(),
  postcode: text("postcode").notNull(),
  town: text("town").notNull(),
  additionalTowns: text("additional_towns").array(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 10, scale: 8 }),
  searchRadiusKm: integer("search_radius_km").default(5),
  
  // Transport and accessibility
  parkingAvailable: boolean("parking_available"),
  parkingType: text("parking_type"),
  parkingNotes: text("parking_notes"),
  nearestTubeStation: text("nearest_tube_station"),
  nearestBusStops: text("nearest_bus_stops").array(),
  transportAccessibility: text("transport_accessibility"),
  venueAccessibility: text("venue_accessibility"),
  accessibilityNotes: text("accessibility_notes"),
  accessibilityFeatures: text("accessibility_features"),
  wheelchairAccessible: boolean("wheelchair_accessible"),
  
  // Schedule information
  dayOfWeek: text("day_of_week").notNull(),
  time: text("time").notNull(),
  timeOfDay: text("time_of_day"),
  timeCategory: text("time_category"),
  sessionDuration: text("session_duration"),
  weeklyScheduleSummary: text("weekly_schedule_summary"),
  sessionGroupId: text("session_group_id"),
  primarySession: boolean("primary_session"),
  sessionCount: integer("session_count"),
  sessionType: text("session_type"),
  
  // Contact information
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  phone: text("phone"),
  email: text("email"),
  whatsappNumber: text("whatsapp_number"),
  website: text("website"),
  instagramHandle: text("instagram_handle"),
  facebookPage: text("facebook_page"),
  socialMedia: text("social_media"),
  
  // Categories and classification
  category: text("category").notNull(),
  mainCategory: text("main_category"),
  subcategory: text("subcategory"),
  serviceType: text("service_type").default("classes").notNull(),
  ageAppropriate: text("age_appropriate"),
  ageSpecificSession: text("age_specific_session"),
  ageRestrictions: text("age_restrictions"),
  
  // Rating and reviews
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count").default(0),
  userRatingsTotal: integer("user_ratings_total"),
  businessRating: decimal("business_rating", { precision: 3, scale: 2 }),
  reviewInfo: text("review_info"),
  reviewSummary: text("review_summary"),
  popularity: integer("popularity").default(0),
  
  // Status and verification
  isActive: boolean("is_active").default(true).notNull(),
  verificationStatus: text("verification_status"),
  lastVerified: timestamp("last_verified"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Booking system fields
  bookingEnabled: boolean("booking_enabled").default(false).notNull(),
  bookingType: text("booking_type").default("inquiry"),
  bookingEngineType: text("booking_engine_type"),
  bookingUrl: text("booking_url"),
  bookingLink: text("booking_link"),
  bookingEmail: text("booking_email"),
  bookingPhone: text("booking_phone"),
  bookingNotes: text("booking_notes"),
  bookingRequired: boolean("booking_required"),
  bookingAdvanceDays: integer("booking_advance_days"),
  advanceBookingRequired: boolean("advance_booking_required"),
  directBookingAvailable: boolean("direct_booking_available"),
  onlineBooking: boolean("online_booking"),
  onlinePaymentAccepted: boolean("online_payment_accepted"),
  registrationRequired: boolean("registration_required"),
  
  // Capacity and availability
  maxCapacity: integer("max_capacity"),
  minCapacity: integer("min_capacity"),
  currentBookings: integer("current_bookings").default(0),
  availableSpots: integer("available_spots"),
  currentAvailability: integer("current_availability"),
  classSize: integer("class_size"),
  groupSizeMin: integer("group_size_min"),
  groupSizeMax: integer("group_size_max"),
  maxParticipants: integer("max_participants"),
  
  // Pricing
  bookingPrice: decimal("booking_price", { precision: 10, scale: 2 }),
  pricePerSession: decimal("price_per_session", { precision: 10, scale: 2 }),
  priceDetails: text("price_details"),
  priceLevel: integer("price_level"),
  blockBookingAvailable: boolean("block_booking_available"),
  blockBookingPrices: text("block_booking_prices"),
  paymentMethods: text("payment_methods"),
  
  // Class features
  dropInAllowed: boolean("drop_in_allowed"),
  trialSessionAvailable: boolean("trial_session_available"),
  freeTrialAvailable: boolean("free_trial_available"),
  waitingList: boolean("waiting_list"),
  waitingListCount: integer("waiting_list_count"),
  waitlistAvailable: boolean("waitlist_available"),
  
  // Class details
  classFormat: text("class_format"),
  skillLevel: text("skill_level"),
  prerequisites: text("prerequisites"),
  equipmentProvided: boolean("equipment_provided"),
  outdoorActivities: boolean("outdoor_activities"),
  whatToBring: text("what_to_bring"),
  whatToExpect: text("what_to_expect"),
  classNotes: text("class_notes"),
  additionalInfo: text("additional_info"),
  
  // Provider information
  providerName: text("provider_name"),
  providerContact: text("provider_contact"),
  providerBio: text("provider_bio"),
  providerQualifications: text("provider_qualifications"),
  providerExperience: text("provider_experience"),
  instructorName: text("instructor_name"),
  instructorBio: text("instructor_bio"),
  instructorQualifications: text("instructor_qualifications"),
  staffQualifications: text("staff_qualifications"),
  
  // Policies and requirements
  cancellationPolicy: text("cancellation_policy"),
  refundPolicy: text("refund_policy"),
  specialRequirements: text("special_requirements"),
  insuranceRequired: boolean("insurance_required"),
  insuranceDetails: text("insurance_details"),
  safetyMeasures: text("safety_measures"),
  uniformRequired: boolean("uniform_required"),
  membershipRequired: boolean("membership_required"),
  
  // Discounts and offers
  siblingDiscounts: text("sibling_discounts"),
  multiChildDiscount: boolean("multi_child_discount"),
  earlyBirdDiscount: boolean("early_bird_discount"),
  familyDiscounts: text("family_discounts"),
  promotionalOffer: text("promotional_offer"),
  loyaltyProgram: boolean("loyalty_program"),
  referralDiscount: boolean("referral_discount"),
  
  // Schedule and timing
  seasonStartDate: date("season_start_date"),
  seasonEndDate: date("season_end_date"),
  courseDuration: text("course_duration"),
  termDates: text("term_dates"),
  fixedCourseDates: boolean("fixed_course_dates"),
  holidayClasses: boolean("holiday_classes"),
  
  // Family features
  parentParticipation: text("parent_participation"),
  dropOffAllowed: boolean("drop_off_allowed"),
  siblingFriendly: boolean("sibling_friendly"),
  disabilitySupport: text("disability_support"),
  languagesSpoken: text("languages_spoken"),
  
  // Media and visuals
  imageUrls: text("image_urls"),
  videoUrl: text("video_url"),
  virtualTourUrl: text("virtual_tour_url"),
  streetViewImageUrl: text("street_view_image_url"),
  
  // AI and analytics
  aiSummary: text("ai_summary"),
  aiTags: text("ai_tags"),
  aiQualityScore: real("ai_quality_score"),
  aiSentimentScore: real("ai_sentiment_score"),
  aiRecommendations: text("ai_recommendations"),
  aiLastAnalyzed: timestamp("ai_last_analyzed"),
  areasForImprovement: text("areas_for_improvement"),
  commonPositives: text("common_positives"),
  
  // Location data
  distanceFromSearch: real("distance_from_search"),
  
  providerId: integer("provider_id"),
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
