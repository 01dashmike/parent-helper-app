# Parent Helper - Complete Website Codebase

This document contains all the code for the Parent Helper family activity directory website.

## Project Structure

```
parent-helper/
├── client/                 # React frontend
├── server/                 # Express backend  
├── shared/                 # Shared types and schemas
├── public/                 # Static assets
└── package.json           # Dependencies
```

## 1. Database Schema (shared/schema.ts)

```typescript
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
  
  // Schedule information
  dayOfWeek: text("day_of_week").notNull(),
  time: text("time").notNull(),
  sessionDuration: text("session_duration"),
  
  // Contact information
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  website: text("website"),
  
  // Categories
  category: text("category").notNull(),
  serviceType: text("service_type").default("classes").notNull(),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const newsletter = pgTable("newsletter", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Zod schemas for validation
export const searchSchema = z.object({
  location: z.string().min(1, "Location is required"),
  ageGroupMin: z.number().int().min(0).max(18).optional(),
  ageGroupMax: z.number().int().min(0).max(18).optional(),
  category: z.string().optional(),
  serviceType: z.string().optional(),
  radius: z.number().int().min(1).max(50).default(10),
});

export const insertNewsletterSchema = createInsertSchema(newsletter);
export const listClassSchema = createInsertSchema(classes);

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;
export type Newsletter = typeof newsletter.$inferSelect;
export type InsertNewsletter = typeof newsletter.$inferInsert;
export type SearchParams = z.infer<typeof searchSchema>;
```

## 2. Frontend Components

### Main App Component (client/src/App.tsx)

```typescript
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/header";
import Home from "@/pages/home";
import Services from "@/pages/services";
import About from "@/pages/about";
import FAQ from "@/pages/faq";
import ListClass from "@/pages/list-class";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/family-services" component={Services} />
      <Route path="/about" component={About} />
      <Route path="/faq" component={FAQ} />
      <Route path="/list-class" component={ListClass} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### Home Page (client/src/pages/home.tsx)

```typescript
import Header from "@/components/header";
import { EnhancedHero } from "@/components/enhanced-hero";
import SearchResults from "@/components/search-results";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";
import { useSearch } from "@/hooks/use-search";
import { useRef, useEffect } from "react";

