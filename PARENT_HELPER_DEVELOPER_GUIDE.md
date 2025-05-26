# Parent Helper Platform - Complete Developer Guide

## Overview
A comprehensive digital platform connecting UK parents with local baby and toddler classes, offering intelligent location-based search and personalized recommendations for family activities.

**Current Status**: Production-ready with 5,684 authentic businesses across the UK

## Technology Stack
- **Frontend**: React.js with TypeScript, Vite, TailwindCSS, Wouter routing
- **Backend**: Node.js/Express with PostgreSQL
- **Database**: PostgreSQL with PostGIS for geospatial queries
- **UI Components**: Radix UI with shadcn/ui styling
- **Maps**: Leaflet for interactive mapping
- **Email**: SendGrid for notifications
- **Data**: 5,684 authentic businesses from Google Places API

## Project Structure

```
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── hero-search.tsx # Main search interface
│   │   │   ├── search-results.tsx # Results display
│   │   │   ├── class-card.tsx # Business card component
│   │   │   ├── interactive-map.tsx # Map integration
│   │   │   ├── coverage-map.tsx # Coverage visualization
│   │   │   ├── newsletter.tsx # Email signup
│   │   │   └── header.tsx, footer.tsx
│   │   ├── pages/             # Page components
│   │   │   ├── home.tsx       # Homepage
│   │   │   ├── about.tsx      # About page
│   │   │   ├── blog.tsx       # Blog listing
│   │   │   ├── list-class.tsx # Class submission form
│   │   │   └── blog-*.tsx     # Individual blog pages
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── use-search.ts  # Search functionality
│   │   │   ├── use-newsletter.ts # Newsletter management
│   │   │   └── use-toast.ts   # Toast notifications
│   │   ├── lib/               # Utility libraries
│   │   │   ├── queryClient.ts # React Query setup
│   │   │   ├── town-lookup.ts # UK town/postcode data
│   │   │   ├── postcode-lookup.ts # Postcode validation
│   │   │   ├── image-service.ts # Location images
│   │   │   └── utils.ts       # Common utilities
│   │   ├── App.tsx            # Main application router
│   │   └── main.tsx           # Application entry point
│   └── index.html             # HTML template
├── server/                     # Backend Express application
│   ├── db.ts                  # Database connection
│   ├── storage.ts             # Data access layer
│   ├── routes.ts              # API routes
│   ├── email-service.ts       # SendGrid integration
│   ├── instagram-sync.ts      # Instagram integration
│   ├── newsletter-automation.ts # Newsletter system
│   ├── index.ts               # Server entry point
│   └── vite.ts                # Vite integration
├── shared/                     # Shared TypeScript schemas
│   └── schema.ts              # Database and validation schemas
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite configuration
├── tailwind.config.ts         # TailwindCSS configuration
├── drizzle.config.ts          # Database configuration
└── tsconfig.json              # TypeScript configuration
```

## Database Schema

### Classes Table
The main business listings table with comprehensive information:

```typescript
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
```

### Newsletter Table
Email subscription management:

```typescript
export const newsletters = pgTable("newsletters", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  postcode: text("postcode"),
  isActive: boolean("is_active").default(true).notNull(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
});
```

### Blog Posts Table
Content management system:

```typescript
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
```

## API Endpoints

### Search API
**GET `/api/classes/search`**
Query parameters:
- `postcode` (required): UK postcode
- `ageGroup`: "baby" (0-12 months) or "toddler" (1-5 years)
- `category`: business category filter
- `dayOfWeek`: specific day filter
- `radius`: search radius in kilometers (default: 5)
- `priceFilter`: "free" or "paid"

### Newsletter API
**POST `/api/newsletter/subscribe`**
Body:
```json
{
  "email": "user@example.com",
  "postcode": "SW1A 1AA"
}
```

### Class Submission API
**POST `/api/classes/submit`**
Body includes business details for review and approval.

## Key Features

### 1. Smart Location Search
- Postcode-based search with configurable radius
- Geospatial queries using PostgreSQL PostGIS
- Population-based town assignment (>15,000 people)
- Multi-location support for businesses

### 2. Age Group Filtering
- Baby classes: 0-12 months
- Toddler classes: 1-5 years
- Precise age range matching

### 3. Interactive Maps
- Leaflet integration for map display
- Marker clustering for dense areas
- Click-to-view business details
- Coverage area visualization

### 4. Business Categories
- Music & Movement
- Swimming
- Sensory Play
- Baby Massage
- Yoga & Fitness
- Dance
- Arts & Crafts
- Educational

### 5. Transport & Accessibility
- Parking information
- Public transport links
- Wheelchair accessibility
- Buggy-friendly venues

