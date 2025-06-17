# Parent Helper - UK Family Activity Directory

> A comprehensive digital platform revolutionizing family activity discovery across the United Kingdom, with advanced geospatial data enhancement and multi-provider activity integration.

[![Live Demo](https://img.shields.io/badge/demo-live-green)](https://parenthelper.co.uk)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

## 🎯 Overview

Parent Helper is a sophisticated web application that helps UK families discover local activities, classes, and services for children from birth to 18 years old. The platform features intelligent search capabilities, location-based filtering, and comprehensive activity listings across multiple categories.

### Key Features

- **🔍 Smart Search**: Location-based search with postcode and town matching
- **👶 Age-Appropriate Filtering**: Activities matched to specific age groups and developmental stages
- **📍 Geospatial Integration**: Advanced coordinate-enhanced location matching
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **💌 Newsletter System**: Subscription management for family activity updates
- **🏢 Provider Portal**: Class listing system for activity providers
- **⚡ Real-time Results**: Fast search with database optimization
- **🎨 Modern UI**: Professional design with Parent Helper brand colors

## 🛠 Tech Stack

### Frontend
- **React 18** - Component-based UI library
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **Wouter** - Minimalist client-side routing
- **TanStack Query** - Server state management
- **Framer Motion** - Animation library
- **React Hook Form** - Form validation and handling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Modern icon library

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **PostgreSQL** - Primary database
- **Drizzle ORM** - Type-safe database toolkit
- **Zod** - Schema validation library
- **Express Session** - Session management

### Infrastructure & Tools
- **Vite** - Modern build tool and dev server
- **Drizzle Kit** - Database migration tool
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **TSX** - TypeScript execution environment

### Database
- **PostgreSQL** - Relational database with advanced geospatial features
- **Neon Database** - Serverless PostgreSQL platform

## 📁 Project Structure

```
parent-helper/
├── 📁 client/                    # React frontend application
│   ├── 📁 public/               # Static assets
│   ├── 📁 src/
│   │   ├── 📁 components/       # Reusable UI components
│   │   │   ├── ui/             # Base UI components (shadcn/ui)
│   │   │   ├── header.tsx      # Main navigation header
│   │   │   ├── footer.tsx      # Site footer
│   │   │   ├── enhanced-hero.tsx # Hero section with search
│   │   │   ├── search-results.tsx # Search results display
│   │   │   └── newsletter.tsx   # Newsletter subscription
│   │   ├── 📁 pages/           # Page components
│   │   │   ├── home.tsx        # Homepage
│   │   │   ├── services.tsx    # Family services page
│   │   │   ├── about.tsx       # About page
│   │   │   ├── faq.tsx         # FAQ page
│   │   │   └── list-class.tsx  # Provider class listing
│   │   ├── 📁 hooks/           # Custom React hooks
│   │   │   └── use-search.ts   # Search functionality hook
│   │   ├── 📁 lib/             # Utility libraries
│   │   │   └── queryClient.ts  # TanStack Query configuration
│   │   └── App.tsx             # Main application component
│   └── index.html              # HTML template
├── 📁 server/                   # Express backend application
│   ├── index.ts                # Server entry point
│   ├── routes.ts               # API route definitions
│   ├── db.ts                   # Database connection
│   ├── storage.ts              # Data access layer
│   └── vite.ts                 # Vite integration
├── 📁 shared/                   # Shared code between client and server
│   └── schema.ts               # Database schema and validation
├── 📁 public/                   # Static files served by Express
│   └── parent-helper.html      # Standalone landing page
├── 📁 attached_assets/          # Project assets and documentation
├── package.json                # Project dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── vite.config.ts              # Vite build configuration
├── drizzle.config.ts           # Database migration configuration
└── README.md                   # This documentation file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** database (local or cloud)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/parent-helper.git
   cd parent-helper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/parent_helper
   NODE_ENV=development
   SESSION_SECRET=your-session-secret-key
   ```

4. **Database setup**
   ```bash
   # Push schema to database
   npm run db:push
   
   # Optional: Open database studio
   npm run db:studio
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open application**
   Navigate to `http://localhost:5000` in your browser

## 🗄 Database Schema

### Classes Table
The main table storing family activity and class information:

```sql
CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  age_group_min INTEGER NOT NULL,
  age_group_max INTEGER NOT NULL,
  price TEXT,
  is_featured BOOLEAN DEFAULT false,
  venue TEXT NOT NULL,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  town TEXT NOT NULL,
  additional_towns TEXT[],
  latitude DECIMAL(10,8),
  longitude DECIMAL(10,8),
  search_radius_km INTEGER DEFAULT 5,
  
  -- Schedule Information
  day_of_week TEXT NOT NULL,
  time TEXT NOT NULL,
  session_duration TEXT,
  weekly_schedule_summary TEXT,
  
  -- Contact Information
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  
  -- Categorization
  category TEXT NOT NULL,
  service_type TEXT DEFAULT 'classes',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Newsletter Table
Stores email subscriptions:

```sql
CREATE TABLE newsletter (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:push     # Push schema changes to database
npm run db:studio   # Open Drizzle Studio (database GUI)

# Code Quality
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript compiler check
```

### Development Workflow

1. **Frontend Development**
   - React components are in `client/src/components/`
   - Pages are in `client/src/pages/`
   - Styles use Tailwind CSS classes
   - State management with TanStack Query

2. **Backend Development**
   - API routes in `server/routes.ts`
   - Database queries using Drizzle ORM
   - Validation with Zod schemas

3. **Database Changes**
   - Modify schema in `shared/schema.ts`
   - Run `npm run db:push` to apply changes

### Code Style Guidelines

- **TypeScript**: Strict mode enabled, full type coverage required
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS utility classes
- **File Naming**: kebab-case for files, PascalCase for components
- **Imports**: Absolute imports using `@/` prefix

## 🎨 Design System

### Brand Colors

```css
/* Primary Brand Colors */
--teal-600: #0d9488;     /* Primary brand color */
--coral-400: #f4a688;    /* Secondary accent */
--sage-400: #7fb3b3;     /* Tertiary accent */
--lavender-400: #b8a5c7; /* Quaternary accent */
--cream-50: #f5f1ed;     /* Background tint */

/* UI Colors */
--gray-900: #1f2937;     /* Primary text */
--gray-600: #4b5563;     /* Secondary text */
--gray-100: #f3f4f6;     /* Light backgrounds */
```

### Typography Scale

- **Headings**: Inter font family, weights 400-700
- **Body**: Inter font family, weight 400
- **Scale**: 4xl (2.25rem) → 3xl (1.875rem) → 2xl (1.5rem) → xl (1.25rem) → lg (1.125rem) → base (1rem)

### Component Library

Built on Radix UI primitives with custom styling:
- **Button**: Multiple variants (default, outline, ghost)
- **Input**: Form inputs with validation states
- **Select**: Dropdown selections with search
- **Badge**: Status and category indicators
- **Card**: Content containers
- **Dialog**: Modal interactions
- **Toast**: Notification system

## 🔌 API Reference

### Search Endpoint

**POST** `/api/search`

Search for family activities and classes.

```typescript
// Request Body
{
  location: string;        // Postcode, town, or address
  ageGroupMin?: number;    // Minimum age (0-18)
  ageGroupMax?: number;    // Maximum age (0-18)  
  category?: string;       // Activity category
  serviceType?: string;    // Service type filter
  radius?: number;         // Search radius in km (default: 10)
}

// Response
{
  id: number;
  name: string;
  description: string;
  ageGroupMin: number;
  ageGroupMax: number;
  price: string | null;
  venue: string;
  address: string;
  postcode: string;
  town: string;
  dayOfWeek: string;
  time: string;
  category: string;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  distance: number;        // Distance in kilometers
}[]
```

### Newsletter Subscription

**POST** `/api/newsletter`

Subscribe to the Parent Helper newsletter.

```typescript
// Request Body
{
  email: string;          // Valid email address
}

// Response
{
  message: string;        // Success or error message
}
```

### List Class

**POST** `/api/list-class`

Submit a new class or activity listing.

```typescript
// Request Body
{
  name: string;
  description: string;
  ageGroupMin: number;
  ageGroupMax: number;
  price?: string;
  venue: string;
  address: string;
  postcode: string;
  town: string;
  dayOfWeek: string;
  time: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  category: string;
}

// Response
{
  message: string;
  id: number;            // Created class ID
}
```

## 🌍 Deployment

### Production Environment

1. **Environment Variables**
   ```env
   DATABASE_URL=postgresql://user:pass@host:5432/db
   NODE_ENV=production
   SESSION_SECRET=secure-random-string
   PORT=5000
   ```

2. **Database Migration**
   ```bash
   npm run db:push
   ```

3. **Build and Start**
   ```bash
   npm run build
   npm start
   ```

### Platform-Specific Deployment

#### Replit Deployment
- Configured with automatic deployment
- Database provisioning included
- Environment variables via Secrets tab

#### Railway
```bash
railway login
railway init
railway add postgresql
railway deploy
```

#### Vercel + PlanetScale
```bash
vercel --prod
# Configure DATABASE_URL in Vercel dashboard
```

#### Traditional VPS
```bash
# PM2 process management
npm install -g pm2
pm2 start "npm start" --name parent-helper
pm2 startup
pm2 save
```

## 📊 Performance Optimization

### Database Optimization

1. **Indexes**
   ```sql
   CREATE INDEX idx_classes_location ON classes(postcode, town);
   CREATE INDEX idx_classes_age ON classes(age_group_min, age_group_max);
   CREATE INDEX idx_classes_category ON classes(category);
   CREATE INDEX idx_classes_active ON classes(is_active);
   CREATE INDEX idx_classes_featured ON classes(is_featured);
   ```

2. **Query Optimization**
   - Pagination for large result sets
   - Geographic distance calculations
   - Full-text search capabilities

### Frontend Optimization

- **Code Splitting**: Route-based chunks
- **Image Optimization**: WebP format with fallbacks
- **Caching**: TanStack Query for API responses
- **Bundle Analysis**: Vite bundle analyzer

### Monitoring

- **Error Tracking**: Console error logging
- **Performance**: Web Vitals monitoring
- **Database**: Query performance analysis

## 🧪 Testing

### Test Structure
```bash
npm run test          # Run all tests
npm run test:unit     # Unit tests only
npm run test:e2e      # End-to-end tests
npm run test:coverage # Coverage report
```

### Testing Stack
- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **API Tests**: Supertest
- **Database Tests**: Test database with migrations

## 🔐 Security

### Implemented Security Measures

1. **Input Validation**: Zod schema validation on all inputs
2. **SQL Injection Prevention**: Parameterized queries with Drizzle ORM
3. **XSS Protection**: React's built-in escaping + CSP headers
4. **Session Security**: Secure session configuration
5. **Environment Variables**: Sensitive data via environment variables
6. **HTTPS**: SSL/TLS in production environments

### Security Checklist

- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] API rate limiting implemented
- [ ] Input sanitization verified
- [ ] Authentication system tested
- [ ] CORS configuration reviewed

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards

- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier configuration
- **Commit Messages**: Conventional commits format
- **Testing**: Required for new features
- **Documentation**: Update README for significant changes

### Issue Reporting

Use GitHub Issues with the following labels:
- `bug`: Something isn't working
- `enhancement`: New feature request
- `documentation`: Documentation improvements
- `help wanted`: Community assistance needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Drizzle Team** - Type-safe database toolkit
- **Vercel** - Inspiration for development experience
- **Parent Helper Community** - Feature requests and feedback

## 📞 Support

- **Documentation**: [docs.parenthelper.co.uk](https://docs.parenthelper.co.uk)
- **Email**: support@parenthelper.co.uk
- **GitHub Issues**: [GitHub Repository](https://github.com/your-username/parent-helper/issues)

---

**Built with ❤️ for UK families**

*Helping parents discover amazing activities for their children across the United Kingdom.*