# Parent Helper API Documentation

Your Express + TypeScript + Supabase backend is now running on `http://localhost:3000`!

## 🚀 Quick Start

1. **Set up your database**: Run the SQL in `database-setup.sql` in your Supabase SQL Editor
2. **Test the API**: Visit `http://localhost:3000` to see all available endpoints
3. **Start building**: Use the endpoints below to fetch class data

## 📋 Available Endpoints

### Health Check
```
GET /api/health
```
Returns server status.

### Get All Classes
```
GET /api/classes
```
Returns all active classes with optional filtering.

**Query Parameters:**
- `town` - Filter by town name
- `category` - Filter by category (sensory, swimming, music, yoga, playgroup)
- `ageGroup` - Filter by age group (baby, toddler, preschool)
- `featured` - Filter featured classes only (true/false)
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset

**Examples:**
```
GET /api/classes?town=Southampton
GET /api/classes?category=swimming&ageGroup=baby
GET /api/classes?featured=true&limit=10
```

### Get Featured Classes
```
GET /api/classes/featured
```
Returns featured classes only.

**Query Parameters:**
- `limit` - Number of results (default: 10)

### Get Classes by Town
```
GET /api/classes/town/:town
```
Returns classes in a specific town.

**Examples:**
```
GET /api/classes/town/Southampton
GET /api/classes/town/Portsmouth?limit=20
```

### Get Classes by Category
```
GET /api/classes/category/:category
```
Returns classes in a specific category.

**Examples:**
```
GET /api/classes/category/swimming
GET /api/classes/category/sensory?limit=15
```

### Get Single Class
```
GET /api/classes/:id
```
Returns a specific class by ID.

**Example:**
```
GET /api/classes/1
```

### Search Classes
```
GET /api/classes/search/:term
```
Search classes by name or description.

**Examples:**
```
GET /api/classes/search/baby
GET /api/classes/search/swimming?limit=10
```

### Get Categories
```
GET /api/categories
```
Returns all available categories.

### Get Towns
```
GET /api/towns
```
Returns all available towns.

## 📊 Response Format

All endpoints return JSON in this format:

```json
{
  "success": true,
  "data": [...],
  "count": 5,
  "error": null
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🗄️ Database Schema

The `classes` table has these columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `name` | VARCHAR(255) | Class name |
| `description` | TEXT | Class description |
| `venue` | VARCHAR(255) | Venue name |
| `town` | VARCHAR(100) | Town/city |
| `postcode` | VARCHAR(10) | Postcode |
| `address` | TEXT | Full address |
| `latitude` | DECIMAL(10,8) | GPS latitude |
| `longitude` | DECIMAL(11,8) | GPS longitude |
| `age_group_min` | INTEGER | Minimum age (months) |
| `age_group_max` | INTEGER | Maximum age (months) |
| `category` | VARCHAR(50) | Category (sensory, swimming, etc.) |
| `price` | VARCHAR(50) | Price information |
| `day_of_week` | VARCHAR(20) | Day of week |
| `time` | VARCHAR(50) | Time of day |
| `website` | VARCHAR(255) | Website URL |
| `contact_email` | VARCHAR(255) | Contact email |
| `contact_phone` | VARCHAR(20) | Contact phone |
| `is_featured` | BOOLEAN | Featured class flag |
| `rating` | VARCHAR(10) | Rating (e.g., "4.5") |
| `review_count` | INTEGER | Number of reviews |
| `popularity` | INTEGER | Popularity score |
| `is_active` | BOOLEAN | Active class flag |
| `created_at` | TIMESTAMP | Creation date |
| `updated_at` | TIMESTAMP | Last update date |

## 🛠️ Development

### File Structure
```
server/
├── index.ts              # Main server file
├── supabase.ts           # Supabase client & types
├── classes-service.ts    # Database operations
├── routes/
│   └── index.ts         # API routes
└── vite.ts              # Vite middleware
```

### Adding New Endpoints

1. Add the method to `ClassesService` in `server/classes-service.ts`
2. Add the route in `server/routes/index.ts`
3. Test with curl or your browser

### Environment Variables

The Supabase credentials are currently hardcoded. For production, move them to environment variables:

```bash
# .env file
SUPABASE_URL=https://mxvqkpefheroaailfpnc.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

## 🧪 Testing

Test the API with curl:

```bash
# Get all classes
curl http://localhost:3000/api/classes

# Get classes in Southampton
curl http://localhost:3000/api/classes?town=Southampton

# Get featured classes
curl http://localhost:3000/api/classes/featured

# Search for swimming classes
curl http://localhost:3000/api/classes/search/swimming
```

## 🚀 Next Steps

1. **Set up the database**: Run the SQL script in Supabase
2. **Add more data**: Insert your actual class data
3. **Build the frontend**: Create a React app to consume this API
4. **Add authentication**: Implement user authentication if needed
5. **Add more features**: Booking system, reviews, etc.

Your API is ready to power your Parent Helper application! 🎉 