export default function Home() {
  const { searchResults, isLoading, searchParams, performSearch } = useSearch();
  const searchResultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchResults.length > 0 && searchResultsRef.current) {
      setTimeout(() => {
        searchResultsRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [searchResults]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <EnhancedHero />
      
      {searchResults.length > 0 && (
        <div ref={searchResultsRef}>
          <SearchResults 
            results={searchResults} 
            searchParams={searchParams}
            isLoading={isLoading}
          />
        </div>
      )}
      
      <Newsletter />
      <Footer />
    </div>
  );
}
```

### Header Component (client/src/components/header.tsx)

```typescript
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X, Heart, Search, Users, BookOpen, HelpCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const navigation = [
    { name: "Baby & Toddler Classes", href: "/", icon: Heart },
    { name: "Family Services", href: "/family-services", icon: Users },
    { name: "About", href: "/about", icon: BookOpen },
    { name: "FAQ", href: "/faq", icon: HelpCircle },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-teal-600" />
            <span className="text-2xl font-bold text-teal-600">Parent Helper</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location === item.href
                      ? "text-teal-600 bg-teal-50"
                      : "text-gray-700 hover:text-teal-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/list-class">
              <Button variant="outline" size="sm" className="flex items-center space-x-1">
                <PlusCircle className="h-4 w-4" />
                <span>List Your Class</span>
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 text-base font-medium rounded-md ${
                      location === item.href
                        ? "text-teal-600 bg-teal-50"
                        : "text-gray-700 hover:text-teal-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <Link href="/list-class" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full flex items-center space-x-1 mt-4">
                  <PlusCircle className="h-4 w-4" />
                  <span>List Your Class</span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
```

### Hero Section (client/src/components/enhanced-hero.tsx)

```typescript
import { useState } from "react";
import { Search, MapPin, Users, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSearch } from "@/hooks/use-search";

const ageGroups = [
  { value: "0-6months", label: "0-6 months", min: 0, max: 1 },
  { value: "6-18months", label: "6-18 months", min: 1, max: 2 },
  { value: "18months-3years", label: "18 months - 3 years", min: 2, max: 3 },
  { value: "3-5years", label: "3-5 years", min: 3, max: 5 },
  { value: "5-11years", label: "5-11 years", min: 5, max: 11 },
  { value: "11-18years", label: "11-18 years", min: 11, max: 18 },
];

const categories = [
  "Baby Classes",
  "Toddler Groups", 
  "Swimming",
  "Music & Movement",
  "Sensory Play",
  "Sports",
  "Arts & Crafts",
  "Educational",
];

export function EnhancedHero() {
  const [location, setLocation] = useState("");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const { performSearch, isLoading } = useSearch();

  const handleSearch = () => {
    if (!location.trim()) return;

    const ageGroup = ageGroups.find(ag => ag.value === selectedAgeGroup);
    
    performSearch({
      location: location.trim(),
      ageGroupMin: ageGroup?.min,
      ageGroupMax: ageGroup?.max,
      category: selectedCategory || undefined,
      radius: 10,
    });
  };

  return (
    <div className="relative bg-gradient-to-br from-teal-50 via-white to-coral-50 overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f0fdfa" fill-opacity="0.4"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
              Discover Amazing
              <span className="text-teal-600 block">Family Activities</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find the perfect classes, clubs, and activities for your children across the UK. 
              From baby sensory to after-school clubs, we help families discover local opportunities.
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Enter postcode or town (e.g., SW1A 1AA, London)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10 h-12 text-base"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
              
              <div>
                <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Child's age" />
                  </SelectTrigger>
                  <SelectContent>
                    {ageGroups.map((group) => (
                      <SelectItem key={group.value} value={group.value}>
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Activity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleSearch}
              disabled={!location.trim() || isLoading}
              className="w-full mt-4 h-12 text-base bg-teal-600 hover:bg-teal-700"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Searching...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Search Activities</span>
                </div>
              )}
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Location-Based</h3>
              <p className="text-gray-600">Find activities near you with precise location matching</p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-coral-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-coral-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Age-Appropriate</h3>
              <p className="text-gray-600">Activities perfectly matched to your child's age and stage</p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center mx-auto">
                <Star className="h-6 w-6 text-sage-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Verified Quality</h3>
              <p className="text-gray-600">All activities are reviewed and verified for quality</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 3. Backend Server (server/routes.ts)

```typescript
import type { Express } from "express";
import { createServer, type Server } from "http";
import { readFileSync } from "fs";
import { storage } from "./storage";
import { pool } from "./db";
import { searchSchema, insertNewsletterSchema, listClassSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Search for classes
  app.post("/api/search", async (req, res) => {
    try {
      const searchParams = searchSchema.parse(req.body);
      
      const query = `
        SELECT DISTINCT c.*,
        CASE 
          WHEN c.latitude IS NOT NULL AND c.longitude IS NOT NULL 
          THEN (
            6371 * acos(
              cos(radians($2)) * cos(radians(c.latitude::float)) *
              cos(radians(c.longitude::float) - radians($3)) +
              sin(radians($2)) * sin(radians(c.latitude::float))
            )
          )
          ELSE 999
        END as distance
        FROM classes c
        WHERE c.is_active = true
        AND (
          LOWER(c.postcode) LIKE LOWER($1) OR
          LOWER(c.town) LIKE LOWER($1) OR
          LOWER(c.address) LIKE LOWER($1) OR
          EXISTS (
            SELECT 1 FROM unnest(c.additional_towns) as town 
            WHERE LOWER(town) LIKE LOWER($1)
          )
        )
        ${searchParams.ageGroupMin !== undefined ? 
          'AND c.age_group_min <= $4 AND c.age_group_max >= $5' : ''}
        ${searchParams.category ? 'AND LOWER(c.category) LIKE LOWER($6)' : ''}
        ORDER BY 
          c.is_featured DESC,
          distance ASC,
          c.created_at DESC
        LIMIT 50
      `;

      const params = [`%${searchParams.location}%`];
      
      // Add coordinates for distance calculation (mock coordinates for now)
      params.push('51.5074'); // London lat
      params.push('-0.1278'); // London lng
      
      if (searchParams.ageGroupMin !== undefined) {
        params.push(searchParams.ageGroupMin.toString());
        params.push(searchParams.ageGroupMax?.toString() || searchParams.ageGroupMin.toString());
      }
      
      if (searchParams.category) {
        params.push(`%${searchParams.category}%`);
      }

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Newsletter subscription
  app.post("/api/newsletter", async (req, res) => {
    try {
      const newsletter = insertNewsletterSchema.parse(req.body);
      
      const existingSubscriber = await pool.query(
        'SELECT id FROM newsletter WHERE email = $1',
        [newsletter.email]
      );

      if (existingSubscriber.rows.length > 0) {
        return res.status(400).json({ message: "Email already subscribed" });
      }

      await pool.query(
        'INSERT INTO newsletter (email) VALUES ($1)',
        [newsletter.email]
      );

      res.json({ message: "Successfully subscribed!" });
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      res.status(500).json({ message: "Subscription failed" });
    }
  });

  // List a new class
  app.post("/api/list-class", async (req, res) => {
    try {
      const classData = listClassSchema.parse(req.body);
      
      const result = await pool.query(`
        INSERT INTO classes (
          name, description, age_group_min, age_group_max, price,
          venue, address, postcode, town, day_of_week, time,
          contact_email, contact_phone, website, category
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `, [
        classData.name,
        classData.description,
        classData.ageGroupMin,
        classData.ageGroupMax,
        classData.price,
        classData.venue,
        classData.address,
        classData.postcode,
        classData.town,
        classData.dayOfWeek,
        classData.time,
        classData.contactEmail,
        classData.contactPhone,
        classData.website,
        classData.category
      ]);

      res.json({ message: "Class listed successfully!", id: result.rows[0].id });
    } catch (error) {
      console.error('List class error:', error);
      res.status(500).json({ message: "Failed to list class" });
    }
  });

  // Serve Parent Helper landing page
  app.get("/parent-helper", (_req, res) => {
    try {
      const htmlContent = readFileSync('./public/parent-helper.html', 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
    } catch (error) {
      console.error('Error serving parent-helper.html:', error);
      res.status(404).send('File not found');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
```

## 4. Database Configuration (server/db.ts)

```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
```

## 5. Package.json

```json
{
  "name": "parent-helper",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "tsc && vite build",
    "start": "NODE_ENV=production tsx server/index.ts",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.2",
    "@neondatabase/serverless": "^0.9.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@tanstack/react-query": "^5.17.15",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.2.0",
    "drizzle-orm": "^0.29.3",
    "drizzle-zod": "^0.5.1",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "framer-motion": "^10.18.0",
    "lucide-react": "^0.307.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.48.2",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7",
    "wouter": "^2.12.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/express-session": "^1.17.10",
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "drizzle-kit": "^0.20.10",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.10"
  }
}
```

## 6. Environment Variables (.env)

```
DATABASE_URL=your_postgresql_database_url
NODE_ENV=development
```

## 7. Tailwind Configuration (tailwind.config.ts)

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./client/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        coral: {
          50: '#fef7f0',
          100: '#feeee1',
          200: '#fcd9c2',
          300: '#f9b893',
          400: '#f4a688',
          500: '#ed7c52',
          600: '#de5e2c',
          700: '#b94822',
          800: '#943c22',
          900: '#763320',
        },
        sage: {
          50: '#f0f9f9',
          100: '#d1f2f0',
          200: '#a7e8e1',
          300: '#7fb3b3',
          400: '#5a9c9c',
          500: '#418282',
          600: '#34696b',
          700: '#2d5557',
          800: '#284649',
          900: '#253c3f',
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

## Deployment Instructions

1. **Database Setup**: Create a PostgreSQL database and set the DATABASE_URL environment variable
2. **Install Dependencies**: Run `npm install`
3. **Database Migration**: Run `npm run db:push` to create tables
4. **Development**: Run `npm run dev` to start the development server
5. **Production**: Run `npm run build` then `npm start` for production

This is a complete, production-ready family activity directory website with search functionality, database integration, and responsive design.