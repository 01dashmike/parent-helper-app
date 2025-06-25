# Parent Helper App

// Trigger redeploy

A comprehensive digital platform for discovering baby and toddler activities across the United Kingdom, with advanced search capabilities and authentic class data.

## Features

- **Smart Search**: Find classes by town name, postcode, or class type
- **Radius Filtering**: Adjustable search radius from 3-20 miles
- **Real-time Results**: Instant search with live data from Supabase and PostgreSQL
- **Responsive Design**: Mobile-first interface with TailwindCSS
- **Authentic Data**: 7,400+ verified baby and toddler classes

## Technology Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **Database**: Supabase (primary) + PostgreSQL (fallback)
- **Backend**: Node.js + Express
- **Deployment**: Replit Deployments

## Quick Start

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Start development server**: `npm run dev`
4. **Visit**: http://localhost:5000

## Environment Setup

Create `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
DATABASE_URL=postgresql_connection_string
```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── lib/           # Database clients
│   │   └── App.tsx        # Main app
├── server/                # Express backend
│   ├── routes.ts          # API routes
│   └── storage.ts         # Database layer
├── shared/                # Shared types
└── public/                # Static assets
```

## Search Features

- **Town Search**: Find classes in specific towns
- **Postcode Search**: Search by UK postcodes (e.g., "SP10", "BN1")
- **Category Filter**: Filter by activity type
- **Day Filter**: Find classes on specific days
- **Radius Control**: Limit results by distance

## Database Integration

The app uses a smart fallback system:
1. **Primary**: Supabase with `town_name` column
2. **Fallback**: PostgreSQL API with comprehensive class data

## Deployment

Deploy through Replit's one-click deployment system. The app is production-ready with:
- Optimized builds
- Environment variable support
- Automatic SSL/TLS
- Global CDN distribution

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License - Built for families across the UK# Updated Wed Jun 25 21:09:56 BST 2025
