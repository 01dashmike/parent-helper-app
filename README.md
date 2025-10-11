# Parent Helper App (Astro Edition)

A comprehensive digital platform for discovering baby and toddler activities across the United Kingdom, with advanced search capabilities and authentic class data.

## Features

- Smart Search: Find classes by town name, postcode, or class type
- Radius Filtering: Adjustable search radius from 3-20 miles
- Real-time Results: Instant search with live data from Supabase and PostgreSQL
- Responsive Design: Mobile-first interface with TailwindCSS
- Authentic Data: 7,400+ verified baby and toddler classes

## Technology Stack

- **Frontend**: Astro (SSG) + React Islands + TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **Database**: Supabase (primary) + PostgreSQL (fallback)
- **Backend**: Node.js + Express
- **Deployment**: Cloudflare Pages (static hosting)

## Quick Start

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Start development server**: `npm run dev`
4. **Visit**: http://localhost:4321

## Environment Setup

Create `.env` file with:
```
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
DATABASE_URL=postgresql_connection_string
```

## Project Structure

```
├── src/
│   ├── components/      # React & Astro UI components
│   ├── pages/           # Astro pages (routes)
│   ├── lib/             # Database clients
│   └── styles/          # Tailwind CSS
├── functions/           # Cloudflare Pages Functions
├── public/              # Static assets
├── .github/workflows/   # CI/CD
```

## Cloudflare Pages Deployment

- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Environment variables (Production & Preview)**:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`

## Supabase + Cloudflare Setup

In Cloudflare Pages → Settings → Environment variables:
- PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
- PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
- SUPABASE_SERVICE_ROLE=YOUR_SERVICE_ROLE_KEY (server only)

Local development: create a .env file with the same three variables.
- PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are browser-safe and used in client code.
- SUPABASE_SERVICE_ROLE is server-only and must never be exposed to the browser.

For browser code, use the shared client in `src/lib/supabase.ts`:
```ts
import { supabase } from '@/lib/supabase';
```
For server code (Cloudflare Functions), use:
```ts
import { createClient } from '@supabase/supabase-js';
export const onRequestGet = async (ctx) => {
  const url = ctx.env.PUBLIC_SUPABASE_URL;
  const serviceKey = ctx.env.SUPABASE_SERVICE_ROLE;
  const supabase = createClient(url, serviceKey);
  // ...
};
```
Never include SUPABASE_SERVICE_ROLE in browser code.

## Supabase Notes

- Only PUBLIC_* env vars are exposed to the browser.
- All Supabase calls use the helper in `src/lib/supabase.ts`.

## Local Development

- Run `npm run dev` for Astro local server.
- Run `npm run build` to generate static output in `/dist`.
- Lint and format: `npm run lint`, `npm run format`.

## API Endpoints

- `/api/health` (Cloudflare Pages Function): returns `{ "status": "ok" }`

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License - Built for families across the UK

---

**Migrated to Astro SSG + React Islands. Ready for Cloudflare Pages!**