### 6. Email System
- SendGrid integration for notifications
- Newsletter automation
- Class submission alerts
- Weekly updates to subscribers

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=localhost
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=database_name

# External APIs
GOOGLE_PLACES_API_KEY=your_google_places_key
SENDGRID_API_KEY=your_sendgrid_key

# Optional
GOOGLE_SHEETS_API_KEY=your_sheets_key
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
```

## Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation
```bash
# Clone repository
git clone <repository-url>
cd parent-helper

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:push

# Start development server
npm run dev
```

### Database Migration
```bash
# Push schema changes to database
npm run db:push

# For production deployments, use proper migrations
```

## Production Deployment

### Build Process
```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

### Database Considerations
- Enable PostGIS extension for geospatial queries
- Set up proper indexes on search columns
- Regular backups of authentic business data
- Monitor query performance for large datasets

### Performance Optimization
- API response caching for search results
- Image optimization for location photos
- CDN setup for static assets
- Database connection pooling

## Data Sources

### Authentic Business Data
The platform contains 5,684 verified businesses sourced from:
- Google Places API (primary source)
- Manual verification and curation
- Business owner submissions
- Local authority websites

### Data Quality Standards
- All businesses manually verified
- Complete contact information
- Accurate location data
- Current pricing and scheduling
- Regular data updates and validation

## Business Logic

### Search Algorithm
1. Postcode validation and geocoding
2. Radius-based geospatial query
3. Age group filtering by months
4. Category and day-of-week filtering
5. Popularity-based result ranking
6. Distance calculation and sorting

### Coverage Analysis
- Population density mapping
- Service gap identification
- Expansion opportunity analysis
- Regional coverage statistics

### Quality Assurance
- Duplicate business detection
- Data validation rules
- Regular contact information verification
- User feedback integration

## Styling & UI

### Design System
- TailwindCSS for utility-first styling
- Custom color palette for parent-friendly design
- Responsive design for mobile-first experience
- Accessible components following WCAG guidelines

### Color Scheme
```css
:root {
  --teal: #14b8a6;
  --dark-green: #065f46;
  --purple: #7c3aed;
  --sage-green: #84cc16;
  --coral: #f97316;
  --warm-gray: #f5f7fa;
}
```

### Component Library
- Radix UI primitives for accessibility
- shadcn/ui components for consistency
- Custom components for business-specific features
- Icon library using Lucide React

## Testing Strategy

### Frontend Testing
- Component unit tests with React Testing Library
- Integration tests for search functionality
- End-to-end tests for critical user journeys
- Accessibility testing with axe-core

### Backend Testing
- API endpoint testing
- Database query testing
- Email service integration testing
- Geospatial query validation

### Data Validation
- Postcode format validation
- Business information completeness
- Duplicate detection algorithms
- Contact information verification

## Monitoring & Analytics

### Performance Monitoring
- API response time tracking
- Database query performance
- Search result accuracy metrics
- User engagement analytics

### Business Metrics
- Search volume by location
- Popular categories and age groups
- Conversion rates for class bookings
- Newsletter subscription rates

## Security Considerations

### Data Protection
- GDPR compliance for user data
- Secure storage of contact information
- Regular security audits
- Encrypted data transmission

### API Security
- Rate limiting on search endpoints
- Input validation and sanitization
- SQL injection prevention
- CORS configuration

## Backup & Recovery

### Database Backups
Current backup files:
- `backup_complete_authentic_20250526_182253.sql` (2.7MB)
- `backup_authentic_classes_20250526_182300.csv` (2.7MB)

Backup strategy:
- Daily automated backups
- Weekly full database exports
- Monthly archive storage
- Disaster recovery procedures

## Future Enhancements

### Planned Features
- Mobile app development
- Advanced filtering options
- Business owner dashboard
- Review and rating system
- Booking integration
- Social media integration

### Technical Improvements
- GraphQL API implementation
- Real-time updates with WebSockets
- Advanced caching strategies
- Machine learning for recommendations
- Progressive Web App features

## Support & Maintenance

### Regular Maintenance Tasks
- Data validation and cleanup
- Contact information updates
- New business verification
- Performance optimization
- Security updates

### Monitoring Checklist
- [ ] Database performance
- [ ] API response times
- [ ] Email delivery rates
- [ ] Search accuracy
- [ ] User engagement metrics

## Contact Information

For technical support or development questions:
- Review this documentation
- Check the issue tracker
- Refer to component inline documentation
- Test API endpoints with provided examples

---

**Platform Statistics (Current)**
- **5,684 authentic businesses** across the UK
- **Complete coverage** of major UK cities
- **Production-ready** codebase
- **Comprehensive** parenting resource ecosystem

This platform represents a complete, authentic business directory that UK families can trust and use to find real activities for their children from birth through school age.